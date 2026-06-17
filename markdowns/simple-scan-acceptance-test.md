# Simple Scan — Acceptance / Test Checklist

A repeatable manual test for `/admin/simple-scan` (component: `src/features/drawing-analyzer/SimpleScanStripped.astro`).
The flow has several **independent** subsystems — test **one layer per run** instead of judging "the whole thing" at once.

> Tip: localhost bypasses auth (`isLocalBypass` in `src/pages/admin/simple-scan.astro`), so you can test without logging in.

---

## 0. Setup (once per session)

- [ ] `npm run dev` is running.
- [ ] `ANTHROPIC_API_KEY` is present in `.env` (only needed for Layer 3 — AI metadata).
- [ ] Open `http://localhost:4321/admin/simple-scan`.

---

## Layer 1 — File loads & renders (no AI, no CV)

| Step                       | Expected                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------- |
| Page loads                 | Title bar reads **"… \| Simple Scan"**; top bar shows Drawing select, Upload, Refresh. |
| Default drawing auto-loads | `#simple-scan-status` moves past "Loading…" to a rendered size / region message.       |
| Overlay                    | Spinner + shimmer bar show during work, then **clear**.                                |
| Toast                      | **"Drawing Ready"** appears (not an error toast).                                      |
| Canvas                     | The sheet is visible in the main area.                                                 |

**If this fails** → problem is _before_ AI/CV: PDF fetch (`/test-drawings/...`), PDF.js, or canvas. Check DevTools **Console** + **Network** for the drawing request.

---

## Layer 2 — Regions / geometry (client-side CV, no LLM)

| Step                  | Expected                                                                   |
| --------------------- | -------------------------------------------------------------------------- |
| Open **Debug Output** | Right column → expand `<details>` "Debug Output" (`#simple-scan-results`). |
| Read JSON             | Shows `regionsDetected`, `regionsConfirmed`, `regionsPending`, etc.        |
| Region boxes          | Detected regions are interactable (confirm / remove) when in that step.    |

**If this fails** → CV path issue, independent of Anthropic. Try a different drawing or adjust region selection.

---

## Layer 3 — AI metadata (`/api/drawing-analyzer/analyze-metadata`)

### Fast check — the AI health strip (no DevTools needed)

The top bar has an **"AI:"** pill (`#simple-scan-ai-health`):

| Dot / label            | Meaning                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| gray "AI: idle"        | No analysis run yet.                                                |
| amber "AI: analyzing…" | Request in flight.                                                  |
| green "AI: OK (200)"   | Success — **click the pill** to see summary/schedule/legend counts. |
| red "AI: error (NNN)"  | Failed — **click the pill** to read the error + hint.               |

Common red states:

- **503 `ANTHROPIC_API_KEY not configured`** → env not loaded by the server; restart dev after `.env` changes.
- **Network** → server not reachable / route error; check terminal logs.

### Visual check — the drawing info panel

- [ ] Open the **side drawer** (panel toggle, top-right of the scan area). It starts **closed**.
- [ ] `#drawing-info-panel` shows a spinner ("Analyzing drawing…") then **markdown sections** (Project Overview, System Design, …), and schedule/legend if present.

### Definitive check — Network tab

- [ ] DevTools → **Network** → filter `analyze-metadata`.
- [ ] One **POST** → status **200**.
- [ ] Response preview has `summary` (string) and optionally `schedule` / `legend` arrays.

---

## Layer 4 — Wizards (Pipes / Sprinklers)

| Step           | Expected                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Enter a wizard | Tab bar appears above the canvas; step dots render.                                              |
| Run / Confirm  | "Run step" → "Re-run" + "Confirm →"; dots advance.                                               |
| Completion     | **Pipe Network** (or **Sprinkler Heads**) summary table renders — readable in light & dark mode. |

**End-to-end signal** for that branch = the summary table populated with sensible counts.

---

## Getting better results (where to tune)

- **AI metadata quality** → raster resolution sent to the API (`resizeForAnalysis`, default ~1800px). Tiny text may drop out at low res.
- **Counts / geometry** → which PDF, region choice, and wizard sliders (scan sensitivity, confidence threshold) usually matter more than the LLM.
- Change **one variable per run** and record the result below.

---

## Run log (copy per test)

```
Date:
Drawing:
Layer tested:
AI health pill:           (idle / analyzing / OK 200 / error NNN)
Network analyze-metadata: (status, summary?, schedule rows, legend entries)
Counts (pipe/sprinkler):
Notes / what I changed:
Result: PASS / FAIL
```
