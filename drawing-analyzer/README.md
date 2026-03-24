# Drawing Analyzer

Fire protection plan analysis system. Detects floor plan regions and counts sprinkler heads, pipe fittings, and other fire protection items.

## Quick Start

```bash
# Terminal 1: Astro dev server
cd ~/Astro/rothcobuilt && npm run dev

# Terminal 2: Python API server
cd ~/Astro/rothcobuilt/drawing-analyzer
pip install -r requirements.txt
python server.py          # default port 5555
python server.py 5557     # or specify port
```

Then visit: http://localhost:4321/admin/plan-scanner

## Folder Contents

| File | Purpose |
|------|---------|
| `KNOWLEDGE.md` | **Read this first.** All domain knowledge, architecture, lessons learned. |
| `server.py` | Python Flask API (render, detect, crop, count) |
| `requirements.txt` | Python dependencies |
| `README.md` | This file |

## Related Files (elsewhere in repo)

| Path | Purpose |
|------|---------|
| `src/features/drawing-analyzer/SimpleScan.astro` | **THE working frontend** (~4,900 lines) |
| `src/pages/admin/plan-scanner.astro` | Full-page scanner page |
| `src/pages/api/drawing-analyzer/item-library.ts` | Item library REST API |
| `public/demo-plan.pdf` | Default test plan |
| `public/drawing-analyzer-lab/item-library/` | Symbol template images |
| `fixtures/drawing-analyzer/` | Test fixtures and expected results |

## Status

- **Region detection:** Working (20 seconds)
- **Item counting via AI:** Working (but expensive — use sparingly)
- **Template matching:** Library UI exists, needs end-to-end wiring
- **Transform handles:** Functional but not Illustrator-perfect
