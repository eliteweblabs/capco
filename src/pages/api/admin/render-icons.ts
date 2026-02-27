/**
 * API: Render favicon files from globalSettings icon (same pipeline as process-manifest).
 * Admin-only. Writes public/favicon.svg and public/favicon.png; returns paths and sizes.
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { transformSvgForFavicon } from "../../../lib/favicon-svg-transform";
import fs from "fs";
import path from "path";

const SIZE_PNG = 512;
const APPLE_TOUCH_SIZE = 180;

export const POST: APIRoute = async ({ cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    const role = currentUser?.profile?.role;
    if (!isAuth || !currentUser || role !== "Admin") {
      return new Response(JSON.stringify({ success: false, error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: rows } = await supabaseAdmin
      .from("globalSettings")
      .select("key, value")
      .in("key", ["icon", "primaryColor"]);

    const settings: Record<string, string> = {};
    if (rows) for (const r of rows) settings[r.key] = (r.value as string) || "";
    const iconSvg = settings.icon || "";
    const primaryColor = settings.primaryColor || "#825BDD";

    if (!iconSvg || !iconSvg.includes("<svg")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No valid icon SVG in settings. Save an icon first.",
          files: [],
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const root = process.cwd();
    const publicDir = path.join(root, "public");
    const faviconSvgPath = path.join(publicDir, "favicon.svg");
    const faviconPngPath = path.join(publicDir, "favicon.png");
    const appleTouchPath = path.join(publicDir, "apple-touch-icon.png");

    const transformedSvg = transformSvgForFavicon(iconSvg, primaryColor);
    fs.writeFileSync(faviconSvgPath, transformedSvg, "utf-8");

    const files: { path: string; size: string; type: string; url: string }[] = [
      { path: "/favicon.svg", size: "any", type: "image/svg+xml", url: "/favicon.svg" },
    ];

    try {
      const sharp = (await import("sharp")).default;
      const svgBuffer = fs.readFileSync(faviconSvgPath);
      await sharp(svgBuffer).resize(SIZE_PNG, SIZE_PNG).png().toFile(faviconPngPath);
      files.push({
        path: "/favicon.png",
        size: `${SIZE_PNG}x${SIZE_PNG}`,
        type: "image/png",
        url: "/favicon.png",
      });
      await sharp(svgBuffer).resize(APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE).png().toFile(appleTouchPath);
      files.push({
        path: "/apple-touch-icon.png",
        size: `${APPLE_TOUCH_SIZE}x${APPLE_TOUCH_SIZE}`,
        type: "image/png",
        url: "/apple-touch-icon.png",
      });
    } catch (err: unknown) {
      console.warn("[render-icons] sharp PNG generation failed:", err);
      return new Response(
        JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : "Failed to generate PNG",
          files: [{ path: "/favicon.svg", size: "any", type: "image/svg+xml", url: "/favicon.svg" }],
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Rendered icon files updated.",
        files,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[render-icons] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        files: [],
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
