/**
 * Client-safe computer-vision pipeline for the Simple Scan "viable area" step,
 * factored out for visualization + reuse.
 *
 * Two lineages are combined here:
 *  - The app's existing approach (binary ink mask → connected components →
 *    heuristic bbox scoring) as it currently runs in SimpleScanStripped.astro.
 *  - The technique from github.com/Bakkopi/engineering-drawing-extractor
 *    (Python/OpenCV): morphological isolation of horizontal/vertical lines, a
 *    dilated "drawing blob", and table/border line separation — reimplemented
 *    in pure JS (no OpenCV/wasm) so it runs in the browser.
 *
 * Everything is deterministic and runs locally — no API/LLM cost.
 */

export interface Bbox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Component extends Bbox {
  area: number;
}

export interface ScoredRegion extends Bbox {
  area: number;
  score: number;
}

export type BinaryMask = Uint8Array; // 1 = foreground (ink), 0 = background

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

// ── Binarization ────────────────────────────────────────────────────────────

/**
 * Soft ink mask — mirrors `imageToRegionSeedMask` in SimpleScanStripped.astro.
 * Keeps near-neutral dark marks (drops strongly colored pixels). Used for the
 * connected-component region detector.
 */
export function binarizeInkSoft(img: ImageData): BinaryMask {
  const { width, height, data } = img;
  const mask = new Uint8Array(width * height);
  for (let i = 0, p = 0; p < mask.length; p += 1, i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const gray = r * 0.299 + g * 0.587 + b * 0.114;
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    mask[p] = gray < 244 && a > 6 && spread < 88 ? 1 : 0;
  }
  return mask;
}

/**
 * Hard threshold (grayscale < threshold = ink). Mirrors the repo's
 * `cv2.threshold(img, 127, 255, THRESH_BINARY_INV)`. Used for line isolation,
 * where we want crisp structural strokes rather than light fills.
 */
export function binarizeInkHard(img: ImageData, threshold = 170): BinaryMask {
  const { width, height, data } = img;
  const mask = new Uint8Array(width * height);
  for (let i = 0, p = 0; p < mask.length; p += 1, i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = r * 0.299 + g * 0.587 + b * 0.114;
    mask[p] = gray < threshold ? 1 : 0;
  }
  return mask;
}

export function countOnes(mask: BinaryMask): number {
  let n = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i]) n++;
  return n;
}

export function maskOr(a: BinaryMask, b: BinaryMask): BinaryMask {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] || b[i] ? 1 : 0;
  return out;
}

export function maskAndNot(a: BinaryMask, b: BinaryMask): BinaryMask {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] && !b[i] ? 1 : 0;
  return out;
}

// ── Morphology (separable, prefix-sum, O(n) per pass) ─────────────────────────
//
// Binary erosion with a line kernel of length k: a pixel survives only if every
// pixel in its k-window is foreground. Dilation: survives if any is foreground.
// Implemented per-row / per-column with running window sums for speed.

function morphHorizontal(
  mask: BinaryMask,
  width: number,
  height: number,
  k: number,
  erode: boolean
): BinaryMask {
  const out = new Uint8Array(mask.length);
  const r = Math.max(0, Math.floor(k / 2));
  for (let y = 0; y < height; y++) {
    const row = y * width;
    // running sum over window [x-r, x+r]
    let sum = 0;
    for (let x = 0; x <= r && x < width; x++) sum += mask[row + x];
    for (let x = 0; x < width; x++) {
      const lo = x - r;
      const hi = x + r;
      const winLen = Math.min(hi, width - 1) - Math.max(lo, 0) + 1;
      out[row + x] = erode ? (sum === winLen ? 1 : 0) : sum > 0 ? 1 : 0;
      // slide window right
      const drop = lo; // index leaving on next step (x -> x+1 removes lo)
      const add = hi + 1;
      if (drop >= 0 && drop < width) sum -= mask[row + drop];
      if (add >= 0 && add < width) sum += mask[row + add];
    }
  }
  return out;
}

function morphVertical(
  mask: BinaryMask,
  width: number,
  height: number,
  k: number,
  erode: boolean
): BinaryMask {
  const out = new Uint8Array(mask.length);
  const r = Math.max(0, Math.floor(k / 2));
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = 0; y <= r && y < height; y++) sum += mask[y * width + x];
    for (let y = 0; y < height; y++) {
      const lo = y - r;
      const hi = y + r;
      const winLen = Math.min(hi, height - 1) - Math.max(lo, 0) + 1;
      out[y * width + x] = erode ? (sum === winLen ? 1 : 0) : sum > 0 ? 1 : 0;
      const drop = lo;
      const add = hi + 1;
      if (drop >= 0 && drop < height) sum -= mask[drop * width + x];
      if (add >= 0 && add < height) sum += mask[add * width + x];
    }
  }
  return out;
}

export const erodeH = (m: BinaryMask, w: number, h: number, k: number) =>
  morphHorizontal(m, w, h, k, true);
export const dilateH = (m: BinaryMask, w: number, h: number, k: number) =>
  morphHorizontal(m, w, h, k, false);
export const erodeV = (m: BinaryMask, w: number, h: number, k: number) =>
  morphVertical(m, w, h, k, true);
export const dilateV = (m: BinaryMask, w: number, h: number, k: number) =>
  morphVertical(m, w, h, k, false);

/** Box (3×3-equivalent) erode/dilate via separable H+V passes. */
export function erodeBox(m: BinaryMask, w: number, h: number, k = 3): BinaryMask {
  return erodeV(erodeH(m, w, h, k), w, h, k);
}
export function dilateBox(m: BinaryMask, w: number, h: number, k = 3): BinaryMask {
  return dilateV(dilateH(m, w, h, k), w, h, k);
}

// ── Line isolation + drawing blob (the repo's technique, in JS) ───────────────

export interface LineLayers {
  horizontal: BinaryMask;
  vertical: BinaryMask;
  combined: BinaryMask;
}

/**
 * Isolate long horizontal & vertical strokes via morphological opening
 * (erode then dilate) with line-shaped kernels sized relative to the sheet.
 * Mirrors the repo's vertical/horizontal line extraction.
 */
export function isolateLines(
  hardInk: BinaryMask,
  width: number,
  height: number,
  divisor = 90
): LineLayers {
  const d = Math.max(8, divisor);
  const hLen = Math.max(12, Math.round(width / d));
  const vLen = Math.max(12, Math.round(height / d));
  // opening = erode then dilate with the same kernel
  const horizontal = dilateH(erodeH(hardInk, width, height, hLen), width, height, hLen);
  const vertical = dilateV(erodeV(hardInk, width, height, vLen), width, height, vLen);
  return { horizontal, vertical, combined: maskOr(horizontal, vertical) };
}

/**
 * Grow the dense drawing area into a single solid blob. Mirrors the repo's
 * "erode 3×3 ×2, dilate 3×3 ×50" — implemented as a small erode (despeckle)
 * followed by a large dilation kernel.
 */
export function drawingBlob(combinedLines: BinaryMask, width: number, height: number): BinaryMask {
  const eroded = erodeBox(combinedLines, width, height, 3);
  const grow = Math.max(9, Math.round(Math.min(width, height) / 22)) | 1; // odd
  return dilateBox(eroded, width, height, grow);
}

/** Lines that fall OUTSIDE the drawing blob → title block / border grid. */
export function tableLines(combinedLines: BinaryMask, blob: BinaryMask): BinaryMask {
  return maskAndNot(combinedLines, blob);
}

// ── Connected components (BFS flood fill) ─────────────────────────────────────
// Ported from `getComponents` in SimpleScanStripped.astro.

export function getComponents(
  mask: BinaryMask,
  width: number,
  height: number,
  minArea = 18,
  maxArea = 999999,
  connectivity8 = true
): Component[] {
  const visited = new Uint8Array(width * height);
  const qx = new Int32Array(width * height);
  const qy = new Int32Array(width * height);
  const out: Component[] = [];
  const neigh = connectivity8
    ? [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ]
    : [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x;
      if (!mask[start] || visited[start]) continue;
      let head = 0;
      let tail = 0;
      qx[tail] = x;
      qy[tail] = y;
      tail += 1;
      visited[start] = 1;
      let area = 0;
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      while (head < tail) {
        const cx = qx[head];
        const cy = qy[head];
        head += 1;
        area += 1;
        if (cx < minX) minX = cx;
        if (cy < minY) minY = cy;
        if (cx > maxX) maxX = cx;
        if (cy > maxY) maxY = cy;
        for (let ni = 0; ni < neigh.length; ni++) {
          const nx = cx + neigh[ni][0];
          const ny = cy + neigh[ni][1];
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nidx = ny * width + nx;
          if (!mask[nidx] || visited[nidx]) continue;
          visited[nidx] = 1;
          qx[tail] = nx;
          qy[tail] = ny;
          tail += 1;
        }
      }
      if (area >= minArea && area <= maxArea) {
        out.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, area });
      }
    }
  }
  return out;
}

// ── Region scoring (the app's "viable area" heuristic) ────────────────────────
// Ported from `extractBaselineRegions` in SimpleScanStripped.astro.

export interface RegionResult {
  components: Component[];
  scored: ScoredRegion[];
  selected: Bbox[];
}

export function scoreRegions(softInk: BinaryMask, width: number, height: number): RegionResult {
  const canvasArea = Math.max(1, width * height);
  const components = getComponents(softInk, width, height, 18, canvasArea * 0.9);
  const edgeMargin = Math.max(6, Math.round(Math.min(width, height) * 0.02));
  const scored: ScoredRegion[] = [];

  for (const c of components) {
    const bboxArea = c.w * c.h;
    const bboxRatio = bboxArea / canvasArea;
    if (bboxRatio < 0.015 || bboxRatio > 0.72) continue;
    const aspect = c.w / Math.max(1, c.h);
    if (aspect < 0.35 || aspect > 3.0) continue;
    const inkRatio = c.area / Math.max(1, bboxArea);
    if (inkRatio < 0.0015 || inkRatio > 0.24) continue;

    const nearLeft = c.x <= edgeMargin;
    const nearTop = c.y <= edgeMargin;
    const nearRight = c.x + c.w >= width - edgeMargin;
    const nearBottom = c.y + c.h >= height - edgeMargin;
    const edgeTouchCount = [nearLeft, nearTop, nearRight, nearBottom].filter(Boolean).length;

    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    const centerDist =
      Math.hypot(cx - width / 2, cy - height / 2) / Math.max(1, Math.hypot(width / 2, height / 2));
    const centerBonus = 1 - clamp(centerDist, 0, 1);
    const frameBonus = clamp(1 - Math.abs(inkRatio - 0.06) / 0.14, 0, 1);
    const edgePenalty = edgeTouchCount >= 2 ? 0.22 : 0;
    const score = bboxRatio * 1.1 + frameBonus * 0.35 + centerBonus * 0.2 - edgePenalty;

    scored.push({ ...c, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const selected: Bbox[] = [];
  for (const c of scored) {
    const overlaps = selected.some((k) => {
      const x0 = Math.max(c.x, k.x);
      const y0 = Math.max(c.y, k.y);
      const x1 = Math.min(c.x + c.w - 1, k.x + k.w - 1);
      const y1 = Math.min(c.y + c.h - 1, k.y + k.h - 1);
      if (x1 < x0 || y1 < y0) return false;
      const inter = (x1 - x0 + 1) * (y1 - y0 + 1);
      return inter / Math.max(1, Math.min(c.w * c.h, k.w * k.h)) > 0.58;
    });
    if (overlaps) continue;
    const pad = Math.max(8, Math.round(Math.min(c.w, c.h) * 0.03));
    selected.push({
      x: clamp(c.x - pad, 0, width - 1),
      y: clamp(c.y - pad, 0, height - 1),
      w: clamp(c.w + pad * 2, 1, width),
      h: clamp(c.h + pad * 2, 1, height),
    });
    if (selected.length >= 4) break;
  }

  return { components, scored, selected };
}

// ── Text-cluster detection (works on outlined/flattened text) ─────────────────
// Vector text positions only exist on ~1 of N exported sheets; on the rest text
// is outlined into paths. This finds text by geometry instead: glyph-sized
// connected components that line up into horizontal runs (words / lines).

export interface TextClusterOpts {
  /** Smallest text-line height to keep (px). */
  minH?: number;
  /** Largest single glyph height (px); lines taller than ~1.6× this are dropped as graphics. */
  maxH?: number;
  /** Horizontal run-length used to merge adjacent letters into a line blob (px). Default ≈ maxH. */
  dilate?: number;
  /** Smallest line width to keep (px) — drops isolated specks/symbols. Default ≈ maxH. */
  minW?: number;
  /** Drop blobs wider than this fraction of the sheet (borders / rule lines). Default 0.6. */
  maxWFrac?: number;
  pad?: number;
}

/**
 * Detect text regions by geometry (RLSA-style), independent of whether the text
 * is real PDF text or outlined paths. Horizontally dilate the ink so the letters
 * of a word/line bridge into one blob, then keep blobs whose HEIGHT is in the
 * text band and whose WIDTH is a line (not a speck, not a full-width border).
 */
export function detectTextClusters(
  mask: BinaryMask,
  width: number,
  height: number,
  opts: TextClusterOpts = {}
): Bbox[] {
  const minH = opts.minH ?? 4;
  const maxH = opts.maxH ?? 22;
  const dl = Math.max(2, Math.round(opts.dilate ?? maxH * 1.2));
  const minW = opts.minW ?? maxH;
  const maxW = Math.round(width * (opts.maxWFrac ?? 0.6));
  const pad = opts.pad ?? 2;

  // Bridge letters → line blobs.
  const merged = dilateH(mask, width, height, dl);
  const comps = getComponents(merged, width, height, 24, 999999, true);

  const r = Math.floor(dl / 2); // amount the dilation grew each side
  const out: Bbox[] = [];
  for (const c of comps) {
    if (c.h < minH || c.h > maxH * 1.6) continue; // text-line height band
    if (c.w < minW || c.w > maxW) continue; // not a speck, not a border/rule
    // Undo the horizontal growth so the box hugs the actual glyphs.
    const x = c.x + r;
    const w = Math.max(2, c.w - dl);
    out.push({
      x: Math.max(0, x - pad),
      y: Math.max(0, c.y - pad),
      w: Math.min(width, w + pad * 2),
      h: Math.min(height, c.h + pad * 2),
    });
  }
  return out;
}

// ── Solid symbol protection (sprinkler heads etc.) ───────────────────────────
// Sprinkler heads are solid, dark, compact filled disks; text is thin strokes /
// open outlines. Detect the dark filled blobs so the text-strip step can protect
// them (restore their pixels) instead of erasing them.

export interface SolidBlobOpts {
  /** Pixels darker than this grayscale are "solid ink" (heads are near-black). */
  maxLum?: number;
  minArea?: number;
  maxArea?: number;
  /** area / bbox-area — a filled disk is ~0.78; open letters are lower. */
  minFill?: number;
  /** width/height bounds — heads are roughly square, excludes I, l, dashes. */
  minAspect?: number;
  maxAspect?: number;
}

export function detectSolidBlobs(
  img: ImageData,
  opts: SolidBlobOpts = {}
): { blobs: Component[]; protect: Uint8Array } {
  const { width: w, height: h } = img;
  const maxLum = opts.maxLum ?? 95;
  const minArea = opts.minArea ?? 8;
  const maxArea = opts.maxArea ?? 2200;
  const minFill = opts.minFill ?? 0.55;
  const minAspect = opts.minAspect ?? 0.5;
  const maxAspect = opts.maxAspect ?? 2.0;

  const dark = binarizeInkHard(img, maxLum);
  const comps = getComponents(dark, w, h, minArea, maxArea, true);
  const protect = new Uint8Array(w * h);
  const blobs: Component[] = [];
  for (const c of comps) {
    const fill = c.area / Math.max(1, c.w * c.h);
    const aspect = c.w / Math.max(1, c.h);
    if (fill < minFill || aspect < minAspect || aspect > maxAspect) continue;
    blobs.push(c);
    const y1 = Math.min(h, c.y + c.h);
    const x1 = Math.min(w, c.x + c.w);
    for (let y = c.y; y < y1; y++) {
      let idx = y * w + c.x;
      for (let x = c.x; x < x1; x++, idx++) if (dark[idx]) protect[idx] = 1;
    }
  }
  return { blobs, protect };
}

// ── Repeating-symbol (sprinkler head) detection ──────────────────────────────
// Sprinkler heads are a REPEATING near-black filled dot, distinctly darker than
// the gray text/linework. Rather than judge each blob in isolation (which fails
// when a label touches a head), we find the dominant repeating disk footprint
// and protect every blob that matches it. Robust to text sitting beneath a head.

export interface RepeatHeadOpts {
  /** Pixels darker than this grayscale are head ink (heads are near-black; text is lighter). */
  maxLum?: number;
  minArea?: number;
  maxArea?: number;
  /** area / bbox-area — a filled disk ≈ 0.6–0.85; open letters score lower. */
  minFill?: number;
  minAspect?: number;
  maxAspect?: number;
  /** Fractional tolerance on the dominant diameter to count as the same symbol. */
  sizeTol?: number;
  /** Require at least this many similar blobs to treat them as a repeating pattern. */
  minRepeat?: number;
  /** Grow each protected head by this many px (keeps the full symbol + a ring). */
  pad?: number;
}

export interface RepeatHeadResult {
  heads: Component[];
  protect: Uint8Array;
  /** Dominant head diameter (px), or null when no repeating pattern was found. */
  footprint: number | null;
  /** Disk-like candidates examined (diagnostics). */
  candidates: number;
}

export function detectRepeatingHeads(img: ImageData, opts: RepeatHeadOpts = {}): RepeatHeadResult {
  const { width: w, height: h } = img;
  const maxLum = opts.maxLum ?? 100;
  const minArea = opts.minArea ?? 6;
  const maxArea = opts.maxArea ?? 4000;
  const minFill = opts.minFill ?? 0.5;
  const minAspect = opts.minAspect ?? 0.45;
  const maxAspect = opts.maxAspect ?? 2.2;
  const sizeTol = opts.sizeTol ?? 0.35;
  const minRepeat = opts.minRepeat ?? 3;
  const pad = opts.pad ?? 2;

  // Strict near-black mask isolates head cores from lighter gray text/lines.
  const dark = binarizeInkHard(img, maxLum);
  const comps = getComponents(dark, w, h, minArea, maxArea, true);

  // Disk-like candidates (compact, roughly square, well-filled).
  const cand: Component[] = [];
  const diams: number[] = [];
  for (const c of comps) {
    const fill = c.area / Math.max(1, c.w * c.h);
    const aspect = c.w / Math.max(1, c.h);
    if (fill < minFill || aspect < minAspect || aspect > maxAspect) continue;
    cand.push(c);
    diams.push((c.w + c.h) / 2);
  }

  // Dominant repeating diameter: the most-populated relative size bucket.
  let footprint: number | null = null;
  if (cand.length) {
    const sorted = [...diams].sort((a, b) => a - b);
    let best = { count: 0, vals: [] as number[] };
    for (let i = 0; i < sorted.length; i++) {
      const hi = sorted[i] * (1 + sizeTol);
      const vals: number[] = [];
      for (let j = i; j < sorted.length && sorted[j] <= hi; j++) vals.push(sorted[j]);
      if (vals.length > best.count) best = { count: vals.length, vals };
    }
    if (best.count >= minRepeat) footprint = best.vals[Math.floor(best.vals.length / 2)];
  }

  // Keep heads matching the footprint (or all disk-like dots if no pattern emerged),
  // and protect a padded bbox so the whole head survives a later text strip.
  const heads: Component[] = [];
  const protect = new Uint8Array(w * h);
  for (let i = 0; i < cand.length; i++) {
    const c = cand[i];
    if (
      footprint !== null &&
      (diams[i] < footprint * (1 - sizeTol) || diams[i] > footprint * (1 + sizeTol))
    )
      continue;
    heads.push(c);
    const x0 = Math.max(0, c.x - pad);
    const y0 = Math.max(0, c.y - pad);
    const x1 = Math.min(w, c.x + c.w + pad);
    const y1 = Math.min(h, c.y + c.h + pad);
    for (let y = y0; y < y1; y++) {
      let idx = y * w + x0;
      for (let x = x0; x < x1; x++, idx++) protect[idx] = 1;
    }
  }
  return { heads, protect, footprint, candidates: cand.length };
}

// ── Color-driven head detection (auto darkness) ───────────────────────────────
// User insight: every head is the SAME color (a single darkness), darker than the
// linework. So instead of a hand-tuned threshold, we LEARN the head color: sweep
// candidate darkness levels and pick the one where the most compact, same-size,
// NON-line shapes repeat. That darkness is the head color; we then keep only
// shapes at that color (mask = "this dark or darker", lighter pixels ignored).
// "Two or more identical compact shapes of the same color" = the target pattern.

export interface HeadColorOpts {
  /** Don't consider anything lighter than this gray as candidate head ink. */
  searchCeiling?: number;
  /** Darkest gray to begin the color sweep at. */
  searchFloor?: number;
  /** Sweep granularity (gray levels per step). */
  step?: number;
  minArea?: number;
  maxArea?: number;
  /** area / bbox-area — a filled disk ≈ 0.6–0.85; line fragments score low. */
  minFill?: number;
  /** width/height bounds — heads are roughly square; excludes line segments. */
  minAspect?: number;
  maxAspect?: number;
  /** Fractional tolerance on diameter (same size) AND on color (same darkness). */
  sizeTol?: number;
  /** "Two or more" — minimum identical shapes to call it a repeating pattern. */
  minRepeat?: number;
  /** Grow each protected head by this many px. */
  pad?: number;
  /** Pixels set to 1 here are excluded from the sweep (e.g. text-box regions), so
   *  text can't pollute the learned head color. */
  ignoreMask?: Uint8Array;
  /** After learning the head shape from clean seeds, slide it as a template to find
   *  EVERY matching symbol — including heads with a pipe line attached (which merges
   *  the blob and would otherwise fail the compactness test). Default: true. */
  complete?: boolean;
  /** Template-match acceptance (fraction of the learned head's core ink that must be
   *  present at a candidate location). Default 0.72. */
  matchThresh?: number;
}

export interface HeadColorResult {
  heads: Component[];
  protect: Uint8Array;
  /** Auto-detected head color (max gray of head ink), or null if no pattern. */
  color: number | null;
  /** Dominant head diameter (px) at that color. */
  footprint: number | null;
  /** Disk-like candidates examined at the chosen color (diagnostics). */
  candidates: number;
  /** Darkness levels evaluated during the sweep (diagnostics). */
  levelsScanned: number;
}

interface DiskSet {
  cand: Component[];
  diams: number[];
}

function diskCandidatesAt(
  dark: BinaryMask,
  w: number,
  h: number,
  o: Required<Pick<HeadColorOpts, "minArea" | "maxArea" | "minFill" | "minAspect" | "maxAspect">>
): DiskSet {
  const comps = getComponents(dark, w, h, o.minArea, o.maxArea, true);
  const cand: Component[] = [];
  const diams: number[] = [];
  for (const c of comps) {
    const fill = c.area / Math.max(1, c.w * c.h);
    const aspect = c.w / Math.max(1, c.h);
    // "Not a line segment": compact (well-filled) and roughly square.
    if (fill < o.minFill || aspect < o.minAspect || aspect > o.maxAspect) continue;
    cand.push(c);
    diams.push((c.w + c.h) / 2);
  }
  return { cand, diams };
}

/**
 * Template-completion pass. The clean connected-component detector misses heads
 * that have a pipe line touching them (the line merges into the blob, so it fails
 * the compact/square test). Here we LEARN the head's shape from the clean seeds and
 * slide it across the head-color mask to find every matching symbol. A line poking
 * out of the symbol only adds ink OUTSIDE the template's core cells, so it doesn't
 * lower the match — both identical heads are found whether or not a line attaches.
 */
function templateCompleteHeads(
  dark: BinaryMask,
  w: number,
  h: number,
  seeds: Component[],
  footprint: number,
  matchThresh: number
): Component[] {
  if (seeds.length < 1 || footprint <= 0) return seeds;
  // Odd window a bit larger than the head so the whole symbol fits.
  let S = Math.max(7, Math.round(footprint * 1.4));
  if (S % 2 === 0) S += 1;
  const half = (S - 1) / 2;
  if (w < S || h < S) return seeds;

  // Average occupancy template from the seeds (probability of ink per cell).
  const acc = new Float32Array(S * S);
  for (const c of seeds) {
    const cx = Math.round(c.x + c.w / 2);
    const cy = Math.round(c.y + c.h / 2);
    for (let ty = 0; ty < S; ty++) {
      const sy = cy - half + ty;
      if (sy < 0 || sy >= h) continue;
      for (let tx = 0; tx < S; tx++) {
        const sx = cx - half + tx;
        if (sx < 0 || sx >= w) continue;
        if (dark[sy * w + sx]) acc[ty * S + tx]++;
      }
    }
  }
  // Core = cells that are reliably ink across the seeds (the symbol's signature).
  const n = seeds.length;
  const core: number[] = [];
  for (let i = 0; i < S * S; i++) if (acc[i] / n >= 0.5) core.push(i);
  if (core.length < 3) for (let i = 0; i < S * S; i++) if (acc[i] / n >= 0.3) core.push(i);
  if (core.length < 3) return seeds;
  let seedWindowInk = 0;
  for (let i = 0; i < S * S; i++) seedWindowInk += acc[i];
  seedWindowInk /= n;
  const prefilter = Math.max(1, seedWindowInk * 0.45);

  // Integral image of the ink mask for O(1) window sums (cheap pre-filter).
  const iw = w + 1;
  const integ = new Int32Array(iw * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    const o = (y + 1) * iw;
    const po = y * iw;
    for (let x = 0; x < w; x++) {
      row += dark[y * w + x] ? 1 : 0;
      integ[o + x + 1] = integ[po + x + 1] + row;
    }
  }
  const winSum = (cx: number, cy: number) => {
    const x0 = cx - half;
    const y0 = cy - half;
    const x1 = cx + half + 1;
    const y1 = cy + half + 1;
    return integ[y1 * iw + x1] - integ[y0 * iw + x1] - integ[y1 * iw + x0] + integ[y0 * iw + x0];
  };

  type Hit = { cx: number; cy: number; score: number };
  const hits: Hit[] = [];
  for (let cy = half; cy < h - half; cy++) {
    for (let cx = half; cx < w - half; cx++) {
      if (winSum(cx, cy) < prefilter) continue;
      let on = 0;
      for (let k = 0; k < core.length; k++) {
        const ci = core[k];
        const sx = cx - half + (ci % S);
        const sy = cy - half + ((ci / S) | 0);
        if (dark[sy * w + sx]) on++;
      }
      const score = on / core.length;
      if (score >= matchThresh) hits.push({ cx, cy, score });
    }
  }
  if (!hits.length) return seeds;

  // Non-max suppression: keep the strongest hit in each head-sized neighborhood.
  hits.sort((a, b) => b.score - a.score);
  const minDist = Math.max(2, footprint * 0.7);
  const minDist2 = minDist * minDist;
  const kept: Hit[] = [];
  for (const hcand of hits) {
    let clash = false;
    for (const k of kept) {
      const dx = k.cx - hcand.cx;
      const dy = k.cy - hcand.cy;
      if (dx * dx + dy * dy < minDist2) {
        clash = true;
        break;
      }
    }
    if (!clash) kept.push(hcand);
  }

  const out: Component[] = kept.map((k) => ({
    x: k.cx - half,
    y: k.cy - half,
    w: S,
    h: S,
    area: Math.round(seedWindowInk),
  }));
  // Never return fewer than the clean detector found.
  return out.length >= seeds.length ? out : seeds;
}

/** Largest cluster of similar diameters (the repeating same-size group). */
function dominantSizeBucket(diams: number[], sizeTol: number): { count: number; size: number } {
  if (!diams.length) return { count: 0, size: 0 };
  const sorted = [...diams].sort((a, b) => a - b);
  let best = { count: 0, size: 0 };
  for (let i = 0; i < sorted.length; i++) {
    const hi = sorted[i] * (1 + sizeTol);
    const vals: number[] = [];
    for (let j = i; j < sorted.length && sorted[j] <= hi; j++) vals.push(sorted[j]);
    if (vals.length > best.count)
      best = { count: vals.length, size: vals[Math.floor(vals.length / 2)] };
  }
  return best;
}

export function detectHeadsByColor(img: ImageData, opts: HeadColorOpts = {}): HeadColorResult {
  const { width: w, height: h } = img;
  const searchCeiling = opts.searchCeiling ?? 170;
  const searchFloor = opts.searchFloor ?? 30;
  const step = opts.step ?? 6;
  const shape = {
    minArea: opts.minArea ?? 6,
    maxArea: opts.maxArea ?? 4000,
    minFill: opts.minFill ?? 0.5,
    minAspect: opts.minAspect ?? 0.45,
    maxAspect: opts.maxAspect ?? 2.2,
  };
  const sizeTol = opts.sizeTol ?? 0.35;
  const minRepeat = opts.minRepeat ?? 2;
  const pad = opts.pad ?? 2;
  const ignoreMask = opts.ignoreMask && opts.ignoreMask.length === w * h ? opts.ignoreMask : null;

  // Sweep darkness levels; at each, count the largest group of identical-size
  // compact shapes. The level that maximizes that count is the head color — the
  // darkness shared by the most repeating non-line symbols. Masking is monotone
  // ("this dark or darker"), so this naturally peaks at the heads' true color and
  // falls off once heads bloat and merge with linework.
  let best = { color: null as number | null, count: 0, size: 0, set: null as DiskSet | null };
  let levelsScanned = 0;
  for (let d = searchFloor; d <= searchCeiling; d += step) {
    const dark = binarizeInkHard(img, d);
    // Drop ignored regions (e.g. text boxes) so they can't form the pattern.
    if (ignoreMask) for (let i = 0; i < dark.length; i++) if (ignoreMask[i]) dark[i] = 0;
    const set = diskCandidatesAt(dark, w, h, shape);
    levelsScanned++;
    if (!set.cand.length) continue;
    const bucket = dominantSizeBucket(set.diams, sizeTol);
    if (bucket.count > best.count) best = { color: d, count: bucket.count, size: bucket.size, set };
  }

  const heads: Component[] = [];
  const protect = new Uint8Array(w * h);
  if (!best.set || best.count < minRepeat || best.color === null) {
    return { heads, protect, color: null, footprint: null, candidates: 0, levelsScanned };
  }

  // Keep only the shapes at the head color whose size matches the dominant
  // footprint — i.e. the same-color, same-shape repeating symbols. These are the
  // CLEAN seeds (heads with nothing touching them).
  const { cand, diams } = best.set;
  const footprint = best.size;
  const seeds: Component[] = [];
  for (let i = 0; i < cand.length; i++) {
    if (diams[i] < footprint * (1 - sizeTol) || diams[i] > footprint * (1 + sizeTol)) continue;
    seeds.push(cand[i]);
  }

  // Completion pass: learn the head shape from the seeds and template-match the
  // whole sheet, so heads with a pipe line attached (which the compactness test
  // rejects) are still found. Disable with opts.complete = false.
  let finalHeads = seeds;
  if (opts.complete !== false && seeds.length >= 1) {
    const darkAtColor = binarizeInkHard(img, best.color);
    if (ignoreMask)
      for (let i = 0; i < darkAtColor.length; i++) if (ignoreMask[i]) darkAtColor[i] = 0;
    finalHeads = templateCompleteHeads(
      darkAtColor,
      w,
      h,
      seeds,
      footprint,
      opts.matchThresh ?? 0.72
    );
  }

  for (const c of finalHeads) {
    heads.push(c);
    const x0 = Math.max(0, c.x - pad);
    const y0 = Math.max(0, c.y - pad);
    const x1 = Math.min(w, c.x + c.w + pad);
    const y1 = Math.min(h, c.y + c.h + pad);
    for (let y = y0; y < y1; y++) {
      let idx = y * w + x0;
      for (let x = x0; x < x1; x++, idx++) protect[idx] = 1;
    }
  }
  return {
    heads,
    protect,
    color: best.color,
    footprint,
    candidates: cand.length,
    levelsScanned,
  };
}

// ── Visualization helpers (mask → ImageData) ──────────────────────────────────

export function maskToImageData(
  mask: BinaryMask,
  width: number,
  height: number,
  ink: [number, number, number] = [17, 24, 39],
  bg: [number, number, number] = [255, 255, 255]
): ImageData {
  const out = new ImageData(width, height);
  const d = out.data;
  for (let p = 0, i = 0; p < mask.length; p++, i += 4) {
    const c = mask[p] ? ink : bg;
    d[i] = c[0];
    d[i + 1] = c[1];
    d[i + 2] = c[2];
    d[i + 3] = 255;
  }
  return out;
}

/** Deterministic bright color per component index. */
function paletteColor(idx: number): [number, number, number] {
  const hue = (idx * 137.508) % 360; // golden-angle hue spread
  return hslToRgb(hue / 360, 0.65, 0.55);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [
    Math.round(hk(h + 1 / 3) * 255),
    Math.round(hk(h) * 255),
    Math.round(hk(h - 1 / 3) * 255),
  ];
}

/** Render every connected component filled with a distinct color (bbox fill). */
export function componentsToImageData(
  components: Component[],
  width: number,
  height: number
): ImageData {
  const out = new ImageData(width, height);
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255;
    d[i + 1] = 255;
    d[i + 2] = 255;
    d[i + 3] = 255;
  }
  components.forEach((c, idx) => {
    const [r, g, b] = paletteColor(idx);
    for (let y = c.y; y < c.y + c.h; y++) {
      for (let x = c.x; x < c.x + c.w; x++) {
        const i = (y * width + x) * 4;
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        d[i + 3] = 90; // translucent so overlaps read
      }
    }
  });
  return out;
}
