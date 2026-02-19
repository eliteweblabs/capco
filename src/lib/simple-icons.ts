// Simple icon system - Works both server-side (Astro) and client-side (browser)
// Usage: <Icon name="user" /> or window.SimpleIcons.getIcon("user")

import iconData from "./icon-data.json";

export interface IconConfig {
  size?: number;
  className?: string;
  globalCompanyIcon?: string; // Pass the global company icon SVG for 'logo' name
}

// Import icons from single source
export const SIMPLE_ICONS: Record<string, string> = iconData;

// Function to get icon with size and class customization
export function getIcon(name: string, config: IconConfig = {}): string {
  const { size = 16, className = "", globalCompanyIcon } = config;

  // Normalize: "icon:hospital" → "hospital" (CMS/content may use this format)
  const iconName = name.startsWith("icon:") ? name.slice(5) : name;

  // Special case: if name is 'logo', use the global company icon and normalize viewBox for even padding
  let iconSvg: string | undefined;
  if (iconName === "logo" && globalCompanyIcon) {
    iconSvg = normalizeLogoViewBox(globalCompanyIcon);
  } else {
    iconSvg = SIMPLE_ICONS[iconName];
  }

  if (!iconSvg) {
    return `<span class="inline-block text-red-500">[icon:${iconName}]</span>`; // Debug fallback
  }

  // Replace size and add className (add inline-block only if className is provided and doesn't already have it)
  const needsInlineBlock =
    className && !className.includes("inline-block") && !className.includes("block");
  const classes = needsInlineBlock ? `${className} inline-block` : className || "inline-block";

  // Replace width and height attributes only (not viewBox)
  let result = iconSvg
    .replace(/width="16"/g, `width="${size}"`)
    .replace(/height="16"/g, `height="${size}"`);

  // Add class to root <svg> only; preserve classes on inner elements (e.g. path class="svg-icon-stroke" for animations)
  const svgTagMatch = result.match(/^(\s*)<svg([^>]*)>/);
  if (svgTagMatch) {
    const [, leading, attrs] = svgTagMatch;
    if (/class\s*=\s*["'][^"']*["']/.test(attrs)) {
      result = result.replace(/^(\s*)<svg([^>]*)>/, (_, l, a) => l + '<svg' + a.replace(/class\s*=\s*["'][^"']*["']/, `class="${classes}"`) + '>');
    } else {
      result = result.replace(/^(\s*)<svg([^>]*)>/, `$1<svg class="${classes}"$2>`);
    }
  }

  return result;
}

/**
 * Normalize logo SVG so the graphic is centered in a square viewBox (fixes unequal padding).
 * Wraps content in a centered <g> and sets a square viewBox + preserveAspectRatio.
 */
function normalizeLogoViewBox(svg: string): string {
  const viewBoxMatch = svg.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (!viewBoxMatch) return svg;

  const parts = viewBoxMatch[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (parts.length < 4) return svg;

  const [minX, minY, w, h] = parts;
  const s = Math.max(w, h, 1);
  const cx = minX + w / 2;
  const cy = minY + h / 2;
  const dx = s / 2 - cx;
  const dy = s / 2 - cy;

  const innerMatch = svg.match(/<svg[\s\S]*?>([\s\S]*?)<\/svg>/i);
  const inner = innerMatch ? innerMatch[1] : "";

  const openTag = svg.match(/<svg[^>]*>/i)?.[0] ?? "<svg>";
  let newOpen = openTag
    .replace(/viewBox\s*=\s*["'][^"']*["']/i, `viewBox="0 0 ${s} ${s}"`)
    .replace(/\spreserveAspectRatio\s*=\s*["'][^"']*["']/gi, "");
  if (!newOpen.includes("preserveAspectRatio=")) {
    newOpen = newOpen.replace(/>$/, ' preserveAspectRatio="xMidYMid meet">');
  }

  const wrappedInner =
    dx !== 0 || dy !== 0 ? `<g transform="translate(${dx}, ${dy})">${inner}</g>` : inner;
  return newOpen + wrappedInner + "</svg>";
}

// Auto-initialize for client-side (browser) usage
if (typeof window !== "undefined") {
  (window as any).SimpleIcons = {
    getIcon,
    SIMPLE_ICONS,
  } as any;
}
