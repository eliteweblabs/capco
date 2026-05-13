/**
 * PNG favicons from globalSettings.icon (same transform as /api/favicon.svg).
 *
 * Query: ?size=180 | 192 | 512 (default 512). Unknown params (e.g. ?v=) are ignored.
 *
 * GET /api/favicon.png
 */
import type { APIRoute } from "astro";
import { createHash } from "node:crypto";
import { globalCompanyData } from "./global/global-company-data";
import { transformSvgForFavicon } from "../../lib/favicon-svg-transform";

const ALLOWED_SIZES = new Set([180, 192, 512]);

function parseSize(searchParams: URLSearchParams): number {
  const raw = Number.parseInt(searchParams.get("size") || "", 10);
  if (Number.isFinite(raw) && ALLOWED_SIZES.has(raw)) return raw;
  return 512;
}

function redirectToSvgFallback(reqUrl: URL): Response {
  const v = reqUrl.searchParams.get("v");
  const next = new URL("/api/favicon.svg", reqUrl);
  if (v) next.searchParams.set("v", v);
  return Response.redirect(next.href, 302);
}

export const GET: APIRoute = async ({ request }) => {
  const reqUrl = new URL(request.url);
  const size = parseSize(reqUrl.searchParams);

  try {
    const data = await globalCompanyData();
    const customPngUrl = data.faviconPngUrl;

    if (customPngUrl && (customPngUrl.startsWith("http") || customPngUrl.startsWith("/"))) {
      const target = customPngUrl.startsWith("http")
        ? customPngUrl
        : `${reqUrl.origin}${customPngUrl}`;
      return Response.redirect(target, 302);
    }

    const { globalCompanyIcon, primaryColor } = data;
    const primary = primaryColor || "#825BDD";

    if (
      !globalCompanyIcon ||
      !(globalCompanyIcon.includes("<svg") || globalCompanyIcon.includes("<?xml"))
    ) {
      return Response.redirect(new URL("/favicon.png", reqUrl).href, 302);
    }

    let transformedSvg: string;
    try {
      transformedSvg = transformSvgForFavicon(globalCompanyIcon, primary);
    } catch (transformErr) {
      console.warn("[favicon.png] SVG transform failed:", transformErr);
      return redirectToSvgFallback(reqUrl);
    }

    const etag = `"${createHash("sha256").update(transformedSvg).update(String(size)).digest("hex").slice(0, 32)}"`;

    const inm = request.headers.get("if-none-match");
    if (inm === etag) {
      return new Response(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": "public, max-age=120" },
      });
    }

    try {
      const sharp = (await import("sharp")).default;
      const pngBuffer = await sharp(Buffer.from(transformedSvg, "utf8"))
        .resize(size, size)
        .png()
        .toBuffer();

      return new Response(new Uint8Array(pngBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=120",
          ETag: etag,
        },
      });
    } catch (sharpErr) {
      console.warn("[favicon.png] Sharp raster failed — use SVG tab icon:", sharpErr);
      return redirectToSvgFallback(reqUrl);
    }
  } catch (error) {
    console.warn("[favicon.png] Error:", error);
    return redirectToSvgFallback(reqUrl);
  }
};
