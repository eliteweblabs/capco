import type { APIRoute } from "astro";
import { promises as fs } from "node:fs";
import path from "node:path";
import { type ClutterRotationMode, upsertItemInMetadata } from "../../../lib/item-library-metadata";

const ITEM_LIBRARY_DIR = path.join(process.cwd(), "public", "drawing-analyzer-lab", "item-library");

function safeFileName(raw: string): string {
  return (
    raw
      .trim()
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "legend-item"
  );
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      dataUrl?: string;
      displayName?: string;
      /** When true, item is used only to erase matching clutter before head scan. */
      suppressInScan?: boolean;
      /** When clutter: `fixed` = as drawn; `quarter_turns` = match at 0/90/180/270°. */
      clutterRotation?: ClutterRotationMode;
      /** When clutter: `false` = match at ~100% scale only; omit/true = try several scales. */
      clutterMultiScale?: boolean;
      /** When clutter: looser “strip plan” matching for many repeats (optional). */
      clutterStripPlan?: boolean;
    };
    const dataUrl = String(body?.dataUrl || "").trim();
    const displayName = String(body?.displayName || "Legend Item").trim();
    const suppressInScan = body?.suppressInScan === true;
    const clutterRotation: ClutterRotationMode | undefined = suppressInScan
      ? body?.clutterRotation === "quarter_turns"
        ? "quarter_turns"
        : "fixed"
      : undefined;

    if (!dataUrl.startsWith("data:image/png;base64,")) {
      return new Response(
        JSON.stringify({ success: false, error: "Only PNG data URLs are supported." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const safeName = safeFileName(displayName);
    const fileName = `${safeName}-${Date.now()}.png`;
    const base64 = dataUrl.slice("data:image/png;base64,".length);
    const buffer = Buffer.from(base64, "base64");

    await fs.mkdir(ITEM_LIBRARY_DIR, { recursive: true });
    await fs.writeFile(path.join(ITEM_LIBRARY_DIR, fileName), buffer);

    const clutterMultiScale =
      suppressInScan && body?.clutterMultiScale === false ? false : undefined;
    const clutterStripPlan = suppressInScan && body?.clutterStripPlan === true ? true : undefined;

    await upsertItemInMetadata(fileName, safeName, {
      suppressInScan: suppressInScan ? true : false,
      clutterRotation,
      clutterMultiScale,
      clutterStripPlan,
    });

    return new Response(
      JSON.stringify({
        success: true,
        fileName,
        displayName: safeName,
        suppressInScan,
        clutterRotation,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to save: ${error instanceof Error ? error.message : "unknown error"}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
