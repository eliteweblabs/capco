/**
 * Dynamic favicon PNG / apple-touch-icon endpoint for multi-site.
 * Redirects to static /favicon.png so each deployment can have public/favicon.png (gitignored).
 * Optional: globalSettings.faviconPngUrl could redirect to a CDN URL per site.
 * GET /api/favicon.png
 */
import type { APIRoute } from "astro";
import { globalCompanyData } from "./global/global-company-data";

export const GET: APIRoute = async ({ request }) => {
  try {
    const data = await globalCompanyData();
    const customPngUrl = data.faviconPngUrl;
    const base = new URL(request.url).origin;
    if (customPngUrl && (customPngUrl.startsWith("http") || customPngUrl.startsWith("/"))) {
      const target = customPngUrl.startsWith("http") ? customPngUrl : `${base}${customPngUrl}`;
      return Response.redirect(target, 302);
    }
    return Response.redirect(new URL("/favicon.png", base), 302);
  } catch {
    const base = new URL(request.url).origin;
    return Response.redirect(new URL("/favicon.png", base), 302);
  }
};
