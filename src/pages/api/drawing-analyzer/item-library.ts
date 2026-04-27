import type { APIRoute } from "astro";
import { promises as fs } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import sharp from "sharp";
import type {
  ClutterRotationMode,
  DependencyMeta,
  ItemMeta,
} from "../../../lib/item-library-metadata";
import {
  fileToDisplayName,
  ITEM_LIBRARY_METADATA_MD,
  metadataToMarkdown,
  readItemLibraryMetadata,
} from "../../../lib/item-library-metadata";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const ITEM_LIBRARY_DIR = path.join(process.cwd(), "public", "drawing-analyzer-lab", "item-library");
const ITEM_LIBRARY_NORMALIZED_DIR = path.join(
  process.cwd(),
  "public",
  "drawing-analyzer-lab",
  "item-library-normalized"
);
const ITEM_LIBRARY_SVG_DIR = path.join(
  process.cwd(),
  "public",
  "drawing-analyzer-lab",
  "item-library-svg"
);
const NORMALIZED_CANVAS_SIZE = 512;
const NORMALIZATION_VERSION = 3;
const SVG_TRACE_VERSION = 2;

const require = createRequire(import.meta.url);
const potrace = require("potrace") as {
  trace: (
    filePath: string,
    options: Record<string, unknown>,
    callback: (error: Error | null, svg: string) => void
  ) => void;
};

async function listLibraryFiles(): Promise<string[]> {
  const entries = await fs.readdir(ITEM_LIBRARY_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

function buildEffectiveItems(files: string[], metaItems: ItemMeta[]): ItemMeta[] {
  const fileSet = new Set(files);
  const metaByFile = new Map(metaItems.map((item) => [item.fileName, item]));

  const orderedFromMeta = metaItems
    .filter((item) => fileSet.has(item.fileName))
    .sort((a, b) => a.priority - b.priority)
    .map((item) => item.fileName);
  const appendedNew = files.filter((file) => !orderedFromMeta.includes(file));
  const finalOrder = [...orderedFromMeta, ...appendedNew];

  return finalOrder.map((fileName, idx) => {
    const meta = metaByFile.get(fileName);
    const dependencies = (meta?.dependencies || []).filter(
      (dep) => fileSet.has(dep.fileName) && dep.fileName !== fileName
    );
    const suppressInScan = meta?.suppressInScan === true ? true : undefined;
    const clutterRotation: ClutterRotationMode | undefined =
      suppressInScan === true
        ? meta?.clutterRotation === "quarter_turns"
          ? "quarter_turns"
          : "fixed"
        : undefined;
    const clutterMultiScale =
      suppressInScan === true && meta?.clutterMultiScale === false ? false : undefined;
    const clutterStripPlan =
      suppressInScan === true && meta?.clutterStripPlan === true ? true : undefined;
    return {
      fileName,
      displayName: meta?.displayName || fileToDisplayName(fileName),
      price: meta?.price ?? 0,
      priority: idx + 1,
      dependencies,
      suppressInScan,
      clutterRotation,
      clutterMultiScale,
      clutterStripPlan,
    };
  });
}

function safeBaseName(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function fileExists(absPath: string): Promise<boolean> {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

async function getVersionedStem(fileName: string): Promise<{ srcPath: string; stem: string }> {
  const srcPath = path.join(ITEM_LIBRARY_DIR, fileName);
  const stat = await fs.stat(srcPath);
  const version = Math.max(1, Math.round(stat.mtimeMs));
  const stem = `${safeBaseName(fileName) || "item"}-v${NORMALIZATION_VERSION}-${version}`;
  return { srcPath, stem };
}

async function ensureNormalizedImage(fileName: string): Promise<string> {
  const { srcPath, stem } = await getVersionedStem(fileName);
  const normalizedName = `${stem}.png`;
  const outputPath = path.join(ITEM_LIBRARY_NORMALIZED_DIR, normalizedName);
  const outputUrl = `/drawing-analyzer-lab/item-library-normalized/${encodeURIComponent(normalizedName)}`;

  await fs.mkdir(ITEM_LIBRARY_NORMALIZED_DIR, { recursive: true });
  if (await fileExists(outputPath)) return outputUrl;

  // Convert near-white neutral background pixels to transparent before trim.
  // This removes screenshot/card backgrounds and keeps dark symbol ink.
  const raw = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = new Uint8ClampedArray(raw.data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    if (a === 0) continue;
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const spread = max - min;
    if (min >= 232 && spread <= 24) {
      pixels[i + 3] = 0;
    }
  }

  await sharp(Buffer.from(pixels), {
    raw: {
      width: raw.info.width,
      height: raw.info.height,
      channels: 4,
    },
  })
    .trim({ threshold: 8 })
    .resize({
      width: NORMALIZED_CANVAS_SIZE,
      height: NORMALIZED_CANVAS_SIZE,
      fit: "contain",
      position: "centre",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, palette: false, adaptiveFiltering: true, force: true })
    .toFile(outputPath);

  return outputUrl;
}

async function tracePngToSvg(filePath: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    potrace.trace(
      filePath,
      {
        threshold: 190,
        turdSize: 2,
        alphaMax: 1,
        optCurve: true,
        optTolerance: 0.2,
        color: "#000000",
      },
      (error, svg) => {
        if (error || !svg) {
          reject(error ?? new Error("SVG trace returned empty output."));
          return;
        }
        resolve(svg);
      }
    );
  });
}

async function ensureSvgImage(fileName: string): Promise<string> {
  const { stem } = await getVersionedStem(fileName);
  const normalizedName = `${stem}.png`;
  const normalizedPath = path.join(ITEM_LIBRARY_NORMALIZED_DIR, normalizedName);
  const svgName = `${stem}-svg${SVG_TRACE_VERSION}.svg`;
  const svgPath = path.join(ITEM_LIBRARY_SVG_DIR, svgName);
  const svgUrl = `/drawing-analyzer-lab/item-library-svg/${encodeURIComponent(svgName)}`;
  const traceInputPath = path.join(
    ITEM_LIBRARY_SVG_DIR,
    `${stem}-trace-input-v${SVG_TRACE_VERSION}.png`
  );

  await fs.mkdir(ITEM_LIBRARY_SVG_DIR, { recursive: true });
  if (await fileExists(svgPath)) return svgUrl;

  await ensureNormalizedImage(fileName);
  // Trim transparent padding before vector trace so generated SVG fits symbol ink bounds.
  try {
    await sharp(normalizedPath)
      .trim({ threshold: 1 })
      .png({ compressionLevel: 9, palette: false, adaptiveFiltering: true, force: true })
      .toFile(traceInputPath);
    const svgContent = await tracePngToSvg(traceInputPath);
    await fs.writeFile(svgPath, svgContent, "utf8");
  } finally {
    await fs.unlink(traceInputPath).catch(() => undefined);
  }
  return svgUrl;
}

async function toClientItem(item: ItemMeta) {
  const rawImageUrl = `/drawing-analyzer-lab/item-library/${encodeURIComponent(item.fileName)}`;
  let imageUrl = rawImageUrl;
  let normalizedPngUrl = rawImageUrl;
  let svgImageUrl = "";
  try {
    normalizedPngUrl = await ensureNormalizedImage(item.fileName);
    svgImageUrl = await ensureSvgImage(item.fileName);
    imageUrl = svgImageUrl || normalizedPngUrl;
  } catch (error) {
    console.warn("[drawing-analyzer/item-library] normalize fallback for", item.fileName, error);
  }
  return {
    ...item,
    suppressInScan: item.suppressInScan === true,
    rawImageUrl,
    normalizedPngUrl,
    svgImageUrl,
    imageUrl,
  };
}

export const GET: APIRoute = async () => {
  try {
    const [files, meta] = await Promise.all([listLibraryFiles(), readItemLibraryMetadata()]);
    const items = await Promise.all(buildEffectiveItems(files, meta).map(toClientItem));
    return new Response(
      JSON.stringify({
        success: true,
        items,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to read item library: ${error instanceof Error ? error.message : "unknown error"}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as { items?: ItemMeta[] };
    const incoming = Array.isArray(body?.items) ? body.items : [];

    const files = await listLibraryFiles();
    const fileSet = new Set(files);
    const normalized = incoming
      .map((item, idx) => {
        const fileName = String(item?.fileName || "").trim();
        if (!fileName || !fileSet.has(fileName)) return null;
        const depsRaw = Array.isArray(item?.dependencies) ? item.dependencies : [];
        const dependencies = depsRaw
          .map((dep) => {
            const depFile = String(dep?.fileName || "").trim();
            const qtyRaw = Number(dep?.qty ?? 1);
            if (!depFile || depFile === fileName || !fileSet.has(depFile)) return null;
            return {
              fileName: depFile,
              qty: Number.isFinite(qtyRaw) ? Math.max(1, Math.round(qtyRaw)) : 1,
            };
          })
          .filter(Boolean) as DependencyMeta[];
        const priceRaw = Number(item?.price ?? 0);
        const suppressInScan = (item as Record<string, unknown>)?.suppressInScan === true;
        const rotRaw = String(
          (item as Record<string, unknown>)?.clutterRotation || ""
        ).toLowerCase();
        const clutterRotation: ClutterRotationMode | undefined = suppressInScan
          ? rotRaw === "quarter_turns"
            ? "quarter_turns"
            : "fixed"
          : undefined;
        const cms = (item as Record<string, unknown>)?.clutterMultiScale;
        const clutterMultiScale = suppressInScan && cms === false ? false : undefined;
        const stripRaw = (item as Record<string, unknown>)?.clutterStripPlan;
        const clutterStripPlan = suppressInScan && stripRaw === true ? true : undefined;
        return {
          fileName,
          displayName: String(item?.displayName || fileToDisplayName(fileName)).trim(),
          price: Number.isFinite(priceRaw) ? Math.max(0, priceRaw) : 0,
          priority: idx + 1,
          dependencies,
          suppressInScan: suppressInScan ? true : undefined,
          clutterRotation,
          clutterMultiScale,
          clutterStripPlan,
        };
      })
      .filter(Boolean) as ItemMeta[];

    const existingOrder = normalized.map((item) => item.fileName);
    const missingFiles = files.filter((fileName) => !existingOrder.includes(fileName));
    for (const fileName of missingFiles) {
      normalized.push({
        fileName,
        displayName: fileToDisplayName(fileName),
        price: 0,
        priority: normalized.length + 1,
        dependencies: [],
      });
    }

    const content = metadataToMarkdown(normalized);
    await fs.mkdir(path.dirname(ITEM_LIBRARY_METADATA_MD), { recursive: true });
    await fs.writeFile(ITEM_LIBRARY_METADATA_MD, content, "utf8");
    const clientItems = await Promise.all(normalized.map(toClientItem));

    return new Response(
      JSON.stringify({
        success: true,
        items: clientItems,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to save item library metadata: ${error instanceof Error ? error.message : "unknown error"}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
