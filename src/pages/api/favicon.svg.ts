/**
 * Dynamic favicon endpoint - serves company icon from globalSettings.
 * Transforms SVG: primary color fill (replaces black/theme-dependent) and padding for apple-touch.
 * GET /api/favicon.svg
 */
import type { APIRoute } from "astro";
import { createHash } from "node:crypto";
import { globalCompanyData } from "./global/global-company-data";
import { transformSvgForFavicon } from "../../lib/favicon-svg-transform";

export const GET: APIRoute = async ({ request }) => {
  try {
    const { globalCompanyIcon, primaryColor } = await globalCompanyData();
    const primary = primaryColor || "#825BDD";

    if (
      globalCompanyIcon &&
      (globalCompanyIcon.includes("<svg") || globalCompanyIcon.includes("<?xml"))
    ) {
      const transformed = transformSvgForFavicon(globalCompanyIcon, primary);
      const etag = `"${createHash("sha256").update(transformed).digest("hex").slice(0, 32)}"`;

      const inm = request.headers.get("if-none-match");
      if (inm === etag) {
        return new Response(null, {
          status: 304,
          headers: { ETag: etag, "Cache-Control": "public, max-age=120" },
        });
      }

      return new Response(transformed, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=120",
          ETag: etag,
        },
      });
    }

    const base = new URL(request.url).origin;
    return Response.redirect(new URL("/favicon.svg", base), 302);
  } catch (error) {
    console.warn("[favicon.svg] Error:", error);
    const base = new URL(request.url).origin;
    return Response.redirect(new URL("/favicon.svg", base), 302);
  }
};
