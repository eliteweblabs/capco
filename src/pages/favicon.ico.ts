/**
 * Dynamic favicon.ico endpoint for multi-site.
 * Browsers request /favicon.ico by default; this redirects to the same
 * generated icon as the manifest (api/favicon.png) so no static favicon.ico is needed.
 * GET /favicon.ico
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  const base = new URL(request.url).origin;
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL("/api/favicon.png", base).href,
      "Cache-Control": "public, max-age=3600",
    },
  });
};
