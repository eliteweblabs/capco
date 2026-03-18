import type { APIRoute } from "astro";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

type DependencyMeta = { fileName: string; qty: number };
type ItemMeta = {
  fileName: string;
  displayName: string;
  price: number;
  priority: number;
  dependencies: DependencyMeta[];
};

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const ITEM_LIBRARY_DIR = path.join(process.cwd(), "public", "drawing-analyzer-lab", "item-library");
const ITEM_LIBRARY_NORMALIZED_DIR = path.join(
  process.cwd(),
  "public",
  "drawing-analyzer-lab",
  "item-library-normalized"
);
const ITEM_LIBRARY_METADATA_MD = path.join(
  process.cwd(),
  "markdowns",
  "drawing-analyzer-lab-item-library.md"
);
const NORMALIZED_CANVAS_SIZE = 512;
const NORMALIZATION_VERSION = 2;

function fileToDisplayName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "");
}

function parseMetadataMarkdown(markdown: string): { items: ItemMeta[] } {
  const match = markdown.match(/```json\s*([\s\S]*?)\s*```/i);
  if (!match) return { items: [] };
  try {
    const parsed = JSON.parse(match[1]);
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    return {
      items: items
        .map((item: unknown, idx: number) => {
          const fileName = String((item as Record<string, unknown>)?.fileName || "").trim();
          if (!fileName) return null;
          const displayName = String(
            (item as Record<string, unknown>)?.displayName || fileToDisplayName(fileName)
          ).trim();
          const priceRaw = Number((item as Record<string, unknown>)?.price ?? 0);
          const priorityRaw = Number((item as Record<string, unknown>)?.priority ?? idx + 1);
          const depsRaw = (item as Record<string, unknown>)?.dependencies;
          const dependencies = Array.isArray(depsRaw)
            ? depsRaw
                .map((dep: unknown) => {
                  const depFile = String((dep as Record<string, unknown>)?.fileName || "").trim();
                  const qtyRaw = Number((dep as Record<string, unknown>)?.qty ?? 1);
                  if (!depFile) return null;
                  return {
                    fileName: depFile,
                    qty: Number.isFinite(qtyRaw) ? Math.max(1, Math.round(qtyRaw)) : 1,
                  };
                })
                .filter(Boolean)
            : [];
          return {
            fileName,
            displayName: displayName || fileToDisplayName(fileName),
            price: Number.isFinite(priceRaw) ? Math.max(0, priceRaw) : 0,
            priority: Number.isFinite(priorityRaw) ? Math.max(1, Math.round(priorityRaw)) : idx + 1,
            dependencies,
          };
        })
        .filter(Boolean) as ItemMeta[],
    };
  } catch {
    return { items: [] };
  }
}

function metadataToMarkdown(items: ItemMeta[]): string {
  return `# Drawing Analyzer Lab Item Library Metadata

Managed by \`/api/drawing-analyzer/item-library\`.
Update images manually in \`public/drawing-analyzer-lab/item-library\`.

\`\`\`json
${JSON.stringify(
  {
    version: 1,
    updatedAt: new Date().toISOString(),
    items,
  },
  null,
  2
)}
\`\`\`
`;
}

async function listLibraryFiles(): Promise<string[]> {
  const entries = await fs.readdir(ITEM_LIBRARY_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

async function readMetadataItems(): Promise<ItemMeta[]> {
  try {
    const raw = await fs.readFile(ITEM_LIBRARY_METADATA_MD, "utf8");
    return parseMetadataMarkdown(raw).items;
  } catch {
    return [];
  }
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
    return {
      fileName,
      displayName: meta?.displayName || fileToDisplayName(fileName),
      price: meta?.price ?? 0,
      priority: idx + 1,
      dependencies,
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

async function ensureNormalizedImage(fileName: string): Promise<string> {
  const srcPath = path.join(ITEM_LIBRARY_DIR, fileName);
  const stat = await fs.stat(srcPath);
  const version = Math.max(1, Math.round(stat.mtimeMs));
  const normalizedName = `${safeBaseName(fileName) || "item"}-v${NORMALIZATION_VERSION}-${version}.png`;
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
      withoutEnlargement: true,
      kernel: sharp.kernel.nearest,
    })
    .png({ compressionLevel: 9, palette: false, adaptiveFiltering: true, force: true })
    .toFile(outputPath);

  return outputUrl;
}

async function toClientItem(item: ItemMeta) {
  const rawImageUrl = `/drawing-analyzer-lab/item-library/${encodeURIComponent(item.fileName)}`;
  let imageUrl = `/drawing-analyzer-lab/item-library/${encodeURIComponent(item.fileName)}`;
  try {
    imageUrl = await ensureNormalizedImage(item.fileName);
  } catch (error) {
    console.warn("[drawing-analyzer/item-library] normalize fallback for", item.fileName, error);
  }
  return {
    ...item,
    rawImageUrl,
    imageUrl,
  };
}

export const GET: APIRoute = async () => {
  try {
    const [files, meta] = await Promise.all([listLibraryFiles(), readMetadataItems()]);
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
        return {
          fileName,
          displayName: String(item?.displayName || fileToDisplayName(fileName)).trim(),
          price: Number.isFinite(priceRaw) ? Math.max(0, priceRaw) : 0,
          priority: idx + 1,
          dependencies,
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
