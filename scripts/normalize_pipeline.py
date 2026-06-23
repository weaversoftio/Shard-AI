#!/usr/bin/env python3
"""
normalize_pipeline.py  –  Shard-AI normalization CLI
Usage:
  python normalize_pipeline.py --mode lined  --input <pdf> --output-dir <dir>
  python normalize_pipeline.py --mode blank  --input <pdf> --output-dir <dir>

Required packages: opencv-python-headless numpy pymupdf scipy

Prints a single JSON object to stdout with keys:
  status       "ok" | "warning" | "error"
  error_type   PARTIAL_FRAME | MISSING_SIGNATURE | TOO_FEW_LINES | PROCESSING_ERROR
  line_count   number of writing lines surviving after empty-crop filtering
  message      optional detail string
  norm_dir     (ok/warning) path to normalized crops dir
"""
import sys, json, os, base64, argparse, shutil
import warnings
warnings.filterwarnings('ignore')

import cv2
import numpy as np
from pathlib import Path
import fitz
import anthropic
from scipy.signal import find_peaks
from scipy.ndimage import uniform_filter1d

# ── Constants ────────────────────────────────────────────────────────────────

SKIP_TOP        = 20
PAD_BOTTOM      = 20
SIGNATURE_TOKEN = "_signature"
COLUMN_TOKEN    = "_COLUMNS"

SEG_MIN_COMP_H  = 5
SEG_MIN_COMP_W  = 4
SEG_MIN_WORD_W  = 15
SEG_GAP_MULT    = 1.9
SEG_PADDING     = 4
SEG_TOP_MARGIN  = 25

# ── PDF Loading ───────────────────────────────────────────────────────────────

def pdf_to_bgr_pages(path, dpi=300):
    doc   = fitz.open(path)
    scale = dpi / 72
    mat   = fitz.Matrix(scale, scale)
    pages = []
    for page in doc:
        pix = page.get_pixmap(matrix=mat)
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR if pix.n == 4 else cv2.COLOR_RGB2BGR)
        pages.append(img)
    return pages

# ── Frame Detection ───────────────────────────────────────────────────────────

def detect_and_crop_frame(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img.copy()
    h, w = gray.shape

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (w // 5, 1))
    h_lines  = cv2.morphologyEx(binary, cv2.MORPH_OPEN, h_kernel)
    row_sums = uniform_filter1d(h_lines.sum(axis=1).astype(float), size=5)
    if row_sums.max() == 0:
        return None
    h_peaks, _ = find_peaks(row_sums, height=row_sums.max() * 0.3, distance=h // 10)

    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, h // 5))
    v_lines  = cv2.morphologyEx(binary, cv2.MORPH_OPEN, v_kernel)
    col_sums = uniform_filter1d(v_lines.sum(axis=0).astype(float), size=5)
    if col_sums.max() == 0:
        return None
    v_peaks, _ = find_peaks(col_sums, height=col_sums.max() * 0.3, distance=w // 10)

    if len(h_peaks) < 2 or len(v_peaks) < 2:
        return None

    y_top,  y_bottom = int(h_peaks[0]),  int(h_peaks[-1])
    x_left, x_right  = int(v_peaks[0]),  int(v_peaks[-1])

    if (y_bottom - y_top) < h * 0.5 or (x_right - x_left) < w * 0.5:
        return None

    return img[y_top:y_bottom, x_left:x_right]

# ── Corner Mark Removal ───────────────────────────────────────────────────────

def remove_corner_marks(img, corner_h_ratio=0.18, corner_w_ratio=0.10, min_area=150):
    result = img.copy()
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img.copy()
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    ch = int(h * corner_h_ratio)
    cw = int(w * corner_w_ratio)

    corners = [
        (0,      ch,      0,      cw),
        (0,      ch,      w - cw, w),
        (h - ch, h,       0,      cw),
        (h - ch, h,       w - cw, w),
    ]

    for ry1, ry2, cx1, cx2 in corners:
        roi_bin = np.zeros_like(binary)
        roi_bin[ry1:ry2, cx1:cx2] = binary[ry1:ry2, cx1:cx2]
        n, labels, stats, _ = cv2.connectedComponentsWithStats(roi_bin, connectivity=8)
        for lbl in range(1, n):
            if stats[lbl, cv2.CC_STAT_AREA] >= min_area:
                bx = stats[lbl, cv2.CC_STAT_LEFT];  by = stats[lbl, cv2.CC_STAT_TOP]
                bw = stats[lbl, cv2.CC_STAT_WIDTH];  bh = stats[lbl, cv2.CC_STAT_HEIGHT]
                result[by:by + bh, bx:bx + bw] = 255
    return result

# ── Line Detection ────────────────────────────────────────────────────────────

def detect_printed_lines(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    row_sums = np.zeros(h, dtype=float)
    for kw in [w // 12, w // 8, w // 5]:
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kw, 1))
        mask = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        row_sums += mask.sum(axis=1).astype(float)

    row_sums = uniform_filter1d(row_sums, size=5)
    min_dist  = h // 50
    threshold = row_sums.max() * 0.08
    peaks, _  = find_peaks(row_sums, height=threshold, distance=min_dist)
    return sorted(peaks.tolist())

# ── Line Cropping ─────────────────────────────────────────────────────────────

def crop_lines(img, line_ys, out_dir, basename, skip_top=SKIP_TOP, pad_bottom=PAD_BOTTOM):
    h = img.shape[0]
    saved = []

    spacings = [line_ys[i + 1] - line_ys[i] for i in range(len(line_ys) - 2)]
    median_spacing = int(np.median(spacings)) if spacings else h // 20

    y1_first = max(0, line_ys[0] - median_spacing + skip_top)
    y2_first = min(h, line_ys[0] + pad_bottom)
    path = os.path.join(out_dir, f"{basename}_line_01.png")
    cv2.imwrite(path, img[y1_first:y2_first, :])
    saved.append(path)

    for i in range(len(line_ys) - 2):
        y1 = min(h, line_ys[i]     + skip_top)
        y2 = min(h, line_ys[i + 1] + pad_bottom)
        path = os.path.join(out_dir, f"{basename}_line_{i + 2:02d}.png")
        cv2.imwrite(path, img[y1:y2, :])
        saved.append(path)

    y1_sig = min(h, line_ys[-2] + skip_top)
    y2_sig = min(h, line_ys[-1] + pad_bottom)
    if y2_sig > y1_sig + 5:
        path = os.path.join(out_dir, f"{basename}{SIGNATURE_TOKEN}.png")
        cv2.imwrite(path, img[y1_sig:y2_sig, :])
        saved.append(path)

    return saved

# ── Normalization ─────────────────────────────────────────────────────────────

def normalize_image(img_bgr):
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr.copy()

    gray = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 10)

    kernel = np.ones((2, 2), np.uint8)
    opened = cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel, iterations=1)
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(255 - opened, connectivity=8)
    output = np.zeros_like(opened)
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] >= 10:
            output[labels == i] = 255
    gray = 255 - output

    coords = cv2.findNonZero(255 - gray)
    if coords is not None:
        x, y, w, h = cv2.boundingRect(coords)
        y = max(0, y - 20)
        h = min(gray.shape[0] - y, h + 40)
        gray = gray[y:y+h, :]

    return gray

# ── Word Segmentation ─────────────────────────────────────────────────────────

def _seg_get_comps(binary):
    if binary.shape[0] < 5:
        return []
    num_labels, _labels, stats, _ = cv2.connectedComponentsWithStats(binary, connectivity=8)
    comps = []
    for i in range(1, num_labels):
        x = stats[i, cv2.CC_STAT_LEFT];  y = stats[i, cv2.CC_STAT_TOP]
        w = stats[i, cv2.CC_STAT_WIDTH]; h = stats[i, cv2.CC_STAT_HEIGHT]
        if w >= SEG_MIN_COMP_W and h >= SEG_MIN_COMP_H:
            comps.append((x, y, w, h))
    return comps


def _seg_median_gap(comps):
    if len(comps) < 2:
        return 20
    gaps = [comps[i][0] - (comps[i-1][0] + comps[i-1][2]) for i in range(1, len(comps))]
    pos_gaps = [g for g in gaps if g > 0]
    return float(np.median(pos_gaps)) * SEG_GAP_MULT if pos_gaps else 20


def _seg_merge_comps(comps, max_gap=None):
    if not comps:
        return []
    comps = sorted(comps, key=lambda b: b[0])
    thresh = _seg_median_gap(comps)
    if max_gap is not None:
        thresh = min(thresh, max_gap)
    merged = []
    cx, cy, cw, ch = comps[0]
    for (x, y, w, h) in comps[1:]:
        if x - (cx + cw) <= thresh:
            right  = max(cx + cw, x + w);   bottom = max(cy + ch, y + h)
            cx, cy = min(cx, x), min(cy, y); cw, ch = right - cx, bottom - cy
        else:
            if cw >= SEG_MIN_WORD_W:
                merged.append((cx, cy, cw, ch))
            cx, cy, cw, ch = x, y, w, h
    if cw >= SEG_MIN_WORD_W:
        merged.append((cx, cy, cw, ch))
    return merged


def get_word_boxes(img_bgr):
    """Return word bounding boxes from a line crop. Empty list means no handwriting."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr.copy()
    h, w = gray.shape
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Remove ALL detected horizontal lines (printed template rules).
    # Using argmax only removed the single strongest line; here we zero every
    # row whose line-open signal exceeds 25% of the peak, catching both the
    # top and bottom rules that appear in each line strip.
    kernel_w = max(30, w // 6)
    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_w, 1))
    h_lines  = cv2.morphologyEx(binary, cv2.MORPH_OPEN, h_kernel)
    row_sums = h_lines.sum(axis=1)
    if row_sums.max() > 0:
        line_thresh = row_sums.max() * 0.25
        for y_pos in np.where(row_sums > line_thresh)[0]:
            binary[max(0, y_pos - 5):y_pos + 6, :] = 0

    # Remove top margin and left/right edge pixels to kill frame-border artifacts.
    # detect_and_crop_frame crops to the CENTER of the frame lines, so up to half
    # the bar thickness remains at each edge. 20px covers bars up to ~40px thick.
    binary[:SEG_TOP_MARGIN, :] = 0
    binary[:, :20] = 0
    binary[:, w - 20:] = 0

    comps = _seg_get_comps(binary)
    comps = [(x, y, cw, ch) for (x, y, cw, ch) in comps if y >= SEG_TOP_MARGIN]
    # Cap merge gap so two far-apart edge remnants can never merge into a
    # full-width box (self-referential threshold would otherwise set thresh
    # to their own gap × SEG_GAP_MULT, which is always larger than the gap).
    return _seg_merge_comps(comps, max_gap=w // 5)

# ── Column Detection (Blank Page) ─────────────────────────────────────────────

def detect_frame_bounds(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (w // 5, 1))
    h_lines  = cv2.morphologyEx(binary, cv2.MORPH_OPEN, h_kernel)
    row_sums = uniform_filter1d(h_lines.sum(axis=1).astype(float), size=5)
    h_peaks, _ = find_peaks(row_sums, height=row_sums.max() * 0.3, distance=h // 10)

    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, h // 5))
    v_lines  = cv2.morphologyEx(binary, cv2.MORPH_OPEN, v_kernel)
    col_sums = uniform_filter1d(v_lines.sum(axis=0).astype(float), size=5)
    v_peaks, _ = find_peaks(col_sums, height=col_sums.max() * 0.3, distance=w // 10)

    margin = 15
    y_top    = int(h_peaks[0])  + margin if len(h_peaks) >= 2 else 0
    y_bottom = int(h_peaks[-1]) - margin if len(h_peaks) >= 2 else h
    x_left   = int(v_peaks[0])  + margin if len(v_peaks) >= 2 else 0
    x_right  = int(v_peaks[-1]) - margin if len(v_peaks) >= 2 else w

    return x_left, y_top, x_right, y_bottom


def _bands_from_profile(profile, threshold_ratio, min_gap):
    thresh  = profile.max() * threshold_ratio
    in_band = profile > thresh
    raw, start = [], None
    for i, val in enumerate(in_band):
        if val and start is None:
            start = i
        elif not val and start is not None:
            raw.append([start, i]);  start = None
    if start is not None:
        raw.append([start, len(profile)])
    merged = []
    for b in raw:
        if merged and b[0] - merged[-1][1] < min_gap:
            merged[-1][1] = b[1]
        else:
            merged.append(b)
    return merged


def _filter_isolated_bands(bands):
    if len(bands) < 2:
        return bands
    gaps       = [bands[i][0] - bands[i - 1][1] for i in range(1, len(bands))]
    median_gap = float(np.median(gaps))
    max_gap    = max(median_gap * 4, 20)
    kept       = [bands[0]]
    for i in range(1, len(bands)):
        if (bands[i][0] - kept[-1][1]) <= max_gap:
            kept.append(bands[i])
    return kept


def column_detection(img, out_dir, basename, source_img=None):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    fx1, fy1, fx2, fy2 = detect_frame_bounds(img)
    gray_inner = gray[fy1:fy2, fx1:fx2]
    hi, wi = gray_inner.shape
    _, binary = cv2.threshold(gray_inner, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    n, labels, stats, _ = cv2.connectedComponentsWithStats(binary, connectivity=8)
    clean = binary.copy()
    for lbl in range(1, n):
        bx = stats[lbl, cv2.CC_STAT_LEFT]; by = stats[lbl, cv2.CC_STAT_TOP]
        bw = stats[lbl, cv2.CC_STAT_WIDTH]; bh = stats[lbl, cv2.CC_STAT_HEIGHT]
        if bx == 0 or by == 0 or bx + bw >= wi or by + bh >= hi:
            clean[labels == lbl] = 0

    # Zero out edge strips to kill any residual frame border that survived component filtering
    edge = max(50, wi // 40)
    clean[:, :edge] = 0
    clean[:, wi - edge:] = 0
    clean[:edge, :] = 0
    clean[hi - edge:, :] = 0

    # Use finer smoothing and smaller min_gap so closely-spaced columns aren't merged
    col_profile = uniform_filter1d(clean.sum(axis=0).astype(float), size=max(1, wi // 120))
    raw_bands   = _bands_from_profile(col_profile, threshold_ratio=0.02,
                                      min_gap=max(3, wi // 300))
    col_bands   = [b for b in raw_bands if (b[1] - b[0]) >= 20]
    vis            = img.copy()
    col_boxes      = []
    min_col_height = hi // 5
    real_col_idx   = 0

    for cx1, cx2 in col_bands:
        strip    = clean[:, cx1:cx2]
        row_prof = uniform_filter1d(strip.sum(axis=1).astype(float), size=3)
        y_bands  = _bands_from_profile(row_prof, threshold_ratio=0.03, min_gap=3)
        y_bands  = _filter_isolated_bands(y_bands)
        if not y_bands:
            continue
        cy1, cy2 = y_bands[0][0], y_bands[-1][1]
        if (cy2 - cy1) < min_col_height:
            continue
        abs_cx1, abs_cy1 = fx1 + cx1, fy1 + cy1
        abs_cx2, abs_cy2 = fx1 + cx2, fy1 + cy2

        # Claude verifies each candidate: crop from source_img (original scan) for best quality
        verify_src = source_img if source_img is not None else img
        sh, sw = verify_src.shape[:2]
        ih, iw = img.shape[:2]
        sx1 = int(abs_cx1 * sw / iw); sy1 = int(abs_cy1 * sh / ih)
        sx2 = int(abs_cx2 * sw / iw); sy2 = int(abs_cy2 * sh / ih)
        col_crop = verify_src[sy1:sy2, sx1:sx2]
        if not _claude_verify_column(col_crop):
            print(f'[vision] column ({cx1},{cx2}) rejected', file=sys.stderr)
            continue

        real_col_idx += 1
        col_boxes.append((abs_cx1, abs_cy1, abs_cx2, abs_cy2))
        cv2.rectangle(vis, (abs_cx1, abs_cy1), (abs_cx2, abs_cy2), (0, 0, 255), 3)
        cv2.putText(vis, f"col {real_col_idx}", (abs_cx1 + 4, abs_cy1 + 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)

    # Save column visualization
    cv2.imwrite(os.path.join(out_dir, f"{basename}{COLUMN_TOKEN}.png"), vis)

    return col_boxes

# ── Validation: Lined Page ────────────────────────────────────────────────────

def validate_lined(pdf_path, output_dir):
    try:
        pages = pdf_to_bgr_pages(pdf_path)
        if not pages:
            return {"status": "error", "error_type": "NO_PAGES"}

        page   = pages[0]
        framed = detect_and_crop_frame(page)
        if framed is None:
            return {"status": "error", "error_type": "PARTIAL_FRAME"}

        cleaned = remove_corner_marks(framed, corner_h_ratio=0.18, corner_w_ratio=0.10)
        line_ys = detect_printed_lines(cleaned)

        if len(line_ys) < 2:
            return {"status": "error", "error_type": "TOO_FEW_LINES", "line_count": 0}

        os.makedirs(output_dir, exist_ok=True)
        basename   = Path(pdf_path).stem
        crop_paths = crop_lines(cleaned, line_ys, output_dir, basename)

        # Normalize each crop, then filter out those with 0 word boxes.
        # Survivors are saved twice: grayscale to normalized/ and BGR annotated to segmentation/.
        norm_dir = os.path.join(output_dir, "normalized")
        seg_dir  = os.path.join(output_dir, "segmentation")
        os.makedirs(norm_dir, exist_ok=True)
        os.makedirs(seg_dir,  exist_ok=True)

        surviving_line_files  = []
        signature_survived    = False

        for crop_path in crop_paths:
            crop_img = cv2.imread(crop_path)
            if crop_img is None:
                continue

            normalized = normalize_image(crop_img)           # grayscale
            norm_bgr   = cv2.cvtColor(normalized, cv2.COLOR_GRAY2BGR)
            word_boxes = get_word_boxes(norm_bgr)            # boxes on normalized image

            if len(word_boxes) == 0:
                os.remove(crop_path)
                continue

            # Require at least one box tall enough to be real handwriting.
            # At 300 DPI the shortest plausible letter is ~15px; thinner boxes
            # are printed-rule remnants or CamScanner noise.
            if max(bh for (_, _, _, bh) in word_boxes) < 15:
                os.remove(crop_path)
                continue

            fname = os.path.basename(crop_path)

            # Normalized (grayscale, no annotations)
            cv2.imwrite(os.path.join(norm_dir, fname), normalized)

            # Segmentation (BGR, green word-box rectangles)
            vis = norm_bgr.copy()
            for (x, y, bw, bh) in word_boxes:
                x1 = max(x - SEG_PADDING, 0);          y1 = max(y - SEG_PADDING, 0)
                x2 = min(x + bw + SEG_PADDING, vis.shape[1] - 1)
                y2 = min(y + bh + SEG_PADDING, vis.shape[0] - 1)
                cv2.rectangle(vis, (x1, y1), (x2, y2), (0, 200, 0), 2)
            cv2.imwrite(os.path.join(seg_dir, fname), vis)

            if SIGNATURE_TOKEN in fname:
                signature_survived = True
            else:
                surviving_line_files.append(fname)

        writing_lines = len(surviving_line_files)

        if not signature_survived:
            return {"status": "error", "error_type": "MISSING_SIGNATURE",
                    "line_count": writing_lines}

        if writing_lines <= 9:
            return {"status": "error", "error_type": "TOO_FEW_LINES",
                    "line_count": writing_lines}

        if writing_lines <= 14:
            return {"status": "warning", "error_type": "FEW_LINES",
                    "line_count": writing_lines, "norm_dir": norm_dir, "seg_dir": seg_dir}

        return {"status": "ok", "line_count": writing_lines,
                "norm_dir": norm_dir, "seg_dir": seg_dir}

    except Exception as e:
        return {"status": "error", "error_type": "PROCESSING_ERROR", "message": str(e)}

# ── Claude Vision: per-column numeric check ───────────────────────────────────

def _claude_verify_column(col_img_bgr):
    """
    Ask Claude Vision whether a detected column strip is actually handwritten numbers.
    Returns True (keep), False (discard). Fails open (True) if API is unavailable.
    """
    api_key = os.environ.get('ANTHROPIC_API_KEY') or os.environ.get('CLAUDE_API_KEY')
    print(f'[vision] api_key found: {bool(api_key)}', file=sys.stderr)
    if not api_key:
        print('[vision] no API key — keeping column by default', file=sys.stderr)
        return True
    try:
        _, buf = cv2.imencode('.jpg', col_img_bgr, [cv2.IMWRITE_JPEG_QUALITY, 85])
        b64 = base64.b64encode(buf.tobytes()).decode('utf-8')
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=5,
            messages=[{
                'role': 'user',
                'content': [
                    {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': b64}},
                    {'type': 'text',  'text': 'Does this image show a column of handwritten numbers? Answer only YES or NO.'},
                ]
            }]
        )
        answer = response.content[0].text.strip().upper()
        print(f'[vision] column answer: {answer}', file=sys.stderr)
        return answer.startswith('YES')
    except Exception as e:
        print(f'[vision] error: {e}', file=sys.stderr)
        return True  # fail open

# ── Validation: Blank Page ────────────────────────────────────────────────────

def validate_blank(pdf_path, output_dir):
    try:
        pages = pdf_to_bgr_pages(pdf_path)
        if not pages:
            return {"status": "error", "error_type": "NO_PAGES"}

        page   = pages[0]
        framed = detect_and_crop_frame(page)
        if framed is None:
            return {"status": "error", "error_type": "PARTIAL_FRAME"}

        basename  = Path(pdf_path).stem
        norm_gray = normalize_image(framed)
        norm_bgr  = cv2.cvtColor(norm_gray, cv2.COLOR_GRAY2BGR)
        os.makedirs(output_dir, exist_ok=True)

        # norm_bgr drives detection + visualization; framed gives Claude better quality crops
        col_boxes = column_detection(norm_bgr, output_dir, basename, source_img=framed)

        return {
            "status":       "ok",
            "column_count": len(col_boxes),
            "is_numeric":   len(col_boxes) > 0,
            "output_dir":   output_dir,
        }

    except Exception as e:
        return {"status": "error", "error_type": "PROCESSING_ERROR", "message": str(e)}

# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode",       required=True, choices=["lined", "blank"])
    parser.add_argument("--input",      required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    if args.mode == "lined":
        result = validate_lined(args.input, args.output_dir)
    else:
        result = validate_blank(args.input, args.output_dir)

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
