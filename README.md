# Shard AI — ניתוח גרפולוגיה מבוסס בינה מלאכותית

A Hebrew-first web application that analyses handwriting samples using computer vision and generates a full graphological personality report powered by Claude AI.

---

## What the App Does

The user uploads two handwriting PDFs — one written on a lined page and one on a blank page. The app processes both through a computer-vision pipeline, extracts 12 graphological features, normalises them to a 0–1 scale, feeds the scores into a Claude language model, and returns a structured Hebrew report personalised to the user's chosen gender form of address. Completed reports are saved to a per-user SQLite database and can be accessed at any time from a report history page.

---

## Full User Flow

### 1. Landing Page (`/`)
- Displays the Shard AI branding in Hebrew and English.
- Unauthenticated users see a **"כניסה עם Google"** (Sign in with Google) button — no other action is available.
- Authenticated users see their first name, a **"התחל ניתוח"** (Start analysis) button, and a link to their report history.
- Buttons link to the User Guide and Format Downloads pages.
- Dark / light mode toggle in the top-right corner.

### 2. Gender Selection Popup
When an authenticated user clicks "התחל ניתוח", a modal asks how they'd like to be addressed in the final report:

| Option | Label | Effect |
|---|---|---|
| זכר | Male | Report uses masculine Hebrew |
| נקבה | Female | Report uses feminine Hebrew |
| אחר | Other | Report uses neutral / gender-inclusive language |

The selection is forwarded through the entire pipeline all the way to the Claude system prompt.

### 3. Upload Page (`/analysis`)
Two upload sections, each with drag-and-drop or click-to-browse:

**Lined Page Upload**
- Accepts a single-page PDF of handwriting on a pre-printed lined sheet.
- On upload, the server runs `normalize_pipeline.py --mode lined`:
  - Detects and crops the printed frame.
  - Removes corner calibration marks.
  - Detects horizontal line positions with peak-finding.
  - Crops each writing line individually.
  - Filters empty crops (ink-density check).
  - Detects and saves the signature line separately.
  - Runs word-segmentation on each crop and draws green bounding boxes (segmentation images).
  - Produces grayscale normalised crops and coloured segmentation crops.
- Validation checks and human-readable Hebrew errors:
  - Frame not detected → `PARTIAL_FRAME`
  - Fewer than 2 writing lines found → `TOO_FEW_LINES`
  - No signature line found → `MISSING_SIGNATURE`
  - 3–6 lines (warning, still proceeds) → `FEW_LINES`

**Blank Page Upload**
- Accepts a single-page PDF of handwriting on a completely blank sheet.
- On upload, the server runs `normalize_pipeline.py --mode blank`:
  - Detects and crops the printed frame.
  - Removes corner calibration marks.
  - Runs column detection — finds vertical bands of writing using ink-projection profiles.
  - Draws red bounding boxes around each column and saves the annotated image.

Both sections show live upload progress, a green success tick on completion, and a cancel button that calls `/api/session/cleanup` to delete temporary files immediately.

Once both uploads succeed the **"צור דוח"** (Generate report) button becomes active.

### 4. Results Page (`/results`)

**Loading screen (4 animated stages)**

| Stage | Hebrew label |
|---|---|
| `analyzing` | מאבחן כתב... |
| `words` | מנתח מילים... |
| `personality` | מנתח אישיות... |
| `report` | מפיק דוח... |

Completed stages show a blue check icon; the active stage shows a spinner; pending stages show an empty circle.

Progress streams in real-time over **Server-Sent Events (SSE)** from `/api/analysis/start`.

**Report screen**
- Full Hebrew graphological report with sections rendered as styled headings (`#`, `##`, `###`) and horizontal rules.
- Language respects the gender selected at step 2.
- The completed report and its feature scores are automatically saved to the SQLite database under the authenticated user's account.
- **"הורד כ-PDF"** button triggers `window.print()` using `@media print` CSS — the browser prints the page directly, preserving the Heebo font and Hebrew text with no encoding issues.
- **"חזרה לדף הבית"** navigates back to the home page.
- In development mode: an expandable section shows all 12 raw feature scores with bar visualisations.

### 5. Report History (`/history`)
- Lists all reports saved under the authenticated user's account, newest first.
- Sort toggle to reverse the order (oldest → newest).
- Each row shows the report title and navigates to the full saved report.
- Empty state shown when no reports exist yet.

### 6. Past Report Viewer (`/report/[id]`)
- Loads a previously saved report by its UUID from the database.
- Renders the full Hebrew markdown report identically to the results page.
- **"הורד כ-PDF"** downloads the report via `window.print()`.
- In development mode: expandable feature score bars are shown.
- 401 redirect if the user is not logged in; 404 redirect if the report belongs to another user.

### 7. User Guide (`/guide`)
- Tabbed guide for both handwriting test formats.
- **Tab 1 — Lined format:** 5-step walkthrough (download format → fill 20 lines → sign → scan → upload) with inline SVG illustrations showing correct and incorrect examples (cut frame, too few lines, missing signature).
- **Tab 2 — Blank format:** 4-step walkthrough (download format → write numbers 1–30 in 3 columns → scan → upload) with SVG examples for correct layout, cut frame, and wrong column count.
- Links to the format download page.

### 8. Format Downloads (`/formats`)
- Download page for the two test format PDFs (lined sheet and blank sheet).
- Visual preview of each format alongside the download button.

---

## Feature Extraction Pipeline (`scripts/feature_extraction.py`)

The Python CLI reads the normalised output from both PDF uploads and computes 12 graphological features, then calls the Claude API.

### Input directory layout

```
<session-dir>/
  lined/
    normalized/     ← grayscale line crops
    segmentation/   ← BGR crops with green word boxes
  blank/
    blank_COLUMNS.png  ← red column boxes drawn on blank page
```

### The 12 features

| Feature | Source | What it measures |
|---|---|---|
| `stroke_thickness` | Lined normalised crops | Average ink stroke width — pressure indicator |
| `slant` | Lined normalised crops | Letter slant angle (left/right/upright) |
| `baseline` | Segmentation crops | Whether words rise or fall along a line |
| `baseline_slope` | Segmentation crops | Degree of rising or falling baseline |
| `roundness` | Lined normalised crops | Roundness vs. angularity of letterforms |
| `word_spacing` | Segmentation crops | Gap between words relative to word width |
| `letter_size_regular` | Segmentation crops | Average word height across writing lines |
| `letter_size_signature` | Segmentation crops | Word height in the signature line |
| `column_spacing` | Blank page columns image | Distance between writing columns |
| `top_margin` | Blank page columns image | Space above the first writing column |
| `bottom_margin` | Blank page columns image | Space below the last writing column |
| `right_margin` | Segmentation crops (lined) + blank columns | Distance from right edge to rightmost ink |
| `left_margin` | Segmentation crops (lined) + blank columns | Distance from left edge to leftmost ink |

### Normalisation

Every raw feature list is normalised to [0, 1] using z-score normalisation (±3σ clamped):

```python
score = (value − mean) / std      # standardise
score = (score + 3) / 6           # map [−3σ, +3σ] → [0, 1]
score = clip(score, 0, 1)
```

Some features are inverted (high angularity → low roundness score, etc.) to ensure intuitive polarity. The exact algorithm and constants match the original research notebook (`Feature Extraction and Report.ipynb`) precisely.

### Claude API call

Scores are grouped into five categories (spacing, pressure, position, slant, shape) and formatted as a JSON block injected into a Hebrew system prompt along with:
- The gender instruction (masculine / feminine / neutral address)
- The line count and column count for context

The model (`claude-opus-4-5`, `max_tokens=2048`) returns a structured Hebrew report.

---

## HebHTR Docker Worker

`hebhtr_worker.py` runs inside a Docker container built from `dockerFile`. It provides Hebrew handwriting OCR (Handwritten Text Recognition) as a batch service:

- The Docker image bundles the **HebHTR** model (TensorFlow-based) along with its character list and helper modules.
- The worker is invoked with a directory of PNG crop images, loads the model **once**, and processes all crops in a single pass.
- Results are emitted as a JSON object `{filename: recognized_text}` on stdout.
- The Next.js server spawns the container for each session and reads the JSON output.
- All I/O is forced to UTF-8 to handle Hebrew characters correctly on all platforms.

---

## Report Persistence (SQLite)

Reports are stored locally using **better-sqlite3** in `shard-ai.db` (WAL mode).

### Schema

```sql
CREATE TABLE users (
  email TEXT PRIMARY KEY,
  name  TEXT,
  image TEXT
);

CREATE TABLE report_history (
  id            TEXT PRIMARY KEY,   -- UUID
  user_email    TEXT NOT NULL REFERENCES users(email),
  report_title  TEXT NOT NULL,
  created_at    TEXT NOT NULL,      -- ISO 8601
  snapshot_data TEXT NOT NULL       -- JSON: { report, scores }
);
```

`snapshot_data` stores both the full markdown report text and the categorised feature score map, so past reports can be re-rendered with the score visualisation intact.

---

## API Routes

| Method | Route | What it does |
|---|---|---|
| `POST` | `/api/upload/lined` | Receives lined PDF, runs normalize pipeline, returns status |
| `POST` | `/api/upload/blank` | Receives blank PDF, runs normalize pipeline, returns status |
| `GET` | `/api/session/image` | Serves a preview image from the session temp directory |
| `DELETE` | `/api/session/cleanup` | Deletes the entire session temp directory |
| `GET` | `/api/analysis/start` | SSE stream — spawns Python feature extraction, forwards progress events and saves the completed report to the database |
| `GET` | `/api/history` | Returns the authenticated user's report list (no snapshot data) |
| `POST` | `/api/history` | Saves a new report record; upserts the user row |
| `GET` | `/api/history/[id]` | Returns a single report (including snapshot) — 404 if it belongs to another user |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth Google OAuth handler |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | NextAuth 4 — Google OAuth |
| Themes | next-themes (dark / light) |
| Font | Heebo (Google Fonts) — optimised for Hebrew |
| Direction | RTL throughout (`dir="rtl"`, `lang="he"`) |
| PDF processing | PyMuPDF (fitz) |
| Computer vision | OpenCV, NumPy, SciPy |
| AI report | Anthropic Claude API (`claude-opus-4-5`) |
| Hebrew OCR | HebHTR (TensorFlow) via Docker worker |
| Database | SQLite via better-sqlite3 (WAL mode) |
| Streaming | Server-Sent Events (`ReadableStream` + `EventSource`) |
| Session storage | OS temp directory (`os.tmpdir()/shard-ai/<uuid>`) |

---

## Project Structure

```
Shard-AI/
├── app/
│   ├── page.tsx                      # Home page + gender modal
│   ├── layout.tsx                    # Root layout, Heebo font, Providers
│   ├── globals.css
│   ├── analysis/
│   │   └── page.tsx                  # Upload page (lined + blank)
│   ├── results/
│   │   └── page.tsx                  # Loading screen + report display
│   ├── history/
│   │   └── page.tsx                  # Saved report list
│   ├── report/
│   │   └── [id]/
│   │       └── page.tsx              # Past report viewer
│   ├── guide/
│   │   └── page.tsx                  # Tabbed user guide with SVG illustrations
│   ├── formats/
│   │   └── page.tsx                  # Format PDF download page
│   └── api/
│       ├── auth/[...nextauth]/       # Google OAuth
│       ├── upload/
│       │   ├── lined/                # Lined PDF upload endpoint
│       │   └── blank/                # Blank PDF upload endpoint
│       ├── session/
│       │   ├── image/                # Preview image server
│       │   └── cleanup/              # Session cleanup endpoint
│       ├── analysis/
│       │   └── start/                # SSE feature extraction stream + report save
│       └── history/
│           ├── route.ts              # GET list / POST new report
│           └── [id]/route.ts         # GET single report by UUID
├── components/
│   ├── Providers.tsx                 # SessionProvider + ThemeProvider
│   ├── UserMenu.tsx                  # Avatar dropdown: history link + sign-out
│   ├── Sidebar.tsx                   # Navigation sidebar
│   ├── Stepper.tsx                   # Upload progress stepper
│   ├── FormatModal.tsx               # Instructions / format modal
│   └── analysis/
│       └── WarningModal.tsx          # Pre-analysis warning modal
├── lib/
│   ├── auth.ts                       # NextAuth config
│   ├── db.ts                         # SQLite helpers (better-sqlite3)
│   └── normalize.ts                  # Shared normalisation utilities
├── scripts/
│   ├── normalize_pipeline.py         # PDF → normalised crops CLI
│   └── feature_extraction.py        # Feature computation + Claude report CLI
├── hebhtr_worker.py                  # HebHTR batch OCR worker (runs in Docker)
├── dockerFile                        # HebHTR Docker image build file
├── shard-ai.db                       # SQLite database (auto-created, gitignored)
└── .env.local                        # API keys (never commit)
```

---

## Environment Variables

Create a `.env.local` file in the project root (already in `.gitignore`):

```env
ANTHROPIC_API_KEY=sk-ant-...       # Claude API key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random string>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

---

## Prerequisites

- **Node.js** 18+
- **Python** 3.8+ with the following packages:
  ```
  pip install opencv-python-headless numpy pymupdf scipy anthropic
  ```
- **Docker** (for the HebHTR Hebrew OCR worker)
- A **Google OAuth** application (for authentication)
- An **Anthropic API** key (for the Claude report)

---

## Getting Started

```bash
# Install Node dependencies
npm install

# Build the HebHTR Docker image (first-time setup)
docker build -t hebhtr -f dockerFile .

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## PDF Format Requirements

Both PDFs must be single-page scans with a visible printed border frame and small calibration marks in the corners:

- **Lined page** — pre-printed horizontal lines, handwriting on the lines (minimum 7, recommended 20), signature at the bottom.
- **Blank page** — completely unlined, numbers 1–30 written in exactly 3 columns (no pre-printed grid).

Visit **/guide** for a step-by-step visual walkthrough, or **/formats** to download the official format templates.

---

## Security Notes

- The Anthropic API key is stored only in `.env.local` and is never committed to version control.
- Session data (uploaded PDFs and processed images) is stored in the OS temp directory and deleted when the user cancels or navigates away.
- All analysis routes require an active authenticated session.
- The `/api/history/[id]` route enforces per-user ownership — a user can only retrieve their own reports (returns 404 for IDs belonging to other accounts).
- The SQLite database file (`shard-ai.db`) should be added to `.gitignore` to avoid committing user data.
