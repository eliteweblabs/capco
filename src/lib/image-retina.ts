/**
 * Retina-aware image URL helpers.
 * For high-DPI displays (2x, 3x), request higher-resolution images to avoid blurriness.
 */

/**
 * Get a 2x (retina) variant of an image URL when the URL supports resizing.
 * - Unsplash (images.unsplash.com): doubles the w= parameter
 * - Returns original URL if format not recognized
 */
export function getRetinaImageUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "images.unsplash.com") {
      const w = parsed.searchParams.get("w");
      if (w) {
        const width = parseInt(w, 10);
        if (!Number.isNaN(width) && width < 4096) {
          parsed.searchParams.set("w", String(Math.min(width * 2, 2400)));
          return parsed.toString();
        }
      }
      if (!w) parsed.searchParams.set("w", "1600");
      return parsed.toString();
    }
  } catch {
    /* ignore */
  }
  return url;
}

/**
 * Build srcset for retina: "url1x 1x, url2x 2x"
 * Only for URLs we can transform (e.g. Unsplash)
 */
export function getRetinaSrcSet(url: string, baseWidth = 800): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "images.unsplash.com") {
      parsed.searchParams.set("w", String(baseWidth));
      const url1x = parsed.toString();
      parsed.searchParams.set("w", String(Math.min(baseWidth * 2, 2400)));
      const url2x = parsed.toString();
      return `${url1x} 1x, ${url2x} 2x`;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}
