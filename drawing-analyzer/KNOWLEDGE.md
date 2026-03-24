# Drawing Analyzer — Consolidated Knowledge

> Everything needed to build the fire protection plan analyzer, in one place.
> Consolidated 2026-03-23 from scattered notes, session logs, and working code.

---

## 1. What This System Does

Analyzes fire protection floor plan PDFs to automatically detect and count:
- **Sprinkler heads** (pendent, sidewall)
- **Pipe fittings** (tees, elbows, risers)
- **Floor plan sections/regions** within a drawing sheet

This saves Thomas (fire protection professional) hours of manual counting per plan.

---

## 2. What Works Today (SimpleScan)

**SimpleScan** (`src/features/drawing-analyzer/SimpleScan.astro`) is the working system. ~4,900 lines.

### Working features:
- Region detection in **20 seconds** (the benchmark — don't make it slower)
- Delete buttons for removing bad regions
- Basic drag/resize for region adjustments
- Complete 7-step processing pipeline
- Auto-loads demo plan on page load
- Item library with template matching
- Play/pause/next frame stepping through scan candidates

### The 7-step pipeline:
1. **Detect viable areas** — flood-fill connected components to find floor plan rectangles
2. **Apply viable areas** — crop/mask to selected regions
3. **Find colored lines** — isolate colored pipe runs
4. **Remove hairlines** — strip thin architectural lines
5. **Find dashed lines** — detect dashed pipe segments
6. **Remove text** — strip text labels/annotations
7. **Final output** — cleaned image ready for symbol counting

### Key algorithms in SimpleScan:
- `getComponents()` — BFS flood-fill connected component analysis
- `extractBaselineRegions()` — scoring/filtering regions by size, aspect ratio, ink density, center position, edge proximity
- Filters: bbox ratio 0.015–0.72, aspect 0.35–3.0, ink ratio 0.0015–0.24
- Max 6 regions, sorted by score, non-overlapping (>58% overlap = duplicate)

---

## 3. What Doesn't Work / Known Issues

### Transform handles (unsolved)
SimpleScan resize handles **don't behave like Illustrator**. When you drag a corner, the opposite edge moves instead of staying anchored. This is a CSS transforms vs direct coordinate manipulation issue. Still unsolved but "working enough."

### Step workflow inconsistency
Step 2 shows a cropped view, but Steps 3–7 revert to the full document view. The viewport should stay consistent.

### Port conflicts
The Python server has had issues with ports 5555, 5556, 5557. The current `server.py` runs on port 5557. `plan-scanner.astro` is hardcoded to 5555, `step-by-step-scan.astro` to 5557.

---

## 4. The Request That Was Never Delivered (2026-03-23)

**Original ask:** Make the "Run Next Step" button in SimpleScan run **only Step 3** (colored lines) instead of running Steps 2–7 all at once.

### Where the fix goes:
In `SimpleScan.astro`, around the `confirmOverlayTargetingBtn?.addEventListener("click"` handler:

```javascript
// CURRENT: Runs all steps 2-7
overlayTargetingConfirmed = true;
setStatus("Step 1 confirmed. Running Steps 2-7...");
renderProcessingOnlyView();

// REQUESTED: Run only Step 3 (colored lines)
setStatus("Running Step 3: Finding colored lines...");
runStep3Only(); // New function that runs just the colored-line detection
```

This is the starting point for the re-attempt. Simple, targeted change.

---

## 5. Domain Knowledge (Fire Protection Plans)

### Plan structure:
- Plans are **CAD-generated PDFs** (AutoCAD, Bluebeam, Revit)
- Each sheet has floor plan section(s) surrounded by title blocks, notes, legends, detail cutaways
- Plans are **rotated so pipe runs align to H/V axes** (horizontal/vertical)

### Critical rules:
- **Pipes are ALWAYS horizontal or vertical.** Diagonal lines = architectural, not piping.
- **All symbols on floor plans are the same pixel size** (CAD generates them uniformly). Detail cutaway sections have LARGER symbols (vector-scaled zooms) — must not double-count.
- **Each engineering firm has different symbol styles** — no industry standard. This is why the library/template approach matters.
- **Pendent heads** hang from ceiling (circle with dot). **Sidewall heads** mount on walls (half-circle/"D" shape).
- **Tee junctions** = T-shape pipe branch. **Elbows** = 90° turn. **Risers** = vertical connection between floors (circle with "R").

### Test plans:
| Plan | Location | Expected |
|------|----------|----------|
| Demo Plan | `public/demo-plan.pdf` | Default test |
| 85 Tremont St | iCloud Testing Files | 63 heads (confirmed by manual count) |
| Lane Park | iCloud Testing Files | 5 heads (I miscounted as 4 once — be careful) |

iCloud path: `~/Library/Mobile Documents/com~apple~CloudDocs/Testing Files/`

---

## 6. Architecture

### Frontend (Astro)
```
src/features/drawing-analyzer/
  SimpleScan.astro          ← THE WORKING SYSTEM (4,900 lines)
  DrawingAnalyzer.astro     ← v1 workspace with sliding tabs
  DrawingAnalyzerLab.astro  ← Lab version with full item library
  DrawingAnalyzerLabClientSafe.astro ← Client-safe variant

src/pages/admin/
  plan-scanner.astro        ← Full-page scanner UI (uses SimpleScan detection)
  step-by-step-scan.astro   ← Failed rebuild from 2026-03-23 (can be deleted)

src/pages/api/drawing-analyzer/
  item-library.ts           ← REST API for item library CRUD
```

### Backend (Python Flask)
```
drawing-analyzer/
  server.py                 ← Python API (Flask + OpenCV + PyMuPDF + Anthropic)
  requirements.txt          ← Python dependencies
```

### Endpoints:
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/test-plans/<id>` | GET | Serve test PDFs by ID |
| `/render` | POST | Render PDF page → base64 PNG |
| `/detect` | POST | Detect floor plan sections (flood-fill) |
| `/crop` | POST | Crop a section → base64 PNG |
| `/count` | POST | Count items via Claude Vision API |

### Public assets:
```
public/demo-plan.pdf                              ← Default test plan
public/drawing-analyzer-lab/
  item-library/          ← Raw symbol images (Pend.png, Sprinkler Head.png)
  item-library-normalized/ ← Processed 512px PNGs
  item-library-svg/      ← Vector-traced SVGs
  snapshots/             ← Reference screenshots
```

### Test fixtures:
```
fixtures/drawing-analyzer/
  manifest.json           ← Fixture definitions
  plans/                  ← Source PDFs
  expected/               ← Expected count results
  outputs/                ← Actual results for comparison
  training/               ← Annotation data
```

---

## 7. Processing Approaches (History)

### Approach 1: Pixel pipeline (original)
Strip layers one by one: viable area → text removal → hairlines → pipes → symbols.
**Problem:** Very complex, each step introduces errors, hard to debug.

### Approach 2: Vision AI (Tremont breakthrough)
Send rendered image to Claude Vision, ask it to count.
**Result:** 63/63 on Tremont on first try.
**Problem:** Expensive ($67 in one Opus session). API costs add up fast.

### Approach 3: Template matching library (current goal)
User screenshots/crops a symbol → adds to search library → system finds matches locally.
**Benefit:** Zero API cost. 100% local CV2 template matching.
**Status:** Library UI exists, matching logic exists in SimpleScan, but not fully wired end-to-end.

### Approach 4: Tile-based flood fill (current detection)
All local CV2, zero API cost. PDF text + diagonal line stripping before detection.
Two-step: detect border → refine within. 90° polygon overlay.
Manual "Scan for Items" button to control API spend.

### COST ALERT
Opus conversations are extremely expensive. ALWAYS use Sonnet for coding work.
Only use AI counting as last resort — prefer template matching (zero cost).

---

## 8. Critical Lessons

1. **Follow user instructions exactly** — when they say "copy working pieces," don't rewrite from scratch
2. **Simple fixes stay simple** — don't turn 10-minute fixes into day-long rebuilds
3. **Working > Perfect** — SimpleScan works in 20 seconds; replacements were slower and buggier
4. **Trust user domain knowledge** — Thomas knows fire protection better than any AI
5. **Overcomplication kills projects** — user asked for one button fix, AI tried to rebuild everything
6. **20-second detection is the benchmark** — don't make it slower
7. **Anchor to what works** — SimpleScan is the foundation, extend it, don't replace it

---

## 9. Next Steps (Priority Order)

1. **Deliver the original request:** Make "Run Next Step" run only Step 3 in SimpleScan
2. **Fix transform handles:** Make resize drag anchor the opposite corner (Illustrator behavior)
3. **Wire template matching end-to-end:** Library → scan → match → count (all local, zero API cost)
4. **Fix step viewport consistency:** Keep cropped view throughout Steps 2–7
5. **Stabilize Python server port:** Pick one port and stick with it across all pages

---

## 10. How to Run

### Frontend (Astro dev server):
```bash
cd ~/Astro/rothcobuilt
npm run dev
# Visit http://localhost:4321/admin/plan-scanner
```

### Python API server:
```bash
cd ~/Astro/rothcobuilt/drawing-analyzer
pip install -r requirements.txt
python server.py
# Runs on http://localhost:5557
```

### Environment:
- `ANTHROPIC_API_KEY` must be set in `~/Astro/rothcobuilt/.env` (for the `/count` endpoint)
- Python needs: flask, flask-cors, PyMuPDF (fitz), opencv-python, numpy, scipy, anthropic, python-dotenv, Pillow
