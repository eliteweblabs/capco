/**
 * Dynamic Web App Manifest - serves per-request company data for add-to-homescreen.
 * Name, short_name, theme_color, and icons use current site config.
 * GET /manifest.json
 */
import type { APIRoute } from "astro";
import { createHash } from "node:crypto";
import { globalCompanyData } from "./api/global/global-company-data";

function deriveShortName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed || trimmed === "Company Name Not Set") return "App";
  const words = trimmed.split(/\s+/);
  if (words[0] && words[0].length >= 4) return words[0];
  return words.slice(0, 2).join(" ").slice(0, 12) || trimmed.slice(0, 12) || "App";
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const data = await globalCompanyData();
    const base = new URL(request.url).origin;

    const rawName = data.globalCompanyName?.trim();
    const isUnset = !rawName || rawName === "Company Name Not Set";
    const name = isUnset ? "App" : rawName;
    const shortName = deriveShortName(name);
    const themeColor = data.primaryColor || "#825BDD";
    const description = data.globalCompanySlogan || "Fire protection project management";

    const iconMarkup = data.globalCompanyIcon ?? "";
    const faviconThumbV =
      typeof iconMarkup === "string" &&
      (iconMarkup.includes("<svg") || iconMarkup.includes("<?xml"))
        ? createHash("sha256")
            .update(iconMarkup)
            .update(data.primaryColor || "")
            .digest("hex")
            .slice(0, 12)
        : "";

    const v = faviconThumbV ? `&v=${faviconThumbV}` : "";

    // Multi-site: dynamic APIs serve DB icon; ?v aligns with AppHead cache-bust after settings changes
    const iconSvg = `${base}/api/favicon.svg${faviconThumbV ? `?v=${faviconThumbV}` : ""}`;
    const iconPngApple = `${base}/api/favicon.png?size=180${v}`;
    const iconPng192 = `${base}/api/favicon.png?size=192${v}`;
    const iconPng512 = `${base}/api/favicon.png?size=512${v}`;

    const manifest = {
      name,
      short_name: shortName,
      description,
      start_url: "/",
      display: "standalone",
      background_color: data.backgroundColor || "#ffffff",
      theme_color: themeColor,
      orientation: "portrait-primary",
      scope: "/",
      icons: [
        { src: iconSvg, sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        {
          src: iconPngApple,
          sizes: "180x180",
          type: "image/png",
          purpose: "any",
        },
        { src: iconPng192, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: iconPng512, sizes: "512x512", type: "image/png", purpose: "any" },
      ],
      categories: ["business", "productivity"],
      shortcuts: [
        {
          name: "New Project",
          short_name: "New",
          description: "Create a new fire protection project",
          url: "/project/new",
          icons: [],
        },
      ],
      prefer_related_applications: false,
      lang: "en",
      dir: "ltr",
    };

    return new Response(JSON.stringify(manifest), {
      status: 200,
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("[manifest.json] Error:", error);
    return new Response(JSON.stringify({ error: "Failed to load manifest" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
