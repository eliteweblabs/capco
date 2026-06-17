# Simple Scan — CV Pipeline Debug (viable-area visualizer)

A step-by-step visualization of the **client-side** computer-vision pipeline that
finds the "viable area" (the drawing region vs. title block / border / legend)
before any AI runs. Built to make the otherwise-invisible CV stages inspectable.

- **Page:** `/admin/simple-scan-cv-debug`
- **UI component:** `src/features/drawing-analyzer/CvPipelineDebug.astro`
- **Algorithms:** `src/features/drawing-analyzer/cv-pipeline.ts` (pure, reusable, no deps)
- **Cost:** $0 — everything runs in the browser. No Anthropic / no API calls.
- Localhost bypasses auth (same as `/admin/simple-scan`), so you can open it directly.

## What it shows

Two surfaces on the page:

### A. Vector Inspector (fast, auto-runs)

A per-drawing structure verdict read straight from the PDF geometry, no
rasterizing. See the "Vector Inspector" section below.

### B. Step-by-step strip wizard (single column)

Click **Start step-by-step**. The sheet is rasterized once (slow on dense vector
PDFs — see Tuning/Performance), then you refine it **one subtractive step at a
time**: each step shows **Before / After**, exposes the relevant tunable params,
and an **Accept & continue** button that commits the result as the input to the
next step (**Back** reverts).

| Step                              | Strips                                                                     | Params                                                                    | How                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 · Find viable drawing area      | Sheet border, title block, legend strips, **excluded regions**             | keep-pad px, **region toggles**                                           | Runs **first** to cut overhead. Detected at **5000px long edge** (same as `/admin/simple-scan`) via `scoreRegions`, then scaled to the working canvas. Numbered **R# boxes** overlay Before — click a toggle to exclude a non-viable section (legend / stray cluster). Whites out everything not kept.                                                                                                                                                                                                                                                                                                       |
| 2 · Strip text (selectable layer) | **Selectable** text (Acrobat "Select All", the green inspector boxes — always stripped); outlined text only as fallback | force-outlined toggle, min head shapes (2+), font confidence, pad, raster (default off) | Runs **right after** the viable area so text is gone early. **Always** strips the selectable text boxes (verified to sit on the ink). Erases **color-selectively**: learns the head color (masking text boxes), measures the text color, then inside each box whites out only pixels **lighter than the cutoff** (text) while **preserving head-dark pixels** — so a head buried under a text box survives (no blunt rectangle fill). **Only then** detects heads **by color** (`detectHeadsByColor`, green rings) on the cleaned image. **Fallback:** outlined-glyph heuristic, auto-on only when there's no selectable layer (or forced). |
| 3 · Isolate line-work             | everything except long runs                                                | ink threshold, kernel divisor                                             | Morphological opening (`isolateLines`) — pipe network + structural lines survive.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

The standalone horizontal/vertical-line views and the all-at-once stage grid were
removed (pipes live in the _combined_ line-work). The flow is intentionally
extensible — append more strip steps to the `STEPS` array.

### Viable-area parity with `/admin/simple-scan`

The seed mask (`binarizeInkSoft` ≡ `imageToRegionSeedMask`), `getComponents`
(8-connectivity, minArea 18), and `scoreRegions` (≡ `extractBaselineRegions`) are
all identical between the two pages. The only thing that differed was
**resolution**: Simple Scan renders the sheet at `PDF_RENDER_TARGET_LONG_PX = 5000`
and detects regions there, while the debug wizard runs on the **Working size**
(default 1500px). Connected-component detection is very resolution-sensitive
(line connectivity, speck filtering), so the regions diverged. Fix: the wizard now
renders a **dedicated 5000px region raster** (capped at `REGION_DETECT_MAX_PX`),
runs `scoreRegions` on it once during prep, and **scales the selected boxes** down
to the working canvas (`regionBoxesFrom` / `renderRegionRaster`). The boxes are
stored on `prep.regionBoxes`; Step 1 just re-applies the keep-pad + mask, so the
slider stays instant. Result: the viable area matches Simple Scan regardless of
the chosen working size.

**Excluding non-viable regions.** Like Simple Scan's region picker, Step 1 draws
each detected region as a numbered box on Before (green = kept, red dashed + tint
= excluded) and lists `R#` toggle buttons. Clicking a toggle adds/removes that
index from `excludedRegions` (module-level `Set`, persists across **Back**, reset
on **Start over**), repaints the overlay, and re-runs `compute` — which keeps only
the non-excluded boxes. So a legend, title block, or stray cluster that scored as
a "region" can be dropped before it flows into the text-strip / line steps.

### Protecting sprinkler heads (detected AFTER text removal)

Two failure modes drove the final design:

1. Heads were lost when a **label sat beneath a head** and the strip erased the
   merged blob.
2. Detecting heads on the **pre-strip** image produced **false positives on text**
   — the enclosed loop of an `O`/`P`/`R`, periods, etc. read as "repeating dark
   dots" and got ringed/locked (visible in user testing).

The key principle: **all text is selectable** (Acrobat "Select All" ≡
`getTextContent()`), so every character — periods and stray punctuation included —
is targeted and removed by the selectable-text strip. Heads & linework are vector
graphics, **not** text, so the strip can't touch them. The fix for both failure
modes therefore follows for free: strip text **first**, then run head detection on
the **text-free** image. Periods are never a head concern because they're gone
before detection runs. On 1062 Beacon this dropped detected heads from 114 (with
text) to **91** (text-free).

#### Color-driven detection (no manual threshold)

A hand-tuned "head darkness" slider was non-linear and non-monotonic (the count
climbed to a peak then collapsed as heads bloated and merged with linework — see
the sweep in "Why head darkness isn't linear" below). The better model, from the
key observation that **every head is the same color**: don't make the user pick a
threshold — **learn the head color**.

`detectHeadsByColor` (in `cv-pipeline.ts`) runs on the post-text-strip image:

1. **Sweep darkness levels** (`searchFloor`→`searchCeiling`, default 30→170 in
   steps of 6). At each level it binarizes (`binarizeInkHard`) — a mask of "this
   dark **or darker**", lighter pixels ignored — and finds **compact, non-line**
   components (fill ≥ 0.5, aspect 0.45–2.2; line fragments are elongated and fail).
2. **Score each level** by the size of its largest **same-diameter** cluster — i.e.
   how many identical compact shapes share that color. The level that maximizes
   this is the **head color** (the darkness shared by the most repeating symbols).
   Masking is monotone, so the score naturally peaks at the heads' true color and
   falls once heads bloat/merge — picking the peak finds the color automatically.
3. **Require ≥ `minRepeat`** (default **2** — "two or more") identical shapes,
   else no pattern is reported (nothing locked). These clean shapes are the
   **seeds**.
4. **Template-completion pass** (`complete`, default on): the clean components miss
   any head with a **pipe line attached** — the line merges into the blob, making it
   elongated, so it fails the compact/square test (symptom: two identical heads, only
   one ringed). To fix this, the detector **learns the head's shape from the seeds**
   (average ink occupancy in a footprint-sized window, keeping the reliably-inked
   "core" cells) and **slides that template across the head-color mask** (integral-
   image pre-filter for speed, then non-max suppression). A line poking out of the
   symbol only adds ink **outside** the core cells, so the match stays high — both
   twins are found. Acceptance = `matchThresh` (default 0.72 of core ink present).
5. **Lock** every matched head: padded bbox → `protectedHeads`; head list →
   `detectedHeads` (ringed green).

The result reports `color` (auto gray ceiling), `footprint`, `candidates`, and
`levelsScanned` in the step metric. If the outlined/raster fallback runs, the step
**restores `protectedHeads`** from the text-free snapshot so a head survives that
pass; selectable-only sheets need no restore. Control: **min identical shapes**
(2+). Verified on 1062 Beacon: 428 selectable text removed, auto color **≤114
gray**, footprint ≈ 4px, **98 heads** matched from 113 same-color shapes (24 levels
scanned), outlined heuristic off, and title-block letters no longer ring as heads.

#### Why "head darkness" wasn't linear (historical)

The old single-threshold slider produced a peaked, step-wise curve, confirmed on
1062 Beacon (text already stripped):

| Head darkness | Heads   | Footprint | Candidates |
| ------------- | ------- | --------- | ---------- |
| 40            | 61      | 4px       | 69         |
| 80            | 86      | 4px       | 97         |
| 100           | 91      | 4px       | 106        |
| **120**       | **104** | 4px       | 119        |
| 150           | 60      | **5px**   | 74         |
| 180           | 24      | 5px       | 33         |

Thresholding is discrete (pixels flip on in steps), components **merge** as more
turn on, the disk gate is a hard yes/no, and the dominant-size bucket can jump
(note 4px→5px at 150), re-selecting a different subset all at once. The
color-driven detector replaces this knob by auto-locating that peak.

### Selectable text vs. outlined text (why Acrobat "Select All" matters)

Acrobat's **Select All** only highlights the **text layer** — the real text objects
(`Tj`/`TJ` with a font). Sprinkler heads and linework are **vector graphics**
(path-fill ops), which are not part of the text layer, so they're never selected.
That's a structural property of the PDF, **not** an Acrobat quirk: `pdf.js`
`page.getTextContent()` returns the exact same selectable text (`getTextLabels`).

**The selectable layer IS the text (verified) — strip it always.** An earlier
theory held that the 428 selectable items were an "invisible / offset" layer
sitting on blank pixels. A direct browser probe disproved that: rasterizing the
sheet at 1100 px and sampling ink inside the 428 `getTextLabels` boxes shows
**428/428 boxes overlap real ink at ~64% fill** (and a y-flipped variant covers
far less — 219/428 at ~23% — confirming the boxes are correctly oriented, not
mirrored). In other words the green boxes in the Vector Inspector **are** the
text, exactly where it's drawn. The selectable layer is reliable and should be
stripped directly.

**The real bug — a global ink-coverage gate diluted by the viable crop.** The step
used to gate the selectable layer on *global* ink coverage: "use it only if the
boxes cover ≥ 2% ink." But Step 1 (viable area) whites out the title block, notes,
and schedules first — which is where **most** of the 428 boxes live. With those
boxes now over white, the global fraction collapsed toward ~0%, so the gate wrongly
concluded "invisible layer" and **disabled selectable stripping entirely** — even
though the in-plan room/dimension labels still sat squarely on ink. That's why
"before/after showed no difference": the text pass was switched off by a bad gate.

**Fix — drop the gate, always strip the green boxes, head-safely.** The step now:

1. Builds the selectable text boxes from `getTextLabels` (the green boxes) and
   **always** erases them — boxes over already-cleared areas are no-ops; boxes over
   text remove it. No coverage gate.
2. Learns the **head color** with `detectHeadsByColor(working, { ignoreMask })`,
   masking the text-box regions so text can't pollute the color sweep.
3. Measures the **text ink color** = median luminance of ink inside the text boxes
   that is lighter than the head color (the in-plan boxes that actually carry ink).
4. Picks a **cutoff** between head and text (midpoint when both known; `headColor +
   30` as a head-safe fallback when no text color is measurable). It only ever
   blunt-fills as a last resort when no head color is known at all.
5. Erases, inside each text box, **only pixels lighter than the cutoff** (the text)
   and **preserves everything at the head color or darker** — so a head buried
   under a text box survives. **Then** detects heads on the cleaned image.

**Important assumption:** the color-keyed erase only removes text when the **head
is darker than the text** (heads ≤ head-color, text lighter). On these sheets that
holds ("heads are a darker black"). If a sheet ever has text darker than the heads,
the erase won't remove it (and would never erase a head) — that sheet would need a
different rule.

### Fallbacks: outlined glyphs and the optional raster pass

The **outlined-glyph heuristic** (font-baseline, below) runs as a fallback only
when there's **no real selectable layer** — fewer than 20 `getTextLabels` items —
or when the user ticks **Force outlined-text strip**. The 8 outlined-only sheets
fall through here automatically.

The **raster text pass** (`detectTextClusters`, toggle **Raster text strip**,
default **off**) is an optional extra for text that lives outside the selectable
layer. It dilates the ink mask horizontally to bridge letters into rows and keeps
components in a text-height band (`maxH` auto-scales to ~2% of the working long
edge; thin pipe lines fall below `minH` and are skipped). Because it operates on
the rasterized image its rows are always aligned with the visible text, and it
reuses the same color-keyed erase, so `cutoff > head-color` keeps it head-safe.
It's off by default because the selectable layer already covers the text on these
sheets; enable it only if a sheet leaves stray text behind.

### Font baseline (how the Strip-text step finds outlined text)

In a flattened sheet the same letter is the **same path geometry** repeated all
over (the inspector shows ~73% duplicate paths). `getGlyphCandidates` walks the
operator list (tracking the CTM), collects every glyph-sized path box, and tags
each with how many times its exact shape recurs. Shapes that repeat ≥ the **font
confidence** threshold are the document's letterforms; one-off shapes are
graphics and are left alone — so raising the dial reduces over-stripping. The
surviving glyph boxes are clustered into text rows (`clusterGlyphRows`). All of
this is exact vector geometry: no OCR, no resolution loss. The dial re-filters the
precomputed glyph set instantly (no re-parse).

### Strip-text controls

- **Force outlined-text strip** — off by default; auto-engages only when there's
  no selectable text layer. Tick it to also run the risky glyph heuristic on a
  text-layer sheet.
- **Min identical shapes to call it a head pattern (2+)** — how many same-color,
  same-size compact shapes are required before the color is treated as a head
  pattern (default 2). The head color itself is detected automatically.
- **Outlined font confidence (min glyph repeats)** — strength dial for the
  fallback heuristic (default 6). Raise if non-text is stripped; lower to catch
  rarer labels.
- **Fuzziness / pad** — grows each strip box to clear glyph edges.
- **Raster fallback glyph height** — `0` = off; only for true scanned sheets.

### Zoom (every step)

Before/After panels support **scroll = zoom, drag = pan, double-click = zoom in**,
plus a `− / Fit / +` toolbar and `%` readout; both panels are **synchronized**.
Zoom is **display-only** (smoothed) and never touches the pixels the pipeline
processes — those are fixed by **Working size**, so raise that for finer detail.

## Two lineages combined

- **App's current detector** (stages 1, 8–10): binary ink mask → BFS connected
  components → heuristic bbox scoring. Ported verbatim from the logic in
  `SimpleScanStripped.astro` (`imageToRegionSeedMask`, `getComponents`,
  `extractBaselineRegions`) so the visualization reflects what actually runs.
- **github.com/Bakkopi/engineering-drawing-extractor technique** (stages 2–7):
  morphological isolation of horizontal/vertical lines, a dilated "drawing blob",
  and table/border line separation. That project is Python/OpenCV; here it's
  reimplemented in pure JS (separable, prefix-sum morphology — no OpenCV/wasm).
  > Note: that repo has **no license** (all-rights-reserved). Only the generic
  > _techniques_ are reused here; no code was copied.

## Why this exists / what to leverage next

The repo's real payload is **deterministic title-block extraction** (drawing
number, title, drawn-by, …) via OCR of detected table cells — exactly what the
`analyze-metadata.ts` Anthropic call currently does (and which hallucinated
identity fields). Stages 6–7 here are the groundwork: once the title block is
isolated, Tesseract (already a dependency, used server-side in
`src/pages/api/pdf/process-file.ts`) can read those cells locally. Candidate
follow-up: a local OCR pass that pre-fills/validates metadata before (or instead
of) the paid AI call.

## Vector Inspector (the fast path)

The page also has an **"Inspect vectors (fast)"** button (auto-runs on load) that
reads the PDF's actual geometry via `page.getOperatorList()` + `getTextContent()`
— no rasterizing — and reports a per-drawing verdict:

- **structured** — symbols are reusable Form XObjects placed N times → repeats can
  be counted + located almost for free (group by block id, read each transform).
- **flattened** — symbols exploded into primitive path segments; repeats still
  exist as exact-duplicate geometry but must be reconstructed (hash + spatial cluster).
- **raster** — no vector data (scanned image) → use the pixel pipeline + OCR.

Code: `src/features/drawing-analyzer/vector-extract.ts` (clean-room — imports
nothing from the raster monolith). Functions: `analyzeVector`, `getFormInstances`,
`getTextLabels`, `getGlyphCandidates`, `clusterGlyphRows`, `getOutlinedTextRegions`.
The inspector overlays **both** text
signals on the sheet (green = real PDF text, rose = outlined-text rows) — this is
exactly what the Strip-text step removes, shown in seconds with no render.

### Outlined-text detection (the fix for the flattened corpus)

`getOutlinedTextRegions` walks the operator list while tracking the CTM
(`save`/`restore`/`transform`), collects **glyph-sized path bounding boxes** in
the viewport's device-pixel space, and groups them into horizontal text rows
(RLSA on the vector boxes). Because it reads exact geometry it is
resolution-independent and fast (parse only, ~0.6–3.7 s/sheet), and crucially it
works on sheets whose text was converted to outlines — where `getTextLabels`
returns nothing.

Verified on the corpus: every sheet now yields **202–360 text rows** (vs. 0 real
text items on 8 of 9). Spot-checked alignment by overlaying the boxes on the
rendered sheet — they land on room labels, annotations, and the title block.

### Finding on the current `/test-drawings` corpus (May 2026)

All 9 sample sheets came back **flattened — 0 reusable blocks**:

| Drawing                       | paths   | blocks | text items |
| ----------------------------- | ------- | ------ | ---------- |
| 1062 Beacon St                | 63,797  | 0      | **428**    |
| 252 Aspinwall FA              | 14,804  | 0      | 0          |
| 252 Aspinwall FP              | 18,523  | 0      | 0          |
| 28 High St                    | 38,399  | 0      | 0          |
| 60 Lane Park                  | 33,687  | 0      | 0          |
| 7 Circuit / demo-plan (dupes) | 36,850  | 0      | 1          |
| 85 Tremont                    | 109,327 | 0      | 0          |

Implications:

1. **The "free" XObject route is unavailable for this corpus** — every sheet was
   flattened by its export/print pipeline.
2. **Real text exists on only 1 of 9** (1062 Beacon). The rest have text converted
   to outlines — so `getOutlinedTextRegions` reconstructs text from the glyph path
   geometry instead (see "Outlined-text detection" above); this is what the
   Strip-text step now uses, and it strips text on every sheet.
3. The only reliable vector signal across the set is **repeated path geometry**
   (~73% on the first sheet). Reconstructing symbols = hash repeated segment
   geometry + spatially cluster — better than raster (exact coords, no clutter)
   but real work.
4. **Highest-leverage fix is upstream:** PDFs exported straight from Revit/AutoCAD
   (blocks + real text preserved), or DWG/DXF, would make detection near-trivial.
   The flattening is happening before the file reaches us.

## Tuning

- **Hard ink threshold** — raise to keep only the darkest strokes (cleaner lines
  on noisy scans); lower to capture faint CAD line-work.
- **Working size** — larger = more faithful lines but slower morphology.
- The line-kernel sizes and blob dilation in `cv-pipeline.ts` (`isolateLines`,
  `drawingBlob`) are scaled to the sheet; adjust there if regions over/under-grow.
