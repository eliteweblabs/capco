/**
 * Dynamic XML sitemap — uses request origin + configured CMS pages.
 */
import type { APIRoute } from "astro";
import { getAvailablePages } from "../lib/content";

function slugToPath(slug: string): string {
  if (!slug || slug === "/" || slug === "index" || slug === "home") return "/";
  const clean = slug.replace(/^\/+/, "").replace(/\/+$/, "");
  return clean ? `/${clean}` : "/";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async ({ request }) => {
  const origin = new URL(request.url).origin.replace(/\/+$/, "");
  const pages = await getAvailablePages().catch(() => [] as string[]);
  const paths = new Set<string>(["/"]);
  for (const slug of pages) {
    const path = slugToPath(slug);
    if (path.startsWith("/api/") || path.startsWith("/admin/")) continue;
    paths.add(path);
  }

  const urls = [...paths]
    .sort((a, b) => a.localeCompare(b))
    .map((path) => `  <url><loc>${escapeXml(`${origin}${path}`)}</loc></url>`)
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
