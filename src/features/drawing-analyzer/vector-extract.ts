/**
 * Clean-room vector extraction for PDF drawings.
 *
 * Operates directly on the pdf.js page operator list + text content — i.e. the
 * REAL vector geometry — instead of rasterizing to pixels. Imports nothing from
 * the existing raster pipeline (SimpleScanStripped.astro); this is the greenfield
 * core we want to grow and eventually swap in.
 *
 * Why: in a well-behaved CAD/Revit export, a repeated symbol is one reusable
 * Form XObject placed N times (group-by id → exact count + positions, ~free).
 * In a flattened print-to-PDF export, symbols are exploded into primitive path
 * segments — the repeats still exist (exact-duplicate geometry) but the per-symbol
 * grouping is gone, so they must be reconstructed. This module measures which
 * case a given drawing is, so we can route each sheet to the right strategy.
 */

// pdf.js is loaded as a global (/js/pdf.min.js). We read OPS / Util from there.
type PdfLib = any;
type PdfPage = any;
type PdfViewport = any;

function pdfLib(): PdfLib {
  const lib = (globalThis as any).pdfjsLib;
  if (!lib) throw new Error("pdfjsLib not loaded");
  return lib;
}

export type StructureVerdict = "structured" | "flattened" | "mixed" | "raster" | "empty";

export interface VectorStats {
  totalOps: number;
  pathCount: number;
  /** Distinct normalized path-segment geometries. */
  distinctPathShapes: number;
  /** Path instances belonging to a shape that repeats ≥ `repeatThreshold` times. */
  repeatedPathInstances: number;
  pctPathRepeated: number;
  /** Distinct reusable vector symbol blocks (Form XObjects). */
  formXObjects: number;
  /** Total Form XObject paint invocations (instances placed). */
  formXObjectPaints: number;
  imageXObjects: number;
  textItems: number;
  verdict: StructureVerdict;
  verdictDetail: string;
}

export interface TextLabel {
  str: string;
  /** Top-left in viewport pixel space. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FormInstance {
  id: string;
  count: number;
}

export interface VBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OutlinedTextOpts {
  /** Glyph height band in device px (after viewport scale). */
  minH?: number;
  maxH?: number;
  /** Drop path boxes wider than this (× maxH) — those are graphics, not glyphs. */
  glyphWFactor?: number;
  /** Merge two glyph boxes into a line if the horizontal gap < gapFactor × row height. */
  gapFactor?: number;
  /** A text run must contain ≥ minRun glyph boxes. */
  minRun?: number;
  /**
   * Font baseline: a path-shape must recur ≥ minRepeat times across the sheet to
   * be treated as a glyph (a real letterform repeats; one-off graphics don't).
   * Higher = stricter / strips less. 1 disables the filter.
   */
  minRepeat?: number;
  pad?: number;
}

/** A glyph-sized path box plus how many times its exact shape recurs on the sheet. */
export interface GlyphCandidate extends VBox {
  repeat: number;
}

export interface ClusterOpts {
  gapFactor?: number;
  minRun?: number;
  pad?: number;
}

const REPEAT_THRESHOLD = 5;

/**
 * Tally the operator list: op histogram, path-repeat ratio, XObject reuse.
 * `page.getOperatorList()` is cheap (parse only) compared to rasterizing.
 */
export async function analyzeVector(page: PdfPage): Promise<VectorStats> {
  const lib = pdfLib();
  const OPS = lib.OPS;
  const ol = await page.getOperatorList();
  const fn = ol.fnArray;
  const ar = ol.argsArray;

  let pathCount = 0;
  let formPaints = 0;
  let imagePaints = 0;
  const formIds = new Set<string>();
  const shapeGroups = new Map<string, number>();

  for (let i = 0; i < fn.length; i++) {
    const f = fn[i];
    if (f === OPS.constructPath) {
      pathCount++;
      const a = ar[i];
      const sub = a && Array.isArray(a[0]) ? a[0].join(",") : "";
      const co: number[] = (a && a[1]) || [];
      if (co.length) {
        const ox = co[0];
        const oy = co[1];
        const norm: number[] = [];
        for (let j = 0; j < co.length; j += 2) {
          // translation-invariant + quantized to 0.25 user units
          norm.push(Math.round((co[j] - ox) * 4) / 4);
          norm.push(Math.round((co[j + 1] - oy) * 4) / 4);
        }
        const key = sub + "|" + norm.join(",");
        shapeGroups.set(key, (shapeGroups.get(key) || 0) + 1);
      }
    } else if (f === OPS.paintFormXObject) {
      formPaints++;
      const id = a0(ar[i]);
      if (id) formIds.add(id);
    } else if (
      f === OPS.paintImageXObject ||
      f === OPS.paintImageXObjectRepeat ||
      f === OPS.paintInlineImageXObject
    ) {
      imagePaints++;
    }
  }

  let distinctShapes = 0;
  let repeatedInstances = 0;
  for (const count of shapeGroups.values()) {
    distinctShapes++;
    if (count >= REPEAT_THRESHOLD) repeatedInstances += count;
  }

  let textItems = 0;
  try {
    const tc = await page.getTextContent();
    textItems = tc.items.filter((it: any) => (it.str || "").trim().length).length;
  } catch {
    textItems = 0;
  }

  const pctPathRepeated = pathCount ? Math.round((repeatedInstances / pathCount) * 100) : 0;
  const { verdict, verdictDetail } = decideVerdict({
    pathCount,
    formXObjects: formIds.size,
    formXObjectPaints: formPaints,
    imageXObjects: imagePaints,
    textItems,
    pctPathRepeated,
  });

  return {
    totalOps: fn.length,
    pathCount,
    distinctPathShapes: distinctShapes,
    repeatedPathInstances: repeatedInstances,
    pctPathRepeated,
    formXObjects: formIds.size,
    formXObjectPaints: formPaints,
    imageXObjects: imagePaints,
    textItems,
    verdict,
    verdictDetail,
  };
}

function a0(args: any): string | null {
  if (!args) return null;
  const v = Array.isArray(args) ? args[0] : args;
  return typeof v === "string" ? v : v != null ? String(v) : null;
}

function decideVerdict(s: {
  pathCount: number;
  formXObjects: number;
  formXObjectPaints: number;
  imageXObjects: number;
  textItems: number;
  pctPathRepeated: number;
}): { verdict: StructureVerdict; verdictDetail: string } {
  if (s.pathCount === 0 && s.formXObjects === 0) {
    if (s.imageXObjects > 0) {
      return {
        verdict: "raster",
        verdictDetail:
          "No vector geometry — this page is a scanned/raster image. Vector extraction can't help; use the pixel pipeline + OCR.",
      };
    }
    return { verdict: "empty", verdictDetail: "No drawable content found on this page." };
  }

  const reusedBlocks = s.formXObjects > 0 && s.formXObjectPaints >= s.formXObjects * 2;
  if (reusedBlocks && s.pathCount < s.formXObjectPaints * 50) {
    return {
      verdict: "structured",
      verdictDetail: `Symbols are reusable blocks: ${s.formXObjects} distinct Form XObjects placed ${s.formXObjectPaints} times. Repeated elements can be counted + located almost for free (group by block id, read each transform).`,
    };
  }

  if (s.pathCount > 2000 && s.formXObjects <= 2 && s.pctPathRepeated >= 30) {
    return {
      verdict: "flattened",
      verdictDetail: `Flattened export: ${s.pathCount.toLocaleString()} raw paths, almost no reusable blocks, but ${s.pctPathRepeated}% of paths are exact-duplicate geometry. Symbols exist as repeated segment clusters and must be reconstructed (hash + spatial cluster).`,
    };
  }

  return {
    verdict: "mixed",
    verdictDetail: `Mixed: ${s.formXObjects} reusable blocks (${s.formXObjectPaints} placements) alongside ${s.pathCount.toLocaleString()} raw paths. Some symbols are blocks; others are flattened.`,
  };
}

/**
 * Reusable symbol blocks and how many times each is placed. Only meaningful for
 * "structured"/"mixed" drawings; on flattened sheets this is near-empty.
 */
export async function getFormInstances(page: PdfPage): Promise<FormInstance[]> {
  const lib = pdfLib();
  const OPS = lib.OPS;
  const ol = await page.getOperatorList();
  const counts = new Map<string, number>();
  for (let i = 0; i < ol.fnArray.length; i++) {
    if (ol.fnArray[i] === OPS.paintFormXObject) {
      const id = a0(ol.argsArray[i]);
      if (id) counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Detect OUTLINED text (letters exploded into vector path strokes, the way ~8 of
 * 9 of these flattened sheets store text). Walks the operator list while tracking
 * the CTM (save/restore/transform), collects glyph-sized path bounding boxes in
 * the viewport's device pixel space, then groups them into text rows. Exact and
 * resolution-independent — no rasterizing.
 */
export async function getOutlinedTextRegions(
  page: PdfPage,
  viewport: PdfViewport,
  opts: OutlinedTextOpts = {}
): Promise<VBox[]> {
  const minRepeat = opts.minRepeat ?? 1;
  const candidates = await getGlyphCandidates(page, viewport, opts);
  const glyphs = candidates.filter((g) => g.repeat >= minRepeat);
  return clusterGlyphRows(glyphs, opts);
}

/**
 * Font baseline: collect glyph-sized path boxes (in viewport device px) and tag
 * each with how many times its exact shape recurs on the sheet. Repeated shapes
 * are the font's letterforms; one-off shapes are graphics. Walks the operator
 * list once while tracking the CTM (save/restore/transform).
 */
export async function getGlyphCandidates(
  page: PdfPage,
  viewport: PdfViewport,
  opts: OutlinedTextOpts = {},
  opList?: { fnArray: number[]; argsArray: any[] }
): Promise<GlyphCandidate[]> {
  const lib = pdfLib();
  const OPS = lib.OPS;
  const Util = lib.Util;
  const minH = opts.minH ?? 3;
  const maxH = opts.maxH ?? 26;
  const glyphWFactor = opts.glyphWFactor ?? 3;
  const maxGlyphW = maxH * glyphWFactor;

  const ol = opList ?? (await page.getOperatorList());
  const fn = ol.fnArray;
  const ar = ol.argsArray;

  // Base CTM = viewport transform, so applyTransform yields device px directly.
  let ctm: number[] = viewport.transform.slice();
  const stack: number[][] = [];
  const boxes: VBox[] = [];
  const keys: string[] = [];
  const freq = new Map<string, number>();

  for (let i = 0; i < fn.length; i++) {
    const f = fn[i];
    if (f === OPS.save) {
      stack.push(ctm.slice());
    } else if (f === OPS.restore) {
      if (stack.length) ctm = stack.pop() as number[];
    } else if (f === OPS.transform) {
      const t = ar[i];
      if (t && t.length >= 6) ctm = Util.transform(ctm, t);
    } else if (f === OPS.constructPath) {
      const a = ar[i];
      const co: number[] = (a && a[1]) || [];
      if (co.length < 2) continue;
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (let j = 0; j + 1 < co.length; j += 2) {
        const p = Util.applyTransform([co[j], co[j + 1]], ctm);
        if (p[0] < x0) x0 = p[0];
        if (p[0] > x1) x1 = p[0];
        if (p[1] < y0) y0 = p[1];
        if (p[1] > y1) y1 = p[1];
      }
      const w = x1 - x0;
      const h = y1 - y0;
      if (h >= minH && h <= maxH && w >= 0 && w <= maxGlyphW) {
        // translation-invariant shape key (same letterform → same key)
        const sub = a && Array.isArray(a[0]) ? a[0].join(",") : "";
        const ox = co[0];
        const oy = co[1];
        let key = sub + "|";
        for (let j = 0; j + 1 < co.length; j += 2) {
          key += `${Math.round((co[j] - ox) * 4) / 4},${Math.round((co[j + 1] - oy) * 4) / 4};`;
        }
        boxes.push({ x: x0, y: y0, w: Math.max(1, w), h: Math.max(1, h) });
        keys.push(key);
        freq.set(key, (freq.get(key) || 0) + 1);
      }
    }
  }

  const out: GlyphCandidate[] = new Array(boxes.length);
  for (let i = 0; i < boxes.length; i++) {
    out[i] = { ...boxes[i], repeat: freq.get(keys[i]) || 1 };
  }
  return out;
}

/** Group glyph boxes into horizontal text-line boxes (RLSA on vector boxes). */
export function clusterGlyphRows(glyphs: VBox[], opts: ClusterOpts = {}): VBox[] {
  const gapFactor = opts.gapFactor ?? 1.4;
  const minRun = opts.minRun ?? 3;
  const pad = opts.pad ?? 1;
  if (!glyphs.length) return [];
  const bin = Math.max(2, Math.round((glyphs.reduce((s, g) => s + g.h, 0) / glyphs.length) * 0.7));
  const rows = new Map<number, VBox[]>();
  for (const g of glyphs) {
    const k = Math.round((g.y + g.h / 2) / bin);
    let arr = rows.get(k);
    if (!arr) {
      arr = [];
      rows.set(k, arr);
    }
    arr.push(g);
  }
  const out: VBox[] = [];
  for (const arr of rows.values()) {
    arr.sort((a, b) => a.x - b.x);
    let run: VBox[] = [];
    const flush = () => {
      if (run.length >= minRun) {
        let x0 = Infinity,
          y0 = Infinity,
          x1 = -Infinity,
          y1 = -Infinity;
        for (const c of run) {
          x0 = Math.min(x0, c.x);
          y0 = Math.min(y0, c.y);
          x1 = Math.max(x1, c.x + c.w);
          y1 = Math.max(y1, c.y + c.h);
        }
        out.push({ x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 });
      }
      run = [];
    };
    for (const g of arr) {
      if (run.length === 0) {
        run.push(g);
        continue;
      }
      const prev = run[run.length - 1];
      const gap = g.x - (prev.x + prev.w);
      const refH = Math.max(prev.h, g.h);
      if (gap <= gapFactor * refH) run.push(g);
      else {
        flush();
        run.push(g);
      }
    }
    flush();
  }
  return out;
}

/**
 * Render the page to ImageData with all REAL text removed — pure vector, the way
 * Acrobat hides a text layer: we take the page's operator list (the actual draw
 * program), drop the text-showing operators (`showText`/`showSpacedText`), and
 * rasterize the remainder via SVGGraphics. The glyphs are NEVER painted, so there
 * is nothing to erase — no halos, no leftover ink, no missed text, and the
 * sprinkler heads / line-work (path ops) are untouched. Outlined text (letters
 * stored as path strokes, not text ops) is geometry and is intentionally kept.
 */
export async function renderPageWithoutText(
  page: PdfPage,
  viewport: PdfViewport,
  opList?: { fnArray: number[]; argsArray: any[] }
): Promise<ImageData> {
  const lib = pdfLib();
  const OPS = lib.OPS;
  const ol = opList ?? (await page.getOperatorList());
  const drop = new Set<number>([OPS.showText, OPS.showSpacedText]);
  const fnArray: number[] = [];
  const argsArray: any[] = [];
  for (let i = 0; i < ol.fnArray.length; i++) {
    if (drop.has(ol.fnArray[i])) continue;
    fnArray.push(ol.fnArray[i]);
    argsArray.push(ol.argsArray[i]);
  }
  return rasterizeOperatorList(page, { fnArray, argsArray, lastChunk: true }, viewport);
}

/** Full-page operator list (text included) for reuse across SVG + raster paths. */
async function fullPageOpList(
  page: PdfPage,
  opList?: { fnArray: number[]; argsArray: any[] }
): Promise<{ fnArray: number[]; argsArray: any[]; lastChunk: boolean }> {
  const ol = opList ?? (await page.getOperatorList());
  return { fnArray: ol.fnArray, argsArray: ol.argsArray, lastChunk: true };
}

/** Native SVG for the full page (text included). Use for the Original viewer so
 *  pan/zoom stays resolution-independent — never rasterize the reference sheet. */
export async function getPageSvgElement(
  page: PdfPage,
  viewport: PdfViewport,
  opList?: { fnArray: number[]; argsArray: any[] }
): Promise<SVGElement> {
  const lib = pdfLib();
  const ol = await fullPageOpList(page, opList);
  const gfx = new lib.SVGGraphics(page.commonObjs, page.objs);
  return gfx.getSVG(ol, viewport);
}

/** Render the FULL page (text included) to ImageData via SVGGraphics. Same code
 *  path as the text-free render, so a page is never rendered with BOTH
 *  `page.render()` and SVGGraphics — mixing those wedges the shared pdf.js
 *  worker in this build. Pass a shared operator list to avoid re-parsing. */
export async function renderPageVector(
  page: PdfPage,
  viewport: PdfViewport,
  opList?: { fnArray: number[]; argsArray: any[] }
): Promise<ImageData> {
  const ol = await fullPageOpList(page, opList);
  return rasterizeOperatorList(page, ol, viewport);
}

/** Rasterize a (possibly filtered) operator list to ImageData via SVGGraphics —
 *  resolution-independent vector rendering, then one draw to a canvas. */
async function rasterizeOperatorList(
  page: PdfPage,
  opList: { fnArray: number[]; argsArray: any[]; lastChunk: boolean },
  viewport: PdfViewport
): Promise<ImageData> {
  const lib = pdfLib();
  const gfx = new lib.SVGGraphics(page.commonObjs, page.objs);
  const svg: SVGElement = await gfx.getSVG(opList, viewport);
  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = await loadSvgImage(url);
    const w = Math.max(1, Math.round(viewport.width));
    const h = Math.max(1, Math.round(viewport.height));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("could not get 2d context");
    ctx.fillStyle = "#fff"; // SVG has no page background
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadSvgImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("SVG image load failed"));
    im.src = src;
  });
}

/** A repeated vector symbol (e.g. a sprinkler head): a path geometry that recurs
 *  across the sheet. `centers` are the instance positions in viewport device px. */
export interface SymbolGroup {
  /** Translation-invariant geometry signature (same motif → same key). */
  key: string;
  count: number;
  /** Median device width/height of the motif. */
  w: number;
  h: number;
  /** Point count of the path (a circle/cross symbol >> a 2-point tick). */
  npts: number;
  /** RMS distance of instances from their centroid — large = scattered across
   *  the plan (a real symbol); small = packed in one spot (hatch/legend fill). */
  spread: number;
  centers: { x: number; y: number }[];
}

export interface SymbolOpts {
  /** Glyph/symbol footprint band in device px (after viewport scale). */
  minH?: number;
  maxH?: number;
  /** A motif must recur ≥ this many times to be a candidate. */
  minRepeat?: number;
  /** Restrict detection to these viable-region boxes (viewport device px). */
  clip?: ClipBox[];
}

/**
 * Find repeated, symbol-sized vector motifs — the resolution-independent way to
 * count sprinkler heads on a FLATTENED sheet (where each head is the same little
 * cluster of path segments stamped at every location). Walks the operator list
 * once, tracking the CTM, bins each compact path by a translation-invariant
 * geometry key, and reports the groups that repeat. No pixels, no template match.
 */
export async function detectRepeatedSymbols(
  page: PdfPage,
  viewport: PdfViewport,
  opts: SymbolOpts = {},
  opList?: { fnArray: number[]; argsArray: any[] }
): Promise<SymbolGroup[]> {
  const lib = pdfLib();
  const OPS = lib.OPS;
  const Util = lib.Util;
  const minH = opts.minH ?? 3;
  const maxH = opts.maxH ?? 44;
  const minRepeat = opts.minRepeat ?? 3;

  const ol = opList ?? (await page.getOperatorList());
  const fn = ol.fnArray;
  const ar = ol.argsArray;
  let ctm: number[] = viewport.transform.slice();
  const stack: number[][] = [];
  const groups = new Map<
    string,
    { cs: { x: number; y: number }[]; ws: number[]; hs: number[]; npts: number }
  >();

  for (let i = 0; i < fn.length; i++) {
    const f = fn[i];
    if (f === OPS.save) {
      stack.push(ctm.slice());
    } else if (f === OPS.restore) {
      if (stack.length) ctm = stack.pop() as number[];
    } else if (f === OPS.transform) {
      const t = ar[i];
      if (t && t.length >= 6) ctm = Util.transform(ctm, t);
    } else if (f === OPS.constructPath) {
      const a = ar[i];
      const co: number[] = (a && a[1]) || [];
      if (co.length < 2) continue;
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (let j = 0; j + 1 < co.length; j += 2) {
        const p = Util.applyTransform([co[j], co[j + 1]], ctm);
        if (p[0] < x0) x0 = p[0];
        if (p[0] > x1) x1 = p[0];
        if (p[1] < y0) y0 = p[1];
        if (p[1] > y1) y1 = p[1];
      }
      const w = x1 - x0;
      const h = y1 - y0;
      // Region clip: ignore symbols whose center is outside the kept viable area.
      if (!inClip((x0 + x1) / 2, (y0 + y1) / 2, opts.clip)) continue;
      // Symbol footprint gate: head-sized box, not a long wall or a tiny dot.
      if (h < minH || h > maxH || w < minH * 0.5 || w > maxH * 1.5) continue;
      const sub = a && Array.isArray(a[0]) ? a[0].join(",") : "";
      const ox = co[0];
      const oy = co[1];
      let key = sub + "|";
      for (let j = 0; j + 1 < co.length; j += 2) {
        key += `${Math.round((co[j] - ox) * 4) / 4},${Math.round((co[j + 1] - oy) * 4) / 4};`;
      }
      let g = groups.get(key);
      if (!g) {
        g = { cs: [], ws: [], hs: [], npts: co.length / 2 };
        groups.set(key, g);
      }
      g.cs.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2 });
      g.ws.push(w);
      g.hs.push(h);
    }
  }

  const med = (a: number[]) => {
    const s = a.slice().sort((p, q) => p - q);
    return s[Math.floor(s.length / 2)];
  };
  const out: SymbolGroup[] = [];
  for (const [key, g] of groups) {
    if (g.cs.length < minRepeat) continue;
    const mx = g.cs.reduce((s, c) => s + c.x, 0) / g.cs.length;
    const my = g.cs.reduce((s, c) => s + c.y, 0) / g.cs.length;
    let v = 0;
    for (const c of g.cs) v += (c.x - mx) ** 2 + (c.y - my) ** 2;
    out.push({
      key,
      count: g.cs.length,
      w: Math.round(med(g.ws)),
      h: Math.round(med(g.hs)),
      npts: g.npts,
      spread: Math.round(Math.sqrt(v / g.cs.length)),
      centers: g.cs,
    });
  }
  out.sort((a, b) => b.count - a.count);
  return out;
}

/** One reconstructed "layer" in the decomposition: a class of paths that share a
 *  property (a repeated symbol signature, the wall runs, a native CAD color…). */
export interface DecompLayer {
  id: string;
  label: string;
  /** Overlay color used to draw this layer. */
  color: string;
  count: number;
  kind: "symbol" | "wall" | "detail";
  /** Median device size of the motif (symbols) — helps the user identify heads. */
  w?: number;
  h?: number;
  npts?: number;
  /** Native CAD source color of the paths, "#rrggbb" (symbols/walls). */
  srcColor?: string;
  /** Instance centers in viewport device px (symbols only) — drives counting. */
  centers?: { x: number; y: number }[];
}

export interface DecompOpts {
  /** A shape must recur ≥ this many times to count as a group (else it's a
   *  unique singleton, drawn grey). */
  minRepeat?: number;
  /** Restrict analysis to these viable-region boxes (viewport device px). */
  clip?: ClipBox[];
}

export interface DecompResult {
  image: ImageData;
  /** Top groups by instance count — info/legend only. */
  layers: DecompLayer[];
  /** Number of distinct repeated-shape groups found. */
  groups: number;
  /** Total path instances that belong to a group (colored). */
  coloredInstances: number;
  /** Unique, non-repeating paths (drawn grey). */
  singles: number;
}

type PathRec = {
  ops: number[];
  co: number[];
  ctm: number[];
  w: number;
  h: number;
  cx: number;
  cy: number;
  npts: number;
  sig: string;
  src: string;
  /** Path contains at least one curve op (door swings, circle heads). */
  hasCurve: boolean;
};

export interface CollectedPaths {
  recs: PathRec[];
  /** signature → number of instances. */
  sigCount: Map<string, number>;
  /** signature → representative geometry. */
  sigMeta: Map<string, { w: number; h: number; npts: number; src: string }>;
  W: number;
  H: number;
}

/** A viable-region rectangle in viewport DEVICE px. When supplied as a clip, any
 *  path/symbol whose center falls outside every box is ignored — so analysis only
 *  ever runs inside the regions the user kept. */
export interface ClipBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** True when (x,y) is inside any clip box (or no clip given → everything passes). */
function inClip(x: number, y: number, clip?: ClipBox[]): boolean {
  if (!clip || !clip.length) return true;
  for (const b of clip) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true;
  }
  return false;
}

/** Single walk of the operator list: transforms every path to device space and
 *  tags it (bbox, center, color, point count, curve flag, translation-invariant
 *  signature). Shared by the group + semantic passes so we walk only once. */
export async function collectPaths(
  page: PdfPage,
  viewport: PdfViewport,
  opList?: { fnArray: number[]; argsArray: any[] },
  clip?: ClipBox[]
): Promise<CollectedPaths> {
  const lib = pdfLib();
  const OPS = lib.OPS;
  const Util = lib.Util;
  const W = Math.max(1, Math.round(viewport.width));
  const H = Math.max(1, Math.round(viewport.height));
  const ol = opList ?? (await page.getOperatorList());
  const fn = ol.fnArray;
  const ar = ol.argsArray;
  const rgb = (a: number[]) =>
    "#" +
    a
      .slice(0, 3)
      .map((x) =>
        Math.round((x || 0) * (x <= 1 ? 255 : 1))
          .toString(16)
          .padStart(2, "0")
      )
      .join("");
  let ctm: number[] = viewport.transform.slice();
  let fill = "#000000";
  let stroke = "#000000";
  const stack: { ctm: number[]; fill: string; stroke: string }[] = [];
  const recs: PathRec[] = [];
  const sigCount = new Map<string, number>();
  const sigMeta = new Map<string, { w: number; h: number; npts: number; src: string }>();
  const curveOps = new Set<number>([OPS.curveTo, OPS.curveTo2, OPS.curveTo3]);
  for (let i = 0; i < fn.length; i++) {
    const f = fn[i];
    const a = ar[i];
    if (f === OPS.save) {
      stack.push({ ctm: ctm.slice(), fill, stroke });
    } else if (f === OPS.restore) {
      const s = stack.pop();
      if (s) {
        ctm = s.ctm;
        fill = s.fill;
        stroke = s.stroke;
      }
    } else if (f === OPS.transform) {
      if (a && a.length >= 6) ctm = Util.transform(ctm, a);
    } else if (f === OPS.setFillRGBColor) {
      fill = rgb(a as number[]);
    } else if (f === OPS.setStrokeRGBColor) {
      stroke = rgb(a as number[]);
    } else if (f === OPS.constructPath) {
      const co: number[] = (a && a[1]) || [];
      const ops: number[] = (a && a[0]) || [];
      if (co.length < 2) continue;
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (let j = 0; j + 1 < co.length; j += 2) {
        const p = Util.applyTransform([co[j], co[j + 1]], ctm);
        if (p[0] < x0) x0 = p[0];
        if (p[0] > x1) x1 = p[0];
        if (p[1] < y0) y0 = p[1];
        if (p[1] > y1) y1 = p[1];
      }
      const w = x1 - x0;
      const h = y1 - y0;
      // Region clip: skip anything whose center is outside the kept viable area.
      if (!inClip((x0 + x1) / 2, (y0 + y1) / 2, clip)) continue;
      const npts = co.length / 2;
      const src = stroke !== "#000000" ? stroke : fill;
      let hasCurve = false;
      for (const op of ops)
        if (curveOps.has(op)) {
          hasCurve = true;
          break;
        }
      const sub = Array.isArray(ops) ? ops.join(",") : "";
      const ox = co[0];
      const oy = co[1];
      let sig = src + "|" + sub + "|";
      for (let j = 0; j + 1 < co.length; j += 2) {
        sig += `${Math.round((co[j] - ox) * 4) / 4},${Math.round((co[j + 1] - oy) * 4) / 4};`;
      }
      sigCount.set(sig, (sigCount.get(sig) || 0) + 1);
      if (!sigMeta.has(sig)) sigMeta.set(sig, { w, h, npts, src });
      recs.push({
        ops,
        co,
        ctm: ctm.slice(),
        w,
        h,
        cx: (x0 + x1) / 2,
        cy: (y0 + y1) / 2,
        npts,
        sig,
        src,
        hasCurve,
      });
    }
  }
  return { recs, sigCount, sigMeta, W, H };
}

/** Trace one path record into a 2D context (device space), interpreting the
 *  pdf.js sub-path ops. Caller sets strokeStyle/lineWidth and calls stroke(). */
export function tracePathInto(ctx: CanvasRenderingContext2D, rec: PathRec, OPS: any, Util: any) {
  const { ops, co, ctm: m } = rec;
  let k = 0;
  let curX = 0;
  let curY = 0;
  const tp = (x: number, y: number) => Util.applyTransform([x, y], m);
  ctx.beginPath();
  for (const op of ops) {
    if (op === OPS.moveTo || op === OPS.lineTo) {
      const p = tp(co[k], co[k + 1]);
      k += 2;
      curX = p[0];
      curY = p[1];
      if (op === OPS.moveTo) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    } else if (op === OPS.curveTo) {
      const c1 = tp(co[k], co[k + 1]);
      const c2 = tp(co[k + 2], co[k + 3]);
      const e = tp(co[k + 4], co[k + 5]);
      k += 6;
      ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], e[0], e[1]);
      curX = e[0];
      curY = e[1];
    } else if (op === OPS.curveTo2) {
      const c2 = tp(co[k], co[k + 1]);
      const e = tp(co[k + 2], co[k + 3]);
      k += 4;
      ctx.bezierCurveTo(curX, curY, c2[0], c2[1], e[0], e[1]);
      curX = e[0];
      curY = e[1];
    } else if (op === OPS.curveTo3) {
      const c1 = tp(co[k], co[k + 1]);
      const e = tp(co[k + 2], co[k + 3]);
      k += 4;
      ctx.bezierCurveTo(c1[0], c1[1], e[0], e[1], e[0], e[1]);
      curX = e[0];
      curY = e[1];
    } else if (op === OPS.rectangle) {
      const x = co[k];
      const y = co[k + 1];
      const rw = co[k + 2];
      const rh = co[k + 3];
      k += 4;
      const p0 = tp(x, y);
      const p1 = tp(x + rw, y);
      const p2 = tp(x + rw, y + rh);
      const p3 = tp(x, y + rh);
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(p3[0], p3[1]);
      ctx.closePath();
      curX = p0[0];
      curY = p0[1];
    } else if (op === OPS.closePath) {
      ctx.closePath();
    }
  }
  ctx.stroke();
}

/**
 * GROUP DECOMPOSITION (basic) — walk the vector program once, give every path a
 * translation-invariant shape signature (native color + the exact sequence of
 * points relative to its own start). Any signature that recurs is a "group", and
 * each group is painted its own hashed color; unique one-off paths stay grey.
 *
 * No labels, no guessing what anything is — just "everything that repeats gets
 * its own color", so the flattened drawing visually separates into its building
 * blocks (head motif, door swing, fixture, wall tick, dimension mark, …).
 */
export async function renderLayerDecomposition(
  page: PdfPage,
  viewport: PdfViewport,
  opts: DecompOpts = {},
  opList?: { fnArray: number[]; argsArray: any[] }
): Promise<DecompResult> {
  const lib = pdfLib();
  const OPS = lib.OPS;
  const Util = lib.Util;
  const minRepeat = opts.minRepeat ?? 3;
  const { recs, sigCount, sigMeta, W, H } = await collectPaths(page, viewport, opList, opts.clip);

  // ── A group = any signature that repeats; hash it to a distinct color ─────
  const SINGLE_COLOR = "#cbd5e1";
  const hashColor = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    const sat = 62 + ((h >>> 9) % 30);
    const light = 36 + ((h >>> 17) % 18);
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  };
  const sigColor = new Map<string, string>();
  for (const [sig, c] of sigCount) if (c >= minRepeat) sigColor.set(sig, hashColor(sig));

  // ── Draw: singletons (grey) first, then every group in its color ──────────
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("could not get 2d context");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const singleRecs: PathRec[] = [];
  const groupRecs: PathRec[] = [];
  for (const rec of recs) {
    if (rec.sig && sigColor.has(rec.sig)) groupRecs.push(rec);
    else singleRecs.push(rec);
  }
  ctx.lineWidth = 1;
  ctx.strokeStyle = SINGLE_COLOR;
  for (const r of singleRecs) tracePathInto(ctx, r, OPS, Util);
  ctx.lineWidth = 1.4;
  for (const r of groupRecs) {
    ctx.strokeStyle = sigColor.get(r.sig as string) as string;
    tracePathInto(ctx, r, OPS, Util);
  }

  // Legend: the biggest groups (info only).
  const layers: DecompLayer[] = [...sigCount.entries()]
    .filter(([, c]) => c >= minRepeat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([sig, count], idx) => {
      const m = sigMeta.get(sig)!;
      return {
        id: "g" + (idx + 1),
        label: `Group ${idx + 1}`,
        color: sigColor.get(sig) as string,
        count,
        kind: "symbol" as const,
        w: Math.round(m.w),
        h: Math.round(m.h),
        npts: m.npts,
        srcColor: m.src,
      };
    });

  return {
    image: ctx.getImageData(0, 0, W, H),
    layers,
    groups: sigColor.size,
    coloredInstances: groupRecs.length,
    singles: singleRecs.length,
  };
}

export interface SemanticEntry {
  label: string;
  color: string;
  count: number;
}
export interface SemanticResult {
  image: ImageData;
  legend: SemanticEntry[];
}

/** Fixed semantic palette — the "perfect world" target classes. */
const SEM = {
  text: "#111827",
  extWall: "#dc2626",
  intWall: "#2563eb",
  mainPipe: "#16a34a",
  branchPipe: "#84cc16",
  headA: "#db2777",
  headB: "#f59e0b",
  headOther: "#a855f7",
  door: "#0891b2",
  stairs: "#7c3aed",
  other: "#d1d5db",
} as const;

/**
 * SEMANTIC LAYERS — best-effort reconstruction of the "perfect world" view:
 * text, exterior/interior wall, main/branch pipe, head type A/B, doors.
 *
 * Each path is classified from measurable vector signals (footprint vs page,
 * aspect ratio, native CAD spot color, curve content, repetition, proximity to
 * the drawing's outer hull). This is heuristic: heads/doors/pipes are reliable
 * from geometry+color; exterior-vs-interior and main-vs-branch are first-cut
 * approximations (no full connectivity graph yet).
 */
export async function renderSemanticLayers(
  page: PdfPage,
  viewport: PdfViewport,
  labels: TextLabel[] = [],
  symbols: SymbolGroup[] = [],
  opts: { minRepeat?: number; clip?: ClipBox[] } = {},
  opList?: { fnArray: number[]; argsArray: any[] }
): Promise<SemanticResult> {
  const lib = pdfLib();
  const OPS = lib.OPS;
  const Util = lib.Util;
  const { recs, W, H } = await collectPaths(page, viewport, opList, opts.clip);
  const D = Math.hypot(W, H);

  const isSpot = (c: string) => {
    const m = /^#([0-9a-f]{6})$/i.exec(c);
    if (!m) return false;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255,
      g = (n >> 8) & 255,
      b = n & 255;
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b);
    return mx - mn > 40 && mx > 40; // chromatic, not black/grey/white
  };

  // Content hull from the structural (long) paths so text/noise don't skew it.
  let cx0 = Infinity,
    cy0 = Infinity,
    cx1 = -Infinity,
    cy1 = -Infinity;
  for (const r of recs) {
    const maxd = Math.max(r.w, r.h);
    if (maxd < D * 0.04) continue;
    cx0 = Math.min(cx0, r.cx - r.w / 2);
    cy0 = Math.min(cy0, r.cy - r.h / 2);
    cx1 = Math.max(cx1, r.cx + r.w / 2);
    cy1 = Math.max(cy1, r.cy + r.h / 2);
  }
  if (!isFinite(cx0)) {
    cx0 = 0;
    cy0 = 0;
    cx1 = W;
    cy1 = H;
  }
  const edgeMargin = D * 0.04;

  // Heads come from the CLUSTERED symbol groups (detectRepeatedSymbols), NOT raw
  // paths — a flattened sheet fragments every head into many tiny repeated
  // segments, so per-path counting explodes into noise. Rank groups by instance
  // count: the most common motif = Head type A, next = B, the rest = head (other).
  const headGroups = [...symbols].filter((g) => g.count >= 2).sort((a, b) => b.count - a.count);

  type Cls = keyof typeof SEM;
  const classify = (r: PathRec): Cls => {
    const maxd = Math.max(r.w, r.h);
    const mind = Math.min(r.w, r.h);
    const aspect = mind / Math.max(maxd, 1);
    const spot = isSpot(r.src);

    // Long thin run → wall or pipe
    if (maxd >= D * 0.05 && aspect < 0.2) {
      if (spot) return maxd >= D * 0.18 ? "mainPipe" : "branchPipe";
      const box0x = r.cx - r.w / 2,
        box1x = r.cx + r.w / 2;
      const box0y = r.cy - r.h / 2,
        box1y = r.cy + r.h / 2;
      const nearEdge =
        box0x <= cx0 + edgeMargin ||
        box1x >= cx1 - edgeMargin ||
        box0y <= cy0 + edgeMargin ||
        box1y >= cy1 - edgeMargin;
      return nearEdge ? "extWall" : "intWall";
    }
    // Door swing: curvy, mid-size, roughly square
    if (r.hasCurve && maxd >= D * 0.006 && maxd <= D * 0.05 && aspect >= 0.45) {
      return "door";
    }
    return "other";
  };

  const buckets = new Map<Cls, PathRec[]>();
  for (const r of recs) {
    const c = classify(r);
    (buckets.get(c) ?? buckets.set(c, []).get(c)!).push(r);
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("could not get 2d context");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Draw order: grey other first, then structure (walls/pipes/doors).
  const order: Cls[] = ["other", "intWall", "extWall", "mainPipe", "branchPipe", "door"];
  const widthFor: Record<string, number> = {
    other: 0.8,
    extWall: 2.2,
    intWall: 1.6,
    mainPipe: 2.4,
    branchPipe: 1.6,
    door: 1.6,
  };
  for (const c of order) {
    const list = buckets.get(c);
    if (!list || !list.length) continue;
    ctx.strokeStyle = SEM[c];
    ctx.lineWidth = widthFor[c] ?? 1.2;
    for (const r of list) tracePathInto(ctx, r, OPS, Util);
  }

  // Heads on top: a filled ring at every instance center of each head group,
  // colored by type (A = most common motif, B = next, rest = other).
  let headACount = 0;
  let headBCount = 0;
  let headOtherCount = 0;
  headGroups.forEach((g, gi) => {
    const color = gi === 0 ? SEM.headA : gi === 1 ? SEM.headB : SEM.headOther;
    if (gi === 0) headACount += g.centers.length;
    else if (gi === 1) headBCount += g.centers.length;
    else headOtherCount += g.centers.length;
    const rad = Math.max(2.5, Math.min(9, Math.max(g.w, g.h) / 2));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    for (const c of g.centers) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, rad, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // Text overlay from exact label boxes.
  ctx.fillStyle = "rgba(17,24,39,0.16)";
  ctx.strokeStyle = SEM.text;
  ctx.lineWidth = 0.6;
  for (const l of labels) {
    ctx.fillRect(l.x, l.y, l.w, l.h);
    ctx.strokeRect(l.x, l.y, l.w, l.h);
  }

  const legend: SemanticEntry[] = [
    { label: "Text", color: SEM.text, count: labels.length },
    { label: "Exterior wall", color: SEM.extWall, count: buckets.get("extWall")?.length ?? 0 },
    { label: "Interior wall", color: SEM.intWall, count: buckets.get("intWall")?.length ?? 0 },
    { label: "Main pipe", color: SEM.mainPipe, count: buckets.get("mainPipe")?.length ?? 0 },
    { label: "Branch pipe", color: SEM.branchPipe, count: buckets.get("branchPipe")?.length ?? 0 },
    { label: "Head type A", color: SEM.headA, count: headACount },
    { label: "Head type B", color: SEM.headB, count: headBCount },
    { label: "Head (other)", color: SEM.headOther, count: headOtherCount },
    { label: "Door", color: SEM.door, count: buckets.get("door")?.length ?? 0 },
    { label: "Other", color: SEM.other, count: buckets.get("other")?.length ?? 0 },
  ].filter((e) => e.count > 0);

  return { image: ctx.getImageData(0, 0, W, H), legend };
}

/**
 * Text labels with positions mapped into the given viewport's pixel space.
 * This is the cheapest exact signal in any structured PDF (device tags, schedule
 * rows, legend entries) — no OCR, no raster.
 */
export async function getTextLabels(page: PdfPage, viewport: PdfViewport): Promise<TextLabel[]> {
  const lib = pdfLib();
  const Util = lib.Util;
  const tc = await page.getTextContent();
  const out: TextLabel[] = [];
  for (const it of tc.items as any[]) {
    const str = (it.str || "").trim();
    if (!str) continue;
    // item.transform maps text space → PDF user space; compose with the
    // viewport transform (user space → device pixels, y already flipped).
    const m = Util.transform(viewport.transform, it.transform);
    // ROTATION-SAFE bbox: build the run's box from its CORNERS transformed
    // through m, not from "width horizontal / height vertical". On a page with
    // /Rotate 90|270 the matrix is off-diagonal, so the text advances along
    // device-Y, not device-X — a horizontal w×h box would point the wrong way
    // and miss the rendered ink entirely (worse the higher the render scale).
    const ox = m[4]; // baseline-left origin (device px)
    const oy = m[5];
    // Advance is a SCALAR length (device px) along the matrix's advance direction;
    // item.width is already a text-space advance, so use viewport.scale (not m[0]).
    const advLen = (typeof it.width === "number" ? it.width : str.length * 0.5) * viewport.scale;
    const al = Math.hypot(m[0], m[1]) || 1;
    const advX = (m[0] / al) * advLen; // advance vector (device px)
    const advY = (m[1] / al) * advLen;
    // Up vector = baseline → top-of-glyph (ascender). In text space +y is up, so
    // (m[2], m[3]) points from the baseline to the cap/ascender. The glyph cell
    // runs from the baseline UP by one font height, plus a small descender below.
    // IMPORTANT: only extend up (+up) and a little down (−0.25·up) — NOT a full
    // font-height in both directions, or the box doubles in height and swallows
    // a sprinkler head sitting just above/below the text line (Acrobat selects
    // only the glyph footprint, never the head).
    const upX = m[2];
    const upY = m[3];
    const descX = upX * 0.25; // small descender below the baseline
    const descY = upY * 0.25;
    const xs = [ox - descX, ox + advX - descX, ox + upX, ox + advX + upX];
    const ys = [oy - descY, oy + advY - descY, oy + upY, oy + advY + upY];
    const minx = Math.min(...xs);
    const maxx = Math.max(...xs);
    const miny = Math.min(...ys);
    const maxy = Math.max(...ys);
    out.push({
      str,
      x: minx,
      y: miny,
      w: Math.max(2, maxx - minx),
      h: Math.max(4, maxy - miny),
    });
  }
  return out;
}
