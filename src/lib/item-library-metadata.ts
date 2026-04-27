/**
 * Shared item-library metadata (markdown JSON block in markdowns/).
 * Used by /api/drawing-analyzer/item-library and save/delete-legend-item routes.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export type DependencyMeta = { fileName: string; qty: number };

/** How clutter templates are matched on the scan (symbol items ignore this). */
export type ClutterRotationMode = "fixed" | "quarter_turns";

export type ItemMeta = {
  fileName: string;
  displayName: string;
  price: number;
  priority: number;
  dependencies: DependencyMeta[];
  /**
   * When true, the template is used only to paint out (white) matching ink on the
   * scan source before repeated-motif head detection — not offered as a sprinkler match.
   */
  suppressInScan?: boolean;
  /**
   * When `suppressInScan`: `fixed` = match orientation as captured only;
   * `quarter_turns` = also try 90°, 180°, 270° when scoring components.
   */
  clutterRotation?: ClutterRotationMode;
  /**
   * When `suppressInScan`: try several raster scales when matching (default).
   * Set `false` to match at captured scale only (~100%) — fewer false positives on similar-sized noise.
   */
  clutterMultiScale?: boolean;
  /**
   * When `suppressInScan`: looser matching + larger components + extra scales — for stripping many
   * repeats across the sheet (clean plan). Higher false-positive risk; use a tight template clip.
   */
  clutterStripPlan?: boolean;
};

export const ITEM_LIBRARY_METADATA_MD = path.join(
  process.cwd(),
  "markdowns",
  "drawing-analyzer-lab-item-library.md"
);

export function fileToDisplayName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "");
}

export function parseMetadataMarkdown(markdown: string): { items: ItemMeta[] } {
  const match = markdown.match(/```json\s*([\s\S]*?)\s*```/i);
  if (!match) return { items: [] };
  try {
    const parsed = JSON.parse(match[1]);
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    return {
      items: items
        .map((item: unknown, idx: number) => {
          const rec = item as Record<string, unknown>;
          const fileName = String(rec?.fileName || "").trim();
          if (!fileName) return null;
          const displayName = String(rec?.displayName || fileToDisplayName(fileName)).trim();
          const priceRaw = Number(rec?.price ?? 0);
          const priorityRaw = Number(rec?.priority ?? idx + 1);
          const depsRaw = rec?.dependencies;
          const dependencies = Array.isArray(depsRaw)
            ? depsRaw
                .map((dep: unknown) => {
                  const d = dep as Record<string, unknown>;
                  const depFile = String(d?.fileName || "").trim();
                  const qtyRaw = Number(d?.qty ?? 1);
                  if (!depFile) return null;
                  return {
                    fileName: depFile,
                    qty: Number.isFinite(qtyRaw) ? Math.max(1, Math.round(qtyRaw)) : 1,
                  };
                })
                .filter(Boolean)
            : [];
          const suppressInScan = rec?.suppressInScan === true;
          const rotRaw = String(rec?.clutterRotation || "fixed").toLowerCase();
          const clutterRotation: ClutterRotationMode | undefined = suppressInScan
            ? rotRaw === "quarter_turns"
              ? "quarter_turns"
              : "fixed"
            : undefined;
          const clutterMultiScale =
            suppressInScan && rec?.clutterMultiScale === false ? false : undefined;
          const clutterStripPlan = suppressInScan && rec?.clutterStripPlan === true ? true : undefined;
          return {
            fileName,
            displayName: displayName || fileToDisplayName(fileName),
            price: Number.isFinite(priceRaw) ? Math.max(0, priceRaw) : 0,
            priority: Number.isFinite(priorityRaw) ? Math.max(1, Math.round(priorityRaw)) : idx + 1,
            dependencies,
            suppressInScan: suppressInScan ? true : undefined,
            clutterRotation,
            clutterMultiScale,
            clutterStripPlan,
          };
        })
        .filter(Boolean) as ItemMeta[],
    };
  } catch {
    return { items: [] };
  }
}

export function metadataToMarkdown(items: ItemMeta[]): string {
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

export async function readItemLibraryMetadata(): Promise<ItemMeta[]> {
  try {
    const raw = await fs.readFile(ITEM_LIBRARY_METADATA_MD, "utf8");
    return parseMetadataMarkdown(raw).items;
  } catch {
    return [];
  }
}

export async function writeItemLibraryMetadata(items: ItemMeta[]): Promise<void> {
  const content = metadataToMarkdown(items);
  await fs.mkdir(path.dirname(ITEM_LIBRARY_METADATA_MD), { recursive: true });
  await fs.writeFile(ITEM_LIBRARY_METADATA_MD, content, "utf8");
}

/**
 * Add a new file to metadata or update flags on an existing row (e.g. after PNG save).
 */
export async function upsertItemInMetadata(
  fileName: string,
  displayName: string,
  opts?: {
    suppressInScan?: boolean;
    clutterRotation?: ClutterRotationMode;
    clutterMultiScale?: boolean;
    clutterStripPlan?: boolean;
  }
): Promise<void> {
  const items = await readItemLibraryMetadata();
  const idx = items.findIndex((i) => i.fileName === fileName);
  const flag = opts?.suppressInScan;
  if (idx >= 0) {
    const cur = items[idx];
    let suppressInScan: boolean | undefined = cur.suppressInScan;
    if (flag === true) suppressInScan = true;
    else if (flag === false) suppressInScan = undefined;

    let clutterRotation: ClutterRotationMode | undefined = cur.clutterRotation;
    if (suppressInScan !== true) {
      clutterRotation = undefined;
    } else if (opts?.clutterRotation !== undefined) {
      clutterRotation = opts.clutterRotation;
    }

    let clutterMultiScale: boolean | undefined = cur.clutterMultiScale;
    if (suppressInScan !== true) {
      clutterMultiScale = undefined;
    } else if (opts?.clutterMultiScale !== undefined) {
      clutterMultiScale = opts.clutterMultiScale === false ? false : undefined;
    }

    let clutterStripPlan: boolean | undefined = cur.clutterStripPlan;
    if (suppressInScan !== true) {
      clutterStripPlan = undefined;
    } else if (opts?.clutterStripPlan !== undefined) {
      clutterStripPlan = opts.clutterStripPlan === true ? true : undefined;
    }

    items[idx] = {
      ...cur,
      displayName: displayName || cur.displayName,
      suppressInScan,
      clutterRotation,
      clutterMultiScale,
      clutterStripPlan,
    };
  } else {
    const suppressInScan = flag === true ? true : undefined;
    const clutterRotation =
      suppressInScan === true
        ? opts?.clutterRotation === "quarter_turns"
          ? "quarter_turns"
          : "fixed"
        : undefined;
    const clutterMultiScale =
      suppressInScan === true && opts?.clutterMultiScale === false ? false : undefined;
    const clutterStripPlan = suppressInScan === true && opts?.clutterStripPlan === true ? true : undefined;
    items.push({
      fileName,
      displayName: displayName || fileToDisplayName(fileName),
      price: 0,
      priority: items.length + 1,
      dependencies: [],
      suppressInScan,
      clutterRotation,
      clutterMultiScale,
      clutterStripPlan,
    });
  }
  await writeItemLibraryMetadata(items);
}

export async function removeItemFromMetadata(fileName: string): Promise<void> {
  const items = (await readItemLibraryMetadata()).filter((i) => i.fileName !== fileName);
  await writeItemLibraryMetadata(items);
}
