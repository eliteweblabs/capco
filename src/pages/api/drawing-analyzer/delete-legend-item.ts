import type { APIRoute } from "astro";
import { promises as fs } from "node:fs";
import path from "node:path";
import { removeItemFromMetadata } from "../../../lib/item-library-metadata";

const ITEM_LIBRARY_DIR = path.join(
  process.cwd(),
  "public",
  "drawing-analyzer-lab",
  "item-library"
);

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as { fileName?: string };
    const rawName = String(body?.fileName || "").trim();

    // Strip any leading path components — only allow a bare filename
    const fileName = path.basename(rawName);
    if (!fileName || fileName.includes("..") || !fileName.endsWith(".png")) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid file name." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const filePath = path.join(ITEM_LIBRARY_DIR, fileName);

    // Confirm the resolved path is still inside the library dir
    const resolved = path.resolve(filePath);
    const libResolved = path.resolve(ITEM_LIBRARY_DIR);
    if (!resolved.startsWith(libResolved + path.sep)) {
      return new Response(
        JSON.stringify({ success: false, error: "Path traversal denied." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    await fs.unlink(filePath);
    await removeItemFromMetadata(fileName);

    return new Response(
      JSON.stringify({ success: true, fileName }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown error";
    const status = msg.includes("ENOENT") ? 404 : 500;
    return new Response(
      JSON.stringify({ success: false, error: `Failed to delete: ${msg}` }),
      { status, headers: { "Content-Type": "application/json" } }
    );
  }
};
