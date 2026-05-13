/**
 * Browsers request /favicon.ico by default.
 * Redirect to DB-backed SVG (PNG raster can fail on complex SVGs → stale public/favicon.png fallback).
 * GET /favicon.ico
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  const u = new URL(request.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL("/api/favicon.svg", u).href,
      "Cache-Control": "public, max-age=120",
    },
  });
};
