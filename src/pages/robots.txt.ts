/**
 * Dynamic robots.txt — sitemap URL follows the live host (multi-tenant capco installs).
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ request }) => {
  const origin = new URL(request.url).origin.replace(/\/+$/, "");
  const body = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
