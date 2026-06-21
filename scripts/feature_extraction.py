#!/usr/bin/env python3
"""
Graphology feature extraction CLI.

Usage: python scripts/feature_extraction.py --session-dir <path>

Reads from:
  <session-dir>/lined/normalized/*.png   — grayscale line crops
  <session-dir>/lined/segmentation/*.png — BGR crops with green word boxes
  <session-dir>/blank/                   — contains blank_COLUMNS.png (red column boxes)

Emits one JSON object per line to stdout for SSE streaming:
  {"stage": "analyzing",    "message": "..."}
  {"stage": "words",        "message": "..."}
  {"stage": "personality",  "message": "..."}
  {"stage": "report",       "message": "..."}
  {"stage": "done",         "scores": {...}, "report": "..."}
  {"stage": "error",        "message": "..."}
"""

import argparse
import json
import os
import re
import sys
import warnings
from typing import Optional, Tuple

warnings.filterwarnings('ignore')

import cv2
import numpy as np

# ── Constants ──────────────────────────────────────────────────────────────────
COLUMN_TOKEN    = "_COLUMNS"
SIGNATURE_TOKEN = "_signature"

USER_MIN_COMPONENT_AREA     = 20
USER_MIN_COMPONENT_WIDTH    = 3
USER_MIN_COMPONENT_HEIGHT   = 4
USER_MIN_DENSITY            = 0.18
USER_MIN_NEIGHBOR_SUPPORT   = 2
USER_NEIGHBOR_RADIUS_X      = 25
USER_NEIGHBOR_RADIUS_Y      = 18


# ── I/O helpers ────────────────────────────────────────────────────────────────
def emit(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj, ensure_ascii=True) + "\n")
    sys.stdout.flush()


def extract_file_id(filename: str) -> int:
    m = re.search(r'(\d+)', filename)
    return int(m.group(1)) if m else -1


# ── Slant ──────────────────────────────────────────────────────────────────────
def measure_slant_by_shear(binary_img: np.ndarray) -> Tuple[float, float]:
    img_height, img_width = binary_img.shape
    angles_to_test = np.linspace(-30, 30, 61)
    max_variance = 0
    optimal_angle = 0

    for angle in angles_to_test:
        angle_rad = np.radians(angle)
        shear_factor = np.tan(angle_rad)
        M = np.array([[1, shear_factor, 0], [0, 1, 0]], dtype=np.float32)
        sheared = cv2.warpAffine(
            binary_img, M,
            (img_width + abs(int(shear_factor * img_height)), img_height),
            flags=cv2.INTER_LINEAR, borderValue=255)
        projection = np.sum(sheared == 0, axis=0)
        variance = np.var(projection)
        if variance > max_variance:
            max_variance = variance
            optimal_angle = angle

    slant = np.clip((optimal_angle + 30) / 60, 0.0, 1.0)
    return float(slant), optimal_angle


def measure_slant_by_moments(binary_img: np.ndarray) -> float:
    inverted = 255 - binary_img
    contours, _ = cv2.findContours(inverted, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 0.5

    angles = []
    img_area = binary_img.shape[0] * binary_img.shape[1]
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < img_area * 0.0001 or area > img_area * 0.15 or len(contour) < 5:
            continue
        try:
            (x, y), (MA, ma), angle = cv2.fitEllipse(contour)
            if angle > 135:
                angle = angle - 180
            elif angle > 45:
                angle = 90 - angle
            angles.append(angle)
        except Exception:
            continue

    if not angles:
        return 0.5

    angles = np.array(angles)
    q1, q3 = np.percentile(angles, [25, 75])
    iqr = q3 - q1
    if iqr > 0:
        mask = (angles >= q1 - 1.5 * iqr) & (angles <= q3 + 1.5 * iqr)
        angles = angles[mask]
    if len(angles) == 0:
        return 0.5

    mean_angle = np.clip(np.mean(angles), -20, 20)
    return float((mean_angle + 20) / 40)


def extract_slant(image_path: str) -> float:
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return 0.5
    if len(np.unique(img)) > 2:
        _, img = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)
    slant_shear, _ = measure_slant_by_shear(img)
    slant_moments = measure_slant_by_moments(img)
    return float(np.clip(0.7 * slant_shear + 0.3 * slant_moments, 0.0, 1.0))


# ── Stroke thickness ───────────────────────────────────────────────────────────
def remove_printed_text_and_lines(img: np.ndarray) -> np.ndarray:
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)
    height, width = img.shape[:2]

    lines_mask = np.zeros_like(binary)
    lines = cv2.HoughLinesP(binary, 1, np.pi / 180, threshold=100,
                            minLineLength=width * 0.3, maxLineGap=10)
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            cv2.line(lines_mask, (x1, y1), (x2, y2), 255, 8)

    binary_no_lines = cv2.bitwise_and(binary, cv2.bitwise_not(lines_mask))
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(binary_no_lines, connectivity=8)
    handwriting_mask = np.zeros_like(binary_no_lines)
    for i in range(1, num_labels):
        x, y, w, h, area = stats[i]
        if not ((y + h) > height * 0.85 or y < height * 0.1 or area < 15):
            handwriting_mask[labels == i] = 255
    return cv2.bitwise_not(handwriting_mask)


def calculate_stroke_thickness_pure(img: np.ndarray) -> float:
    handwriting_only = remove_printed_text_and_lines(img)
    gray = (cv2.cvtColor(handwriting_only, cv2.COLOR_BGR2GRAY)
            if len(handwriting_only.shape) == 3 else handwriting_only)
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    inverted = cv2.bitwise_not(binary)
    dist_transform = cv2.distanceTransform(inverted, cv2.DIST_L2, 5)
    text_distances = dist_transform[dist_transform > 0]
    total_pixels = inverted.shape[0] * inverted.shape[1]
    handwriting_ratio = len(text_distances) / total_pixels if total_pixels > 0 else 0

    MINIMUM_CONTENT_THRESHOLD = 0.003
    if len(text_distances) == 0 or handwriting_ratio < MINIMUM_CONTENT_THRESHOLD:
        gray_raw = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
        _, binary_raw = cv2.threshold(gray_raw, 127, 255, cv2.THRESH_BINARY)
        inverted_raw = cv2.bitwise_not(binary_raw)
        dist_raw = cv2.distanceTransform(inverted_raw, cv2.DIST_L2, 5)
        text_distances = dist_raw[dist_raw > 0]
        if len(text_distances) == 0:
            return 0.0

    return float(np.mean(text_distances) * 2)


# ── Baseline position ──────────────────────────────────────────────────────────
def calculate_position_score(img: np.ndarray) -> Optional[float]:
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    img_h, img_w = thresh.shape

    min_line_width = int(img_w * 0.3)
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (min_line_width, 1))
    detected_lines_map = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=1)
    cnts_lines, _ = cv2.findContours(detected_lines_map, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not cnts_lines:
        return None

    valid_lines = [c for c in cnts_lines
                   if cv2.boundingRect(c)[1] > 10 and cv2.boundingRect(c)[1] < img_h - 10]
    if not valid_lines:
        valid_lines = [max(cnts_lines, key=cv2.contourArea)]

    text_only = cv2.subtract(thresh, detected_lines_map)
    kernel_clean = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    text_only = cv2.morphologyEx(text_only, cv2.MORPH_OPEN, kernel_clean)
    cnts_text, _ = cv2.findContours(text_only, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    text_bottoms = []
    text_centers_y = []
    for c in cnts_text:
        if cv2.contourArea(c) < 15:
            continue
        tx, ty, tw, th = cv2.boundingRect(c)
        text_bottoms.append(ty + th)
        text_centers_y.append(ty + th / 2)

    if not text_bottoms:
        return 1.0

    mean_text_bottom = np.mean(text_bottoms)
    avg_text_y = np.mean(text_centers_y)

    best_line_y = 0
    min_dist = 99999
    for line_c in valid_lines:
        lx, ly, lw, lh = cv2.boundingRect(line_c)
        dist = abs(ly - avg_text_y)
        if dist < min_dist:
            min_dist = dist
            best_line_y = ly

    SENSITIVITY = 60.0
    distance = best_line_y - mean_text_bottom
    return float(max(0.0, min(1.0, 0.5 + distance / SENSITIVITY)))


# ── Word boxes ─────────────────────────────────────────────────────────────────
def extract_word_boxes_from_annotated(img_bgr: np.ndarray):
    b, g, r = cv2.split(img_bgr)
    green_mask = (
        (g.astype(np.int32) > 150) &
        (r.astype(np.int32) < 80) &
        (b.astype(np.int32) < 80)
    ).astype(np.uint8) * 255

    kernel = np.ones((3, 3), np.uint8)
    green_mask = cv2.dilate(green_mask, kernel, iterations=1)
    contours, _ = cv2.findContours(green_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    boxes = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if w >= 15 and h >= 8:
            boxes.append((x, y, w, h))
    return boxes


# ── Margins (lined and blank page) ─────────────────────────────────────────────
def calculate_right_margin(img_bgr: np.ndarray, filename: str = "",
                           seg_img: Optional[np.ndarray] = None) -> float:
    h, w = img_bgr.shape[:2]
    is_blank_page = COLUMN_TOKEN in filename

    if is_blank_page:
        b, g, r = img_bgr[:, :, 0], img_bgr[:, :, 1], img_bgr[:, :, 2]
        red_mask = (r > 150) & (g < 80) & (b < 80)
        xs = np.where(red_mask.any(axis=0))[0]
        if len(xs) == 0:
            return -1.0
        rightmost_x = int(xs[-1])
    else:
        if seg_img is None:
            return -1.0
        boxes = extract_word_boxes_from_annotated(seg_img)
        if len(boxes) == 0:
            return -1.0
        rightmost_x = max(x + bw for x, y, bw, bh in boxes)

    margin_ratio = (w - rightmost_x) / w
    MAX_MARGIN_RATIO = 0.30
    return round(max(0.0, min(1.0, margin_ratio / MAX_MARGIN_RATIO)), 4)


def calculate_left_margin(img_bgr: np.ndarray, filename: str = "",
                          seg_img: Optional[np.ndarray] = None) -> float:
    h, w = img_bgr.shape[:2]
    is_blank_page = COLUMN_TOKEN in filename

    if is_blank_page:
        b, g, r = img_bgr[:, :, 0], img_bgr[:, :, 1], img_bgr[:, :, 2]
        red_mask = (r > 150) & (g < 80) & (b < 80)
        xs = np.where(red_mask.any(axis=0))[0]
        if len(xs) == 0:
            return -1.0
        leftmost_x = int(xs[0])
    else:
        if seg_img is None:
            return -1.0
        boxes = extract_word_boxes_from_annotated(seg_img)
        if len(boxes) == 0:
            return -1.0
        leftmost_x = min(x for x, y, bw, bh in boxes)

    margin_ratio = leftmost_x / w
    MAX_MARGIN_RATIO = 0.30
    return round(max(0.0, min(1.0, margin_ratio / MAX_MARGIN_RATIO)), 4)


# ── Blank page features ────────────────────────────────────────────────────────
def calculate_top_margin(img_bgr: np.ndarray) -> float:
    h, w = img_bgr.shape[:2]
    b, g, r = img_bgr[:, :, 0], img_bgr[:, :, 1], img_bgr[:, :, 2]
    red_mask = (r > 150) & (g < 80) & (b < 80)
    ys = np.where(red_mask.any(axis=1))[0]
    if len(ys) == 0:
        return -1.0
    y_top = int(ys[0])
    margin_ratio = y_top / h
    MAX_MARGIN_RATIO = 0.30
    return round(max(0.0, min(1.0, margin_ratio / MAX_MARGIN_RATIO)), 4)


def calculate_bottom_margin(img_bgr: np.ndarray) -> float:
    h, w = img_bgr.shape[:2]
    b, g, r = img_bgr[:, :, 0], img_bgr[:, :, 1], img_bgr[:, :, 2]
    red_mask = (r > 150) & (g < 80) & (b < 80)
    ys = np.where(red_mask.any(axis=1))[0]
    if len(ys) == 0:
        return -1.0
    y_bottom = int(ys[-1])
    return round(min(1.0, ((h - 1 - y_bottom) / h) / 0.30), 4)


def calculate_column_spacing(img_bgr: np.ndarray) -> Tuple[float, int]:
    h, w = img_bgr.shape[:2]
    b, g, r = img_bgr[:, :, 0], img_bgr[:, :, 1], img_bgr[:, :, 2]
    red_mask = (r > 150) & (g < 80) & (b < 80)
    col_proj = red_mask.any(axis=0)

    bands = []
    start = None
    for x, val in enumerate(col_proj):
        if val and start is None:
            start = x
        elif not val and start is not None:
            bands.append((start, x))
            start = None
    if start is not None:
        bands.append((start, w))

    num_columns = len(bands)
    if num_columns < 2:
        return -1.0, num_columns

    gaps = [max(0, bands[i + 1][0] - bands[i][1]) for i in range(len(bands) - 1)]
    avg_gap = sum(gaps) / len(gaps)
    gap_ratio = avg_gap / w
    MAX_GAP_RATIO = 0.30
    grade = round(max(0.0, min(1.0, gap_ratio / MAX_GAP_RATIO)), 4)
    return grade, num_columns


# ── Baseline slope ─────────────────────────────────────────────────────────────
def calculate_baseline_slope_raw(img_bgr: np.ndarray) -> Optional[float]:
    boxes = extract_word_boxes_from_annotated(img_bgr)
    if len(boxes) < 2:
        return None
    centers_x = np.array([x + w / 2 for x, y, w, h in boxes], dtype=np.float32)
    centers_y = np.array([y + h / 2 for x, y, w, h in boxes], dtype=np.float32)
    try:
        m, _ = np.polyfit(centers_x, centers_y, 1)
    except Exception:
        return None
    return float(m)


# ── Word spacing ───────────────────────────────────────────────────────────────
def calculate_word_spacing(img_bgr: np.ndarray) -> Optional[float]:
    boxes = extract_word_boxes_from_annotated(img_bgr)
    if not boxes:
        return None
    boxes_sorted = sorted(boxes, key=lambda b: b[0])
    if len(boxes_sorted) == 1:
        return None
    avg_box_height = float(np.mean([h for (_, _, _, h) in boxes_sorted]))

    gaps = []
    for i in range(len(boxes_sorted) - 1):
        x_cur, y_cur, w_cur, h_cur = boxes_sorted[i]
        x_next, y_next, w_next, h_next = boxes_sorted[i + 1]
        gap = x_next - (x_cur + w_cur)
        if gap > 0:
            gaps.append(gap)

    if not gaps:
        return 0.0
    return float(np.mean(gaps)) / avg_box_height if avg_box_height > 0 else None


# ── Letter size ────────────────────────────────────────────────────────────────
def calculate_letter_size(img_bgr: np.ndarray) -> Optional[float]:
    img_height = img_bgr.shape[0]
    boxes = extract_word_boxes_from_annotated(img_bgr)
    if not boxes:
        return None
    heights = [h for (_, _, _, h) in boxes]
    mean_height = float(np.mean(heights))
    return mean_height / img_height


# ── Angularity ─────────────────────────────────────────────────────────────────
def calculate_angularity_raw(img: np.ndarray) -> float:
    handwriting_only = remove_printed_text_and_lines(img)
    gray = (cv2.cvtColor(handwriting_only, cv2.COLOR_BGR2GRAY)
            if len(handwriting_only.shape) == 3 else handwriting_only)
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    inverted = cv2.bitwise_not(binary)
    contours, _ = cv2.findContours(inverted, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    sharp_corner_count = 0
    total_perimeter = 0.0
    epsilon_val = 3.0

    for cnt in contours:
        perimeter = cv2.arcLength(cnt, True)
        if perimeter < 20:
            continue
        total_perimeter += perimeter
        approx = cv2.approxPolyDP(cnt, epsilon_val, True)
        if len(approx) < 3:
            continue
        for i in range(len(approx)):
            p1 = approx[(i - 1) % len(approx)][0]
            p2 = approx[i][0]
            p3 = approx[(i + 1) % len(approx)][0]
            v1, v2 = p1 - p2, p3 - p2
            n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)
            if n1 == 0 or n2 == 0:
                continue
            cos_theta = np.clip(np.dot(v1, v2) / (n1 * n2), -1.0, 1.0)
            if np.degrees(np.arccos(cos_theta)) < 120:
                sharp_corner_count += 1

    if total_perimeter == 0:
        return 0.0
    return (sharp_corner_count / total_perimeter) * 100


# ── Z-score normalization ──────────────────────────────────────────────────────
def zscore_normalize(raw_values, invert=False, fallback=0.5):
    valid = np.array(
        [v for v in raw_values if v is not None and not np.isnan(float(v))],
        dtype=float
    )
    if len(valid) < 2:
        return [fallback] * len(raw_values)
    mean = float(np.mean(valid))
    std  = float(np.std(valid))
    result = []
    for v in raw_values:
        if v is None:
            result.append(fallback)
            continue
        if std == 0:
            result.append(fallback)
            continue
        z = (float(v) - mean) / std
        if invert:
            z = -z
        score = float(np.clip(0.5 + z / 6.0, 0.0, 1.0))
        result.append(round(score, 3))
    return result


# ── Main ───────────────────────────────────────────────────────────────────────
def avg_valid(values) -> Optional[float]:
    valid = [v for v in values if v is not None and v != -1.0 and not (isinstance(v, float) and v < 0)]
    return round(float(np.mean(valid)), 3) if valid else None


GENDER_INSTRUCTIONS = {
    'male':   'פנה אל הנבדק בלשון זכר לאורך כל הדוח (לדוגמה: "הכותב", "הוא", "שלו").',
    'female': 'פני אל הנבדקת בלשון נקבה לאורך כל הדוח (לדוגמה: "הכותבת", "היא", "שלה").',
    'other':  'השתמש בלשון ניטרלית לאורך כל הדוח, הימנע מציון מגדר ספציפי (לדוגמה: "הכותב/ת", "האדם", "הנבדק/ת").',
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--session-dir', required=True)
    parser.add_argument('--gender', default='other', choices=['male', 'female', 'other'])
    args = parser.parse_args()

    session_dir = args.session_dir
    gender      = args.gender
    norm_dir  = os.path.join(session_dir, 'lined', 'normalized')
    seg_dir   = os.path.join(session_dir, 'lined', 'segmentation')
    blank_dir = os.path.join(session_dir, 'blank')

    # ── Stage 1: analyze handwriting strokes ──────────────────────────────────
    emit({"stage": "analyzing", "message": "מאבחן כתב..."})

    crop_files = []
    if os.path.isdir(norm_dir):
        crop_files = sorted(
            [f for f in os.listdir(norm_dir) if f.endswith('.png')],
            key=extract_file_id
        )

    # Find blank page COLUMNS visualization
    columns_img = None
    columns_fname = None
    if os.path.isdir(blank_dir):
        for f in os.listdir(blank_dir):
            if COLUMN_TOKEN in f and f.endswith('.png'):
                columns_fname = f
                columns_img = cv2.imread(os.path.join(blank_dir, f))
                break

    line_records = []

    for fname in crop_files:
        norm_path = os.path.join(norm_dir, fname)
        seg_path  = os.path.join(seg_dir, fname)

        img_norm = cv2.imread(norm_path)
        img_seg  = cv2.imread(seg_path)

        is_signature = SIGNATURE_TOKEN in fname

        if is_signature:
            raw_ls = calculate_letter_size(img_seg) if img_seg is not None else None
            line_records.append({
                'fname': fname, 'is_signature': True,
                'slant': None, 'baseline': None,
                'raw_stroke': None, 'raw_slope': None,
                'raw_angularity': None, 'raw_word_spacing': None,
                'raw_letter_size': raw_ls,
                'right_margin': None, 'left_margin': None,
            })
        else:
            slant        = extract_slant(norm_path) if img_norm is not None else 0.5
            raw_stroke   = calculate_stroke_thickness_pure(img_norm) if img_norm is not None else None
            baseline_raw = calculate_position_score(img_norm) if img_norm is not None else None
            baseline     = baseline_raw if baseline_raw is not None else 0.5
            img_gray     = cv2.cvtColor(img_norm, cv2.COLOR_BGR2GRAY) if img_norm is not None else None
            raw_ang      = calculate_angularity_raw(img_gray) if img_gray is not None else None

            raw_slope, raw_ws, raw_ls = None, None, None
            right_m, left_m = None, None
            if img_seg is not None:
                raw_slope = calculate_baseline_slope_raw(img_seg)
                raw_ws    = calculate_word_spacing(img_seg)
                raw_ls    = calculate_letter_size(img_seg)
                right_m   = calculate_right_margin(img_norm, fname, seg_img=img_seg)
                left_m    = calculate_left_margin(img_norm, fname, seg_img=img_seg)

            line_records.append({
                'fname': fname, 'is_signature': False,
                'slant': slant, 'baseline': baseline,
                'raw_stroke': raw_stroke, 'raw_slope': raw_slope,
                'raw_angularity': raw_ang,
                'raw_word_spacing': raw_ws if raw_ws not in (None, -1) else None,
                'raw_letter_size': raw_ls,
                'right_margin': right_m, 'left_margin': left_m,
            })

    # ── Stage 2: analyze words ─────────────────────────────────────────────────
    emit({"stage": "words", "message": "מנתח מילים..."})

    # Blank page features
    top_margin = bottom_margin = col_spacing = None
    num_cols = None
    if columns_img is not None:
        top_margin    = calculate_top_margin(columns_img)
        bottom_margin = calculate_bottom_margin(columns_img)
        col_result    = calculate_column_spacing(columns_img)
        if isinstance(col_result, tuple):
            col_spacing, num_cols = col_result
        else:
            col_spacing = col_result

        # Also compute right/left margin from blank COLUMNS image
        col_right = calculate_right_margin(columns_img, filename=columns_fname or COLUMN_TOKEN)
        col_left  = calculate_left_margin(columns_img, filename=columns_fname or COLUMN_TOKEN)
    else:
        col_right = col_left = None

    # Separate regular vs signature records
    regular = [r for r in line_records if not r['is_signature']]
    sigs    = [r for r in line_records if r['is_signature']]

    # Z-score normalize raw features (matching notebook normalization_map exactly)
    raw_strokes   = [r['raw_stroke']        for r in regular]
    raw_slopes    = [r['raw_slope']         for r in regular]
    raw_angs      = [r['raw_angularity']    for r in regular]
    raw_ws_all    = [r['raw_word_spacing']  for r in regular]
    raw_ls_reg    = [r['raw_letter_size']   for r in regular]
    raw_ls_sig    = [r['raw_letter_size']   for r in sigs]

    norm_strokes   = zscore_normalize(raw_strokes,  invert=False)
    norm_slopes    = zscore_normalize(raw_slopes,   invert=False)
    norm_roundness = zscore_normalize(raw_angs,     invert=True)   # high angularity → low roundness
    norm_ws        = zscore_normalize(raw_ws_all,   invert=False)
    norm_ls_reg    = zscore_normalize(raw_ls_reg,   invert=False)
    norm_ls_sig    = zscore_normalize(raw_ls_sig,   invert=False)

    # Collect right/left margins including blank page contribution
    right_margins = [r['right_margin'] for r in regular if r['right_margin'] is not None and r['right_margin'] >= 0]
    left_margins  = [r['left_margin']  for r in regular if r['left_margin']  is not None and r['left_margin']  >= 0]
    if col_right is not None and col_right >= 0:
        right_margins.append(col_right)
    if col_left is not None and col_left >= 0:
        left_margins.append(col_left)

    scores = {
        'slant':                avg_valid([r['slant']   for r in regular]),
        'baseline':             avg_valid([r['baseline'] for r in regular]),
        'stroke_thickness':     avg_valid(norm_strokes),
        'baseline_slope':       avg_valid(norm_slopes),
        'roundness':            avg_valid(norm_roundness),
        'word_spacing':         avg_valid(norm_ws),
        'letter_size_regular':  avg_valid(norm_ls_reg),
        'letter_size_signature': avg_valid(norm_ls_sig) if sigs else None,
        'right_margin':         avg_valid(right_margins),
        'left_margin':          avg_valid(left_margins),
        'top_margin':           (round(top_margin, 3)    if top_margin    is not None and top_margin    >= 0 else None),
        'bottom_margin':        (round(bottom_margin, 3) if bottom_margin is not None and bottom_margin >= 0 else None),
        'column_spacing':       (round(col_spacing, 3)   if col_spacing   is not None and col_spacing   >= 0 else None),
    }

    # Group scores by category (for debug display in frontend)
    grouped_scores = {
        "spacing":  {k: scores[k] for k in ['word_spacing', 'letter_size_regular', 'letter_size_signature', 'column_spacing'] if scores.get(k) is not None},
        "pressure": {k: scores[k] for k in ['stroke_thickness'] if scores.get(k) is not None},
        "position": {k: scores[k] for k in ['baseline', 'baseline_slope', 'top_margin', 'bottom_margin', 'left_margin', 'right_margin'] if scores.get(k) is not None},
        "slant":    {k: scores[k] for k in ['slant'] if scores.get(k) is not None},
        "shape":    {k: scores[k] for k in ['roundness'] if scores.get(k) is not None},
    }

    # ── Stage 3: analyze personality ──────────────────────────────────────────
    emit({"stage": "personality", "message": "מנתח אישיות..."})

    feature_labels = {
        'slant':                 ('נטיית כתב',         '0=ישר, 0.5=נטייה קלה, 1=נטייה חזקה'),
        'baseline':              ('קו בסיס',            '0=כתיבה מעל הקו, 0.5=ממוצע, 1=כתיבה על הקו'),
        'stroke_thickness':      ('עובי קו',            '0=קו דק, 0.5=ממוצע, 1=קו עבה'),
        'baseline_slope':        ('נטיית קו בסיס',      '0=שורה יורדת, 0.5=ישר, 1=שורה עולה'),
        'roundness':             ('עגלות',              '0=עגול מאוד, 0.5=ממוצע, 1=חדות'),
        'word_spacing':          ('מרווח בין מילים',    '0=צפוף, 0.5=ממוצע, 1=מרווח גדול'),
        'letter_size_regular':   ('גודל אותיות רגיל',   '0=קטן, 0.5=ממוצע, 1=גדול'),
        'letter_size_signature': ('גודל חתימה',         '0=קטנה, 0.5=כגודל הכתב, 1=גדולה'),
        'right_margin':          ('שוליים ימין',        '0=צר (0-5%), 0.5=ממוצע (~2 ס"מ), 1=רחב (>30%)'),
        'left_margin':           ('שוליים שמאל',        '0=צר (0-5%), 0.5=ממוצע (~2 ס"מ), 1=רחב (>30%)'),
        'top_margin':            ('שוליים עליון',       '0=קטן (0-5%), 0.5=ממוצע (10-15%), 1=גדול (>30%)'),
        'bottom_margin':         ('שוליים תחתון',      '0=קטן (0-5%), 0.5=ממוצע (10-15%), 1=גדול (>30%)'),
        'column_spacing':        ('מרווח בין עמודות',   '0=עמודות צמודות, 0.5=ממוצע, 1=מרווח גדול'),
    }

    feature_lines = []
    for key, (label, scale) in feature_labels.items():
        val = scores.get(key)
        if val is not None:
            feature_lines.append(f"• {label}  [{scale}]  →  {val:.3f}")

    line_count = len(regular)
    data_notice = ""
    if 10 <= line_count <= 15:
        data_notice = f"הערה: הניתוח מבוסס על {line_count} שורות כתיבה בלבד (מומלץ 16+). הדיוק עשוי להיות מוגבל.\n\n"

    col_notice = ""
    if num_cols is not None and num_cols != 3:
        col_notice = f"הערה: זוהו {num_cols} עמודות בדף הריק (נורמה: 3 עמודות). ייתכן שיש סטייה בניתוח.\n\n"

    gender_instruction = GENDER_INSTRUCTIONS.get(gender, GENDER_INSTRUCTIONS['other'])

    system_prompt = f"""אתה גרפולוג מומחה ומנוסה, בקיא בשיטות ניתוח כתב יד ואישיות.
כתוב דוח גרפולוגי מקצועי בעברית, מבוסס על מדדים כמותיים שיוצגו לך בסולם 0.0–1.0.

הדוח יכלול 5 חלקים ממוספרים:
1. מרחב ופריסה (שוליים, מרווחים, עמודות)
2. קו ולחץ (עובי קו, עגלות)
3. בסיס ונטייה (קו בסיס, נטיית כתב, כיוון שורות)
4. גודל ופרופורציות (גודל אותיות, חתימה)
5. סיכום אישיות – 3 עד 5 משפטים על אישיות הנבדק/ת, חוזקות ואתגרים

הנחיות:
- {gender_instruction}
- כתוב בעברית תקנית ומקצועית
- אל תציג את הציונים המספריים עצמם בדוח
- הסק תובנות אישיותיות מהנתונים
- הדוח יהיה בין 500 ל-700 מילים
- היה אמפתי ומאוזן – הצג גם חוזקות וגם אתגרים"""

    user_prompt = (
        f"{col_notice}{data_notice}"
        f"להלן מדדי הכתב הגרפולוגיים (סולם 0.0–1.0):\n\n"
        + "\n".join(feature_lines)
        + "\n\nאנא כתוב דוח גרפולוגי מפורט ומקצועי בעברית בהתבסס על מדדים אלה."
    )

    # ── Stage 4: generate report ───────────────────────────────────────────────
    emit({"stage": "report", "message": "מפיק דוח..."})

    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not api_key:
        emit({"stage": "error", "message": "ANTHROPIC_API_KEY לא מוגדר בסביבה"})
        sys.exit(1)

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model='claude-opus-4-5',
            max_tokens=2048,
            system=system_prompt,
            messages=[{'role': 'user', 'content': user_prompt}]
        )
        report = response.content[0].text
    except Exception as e:
        emit({"stage": "error", "message": f"שגיאה בהפקת הדוח: {e}"})
        sys.exit(1)

    # ── Done ───────────────────────────────────────────────────────────────────
    emit({
        "stage": "done",
        "scores": grouped_scores,
        "report": report,
        "line_count": line_count,
        "num_columns": num_cols,
    })


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        emit({"stage": "error", "message": str(e)})
        sys.exit(1)
