/**
 * Dynamic favicon endpoint - serves company icon from globalSettings.
 * Used by manifest and link tags for consistent branding per deployment.
 * GET /api/favicon.svg
 */
import type { APIRoute } from "astro";
import { globalCompanyData } from "./global/global-company-data";

export const GET: APIRoute = async ({ request }) => {
  try {
    const { globalCompanyIcon } = await globalCompanyData();

    if (
      globalCompanyIcon &&
      (globalCompanyIcon.includes("<svg") || globalCompanyIcon.includes("<?xml"))
    ) {
      return new Response(globalCompanyIcon, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Fallback: redirect to static favicon
    const base = new URL(request.url).origin;
    return Response.redirect(new URL("/favicon.svg", base), 302);
  } catch (error) {
    console.warn("[favicon.svg] Error:", error);
    const base = new URL(request.url).origin;
    return Response.redirect(new URL("/favicon.svg", base), 302);
  }
};
