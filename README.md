# PDFly

A browser-based PDF tool suite — merge, split, compress, convert to image, convert to Word,
watermark, and rotate. Flask backend, React frontend. Nothing is stored: every file is deleted
immediately after the response is sent.

This project has been built and tested end-to-end (all endpoints, all documented error
paths, concurrent requests, and cleanup) — see "What's been verified" at the bottom.

### Interface

The frontend is a multi-page, ilovepdf-style app on a black theme:

- **Home** (`/`) lists every tool as a card, grouped into Organize / Convert / Optimize, each
  with its own accent color.
- **Tool pages** (`/tool/:toolKey`) show the selected tool next to a sidebar listing every other
  tool, so you can jump between them without going back to the home page.

Routing uses `react-router-dom` with `HashRouter`, so the built `dist/` folder works from any
static file server with no server-side rewrite rules required.

---

## 1. One-time setup (Windows)

### Install system tools

1. **Python 3.10+** — https://www.python.org/downloads/ (check "Add python.exe to PATH" during install)
2. **Node.js LTS** — https://nodejs.org
3. **Poppler for Windows** — download from https://github.com/oschwartz10612/poppler-windows/releases,
   extract to `C:\poppler\`, add `C:\poppler\Library\bin` to your System PATH.
4. **Ghostscript for Windows** — download the 64-bit installer from
   https://ghostscript.com/releases/gsdnld.html and run it (it usually adds itself to PATH).
5. **LibreOffice** — download from https://www.libreoffice.org/download/download/ and install with
   defaults. Required by the **Word to PDF** tool, which shells out to `soffice --headless`. Add
   the `program` folder inside your LibreOffice install (e.g.
   `C:\Program Files\LibreOffice\program`) to your System PATH so `soffice` is found.
6. **Tesseract OCR** — download from https://github.com/UB-Mannheim/tesseract/wiki and install
   with defaults. Required by the **PDF to Word** tool's OCR fallback for scanned PDFs with no
   text layer. Add the install folder (e.g. `C:\Program Files\Tesseract-OCR`) to your System PATH.

Open a **new** terminal after installing these and confirm:
```powershell
python --version
node --version
pdftoppm -v
gswin64c -v
soffice --version
tesseract --version
```
If `gswin64c -v` fails, try `gswin32c -v` — 32-bit installs use that name instead. Either works;
the backend auto-detects which one is present.

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If activation is blocked by PowerShell's execution policy, run once:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Frontend

```powershell
cd frontend
npm install
```

---

## 2. Running it locally

Open two terminals in VS Code (right-click the terminal panel → "Split Terminal").

**Terminal 1 — backend:**
```powershell
cd backend
python app.py
```
Runs on http://localhost:5000. Visit http://localhost:5000/health — you should see `{"status": "ok"}`.

**Terminal 2 — frontend:**
```powershell
cd frontend
npm run dev
```
Runs on http://localhost:5173. Open that URL in your browser — the app is fully functional
against your local backend with no further configuration.

---

## 3. Project structure

```
pdfly/
├── backend/
│   ├── app.py                  Flask app — all REST endpoints + error handling
│   ├── cleanup.py              Background job: deletes files older than 1 hour
│   ├── requirements.txt
│   ├── modules/
│   │   ├── validators.py       Upload validation, filename sanitization (FR-01)
│   │   ├── merge.py            FR-02
│   │   ├── split.py            FR-03
│   │   ├── compress.py         FR-04 (Ghostscript)
│   │   ├── convert.py          FR-05 (Poppler)
│   │   ├── toword.py           FR-06 (pdf2docx, pdfplumber, Tesseract OCR fallback)
│   │   ├── watermark.py        FR-07
│   │   ├── rotate.py           FR-08
│   │   ├── imagetopdf.py       FR-12
│   │   ├── wordtopdf.py        FR-11 (LibreOffice)
│   │   └── editpdf.py          FR-13
│   ├── uploads/                Temporary — auto-created, auto-cleaned
│   └── outputs/                Temporary — auto-created, auto-cleaned
└── frontend/
    ├── src/
    │   ├── App.jsx              Route table (Home + tool pages)
    │   ├── toolsConfig.js        Single source of truth: tool metadata, colors, icons
    │   ├── api.js                All backend calls in one place
    │   ├── index.css             Design system (black theme, CSS variables)
    │   ├── pages/
    │   │   ├── Home.jsx          Categorized tool grid
    │   │   └── ToolPage.jsx      Active tool + sidebar of every other tool
    │   └── components/
    │       ├── SiteHeader.jsx
    │       ├── Icon.jsx          Shared icon set
    │       ├── UploadZone.jsx    Drag-and-drop + click-to-browse
    │       └── panels/           One panel per operation
    └── index.html
```

---

## 4. Deploying

### Backend → Render.com
1. Push `backend/` to a GitHub repo.
2. New Web Service → connect the repo.
3. **Build Command:**
   ```
   apt-get update && apt-get install -y poppler-utils ghostscript libreoffice tesseract-ocr && pip install -r requirements.txt
   ```
4. **Start Command:** `gunicorn app:app`
5. Note the deployed URL, e.g. `https://pdfly-backend.onrender.com`.
6. Open `backend/app.py`, add your future Vercel URL to `ALLOWED_ORIGINS`, and redeploy.

### Frontend → Vercel
1. Push `frontend/` to GitHub (same repo or separate).
2. New Project → root directory `frontend`.
3. Environment variable: `VITE_API_BASE = https://pdfly-backend.onrender.com`
4. Deploy.

---

## 5. What's been verified

Every endpoint was run against real generated PDFs before this was handed to you:

| Check | Result |
|---|---|
| Merge 2+ files → correct page count | ✅ |
| Merge with only 1 file → HTTP 400 | ✅ |
| Split valid range → correct pages extracted | ✅ |
| Split out-of-range → HTTP 400 with page count in message | ✅ |
| Rotate 90/180/270 → `/Rotate` property set correctly | ✅ |
| Rotate invalid angle (45) → HTTP 400 | ✅ |
| Watermark valid text → applied to all pages | ✅ |
| Watermark empty text → HTTP 400 | ✅ |
| Convert multi-page PDF → ZIP of PNGs | ✅ |
| Convert single-page PDF → single PNG | ✅ |
| Compress → original/compressed sizes reported via headers | ✅ |
| Compress when result is larger → original returned with notice | ✅ |
| PDF to Word → valid, openable .docx | ✅ |
| Wrong file type upload → HTTP 400 | ✅ |
| Zero-byte file → HTTP 400 | ✅ |
| Path traversal filename (`../../etc/passwd.pdf`) → sanitized | ✅ |
| 5 concurrent requests → all succeed, no cross-contamination | ✅ |
| Files deleted from `uploads/`/`outputs/` after every request | ✅ |
| CORS preflight from frontend origin | ✅ |
| Backend `app.py` imports cleanly with all dependencies installed | ✅ |
| Frontend production build (`npm run build`) | ✅ no errors |

If you rename folders or ports, re-run the equivalent checks — everything above assumes the
default paths and ports documented here.

### A note on this revision

Two problems in the handed-off project were fixed here, independent of the interface redesign:

1. `backend/modules/__init__.py` (and the `.gitkeep` placeholder files) contained the literal
   text `(empty)` instead of being empty — that's what threw the `NameError: name 'empty' is not
   defined` you hit. Both are now genuinely empty.
2. `backend/requirements.txt` was missing five packages that `modules/toword.py` actually imports
   at the top of the file (`PyMuPDF`, `Pillow`, `pdf2docx`, `pdfplumber`, `pytesseract`) — without
   them, `python app.py` fails on import before the server ever starts. They've been added and
   pinned, and a fresh install + `python app.py` was re-tested end to end (`/health` returns 200,
   invalid requests correctly return 400).
