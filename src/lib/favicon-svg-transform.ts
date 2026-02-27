/**
 * Transform CMS/DB SVG icon for favicon use:
 * - Apply primary color as fill (replaces black/currentColor/theme-dependent styles)
 * - Add padding so the graphic isn't edge-to-edge (better for apple-touch-icon)
 *
 * Used by /api/favicon.svg and by process-manifest when writing public/favicon.svg.
 */

const FAVICON_PADDING_RATIO = 0.9; // Graphic fits in 90% of canvas (5% padding each side)

/**
 * Normalize color to hex (e.g. #825BDD). Handles #hex, rgb(), and common names.
 */
function toHex(color: string): string {
  const s = (color || "").trim();
  if (!s) return "#825BDD";
  if (/^#[0-9A-Fa-f]{3,8}$/.test(s)) return s.length === 4 ? `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}` : s;
  if (s.toLowerCase() === "black") return "#000000";
  if (s.toLowerCase() === "white") return "#ffffff";
  const rgb = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    const r = parseInt(rgb[1], 10).toString(16).padStart(2, "0");
    const g = parseInt(rgb[2], 10).toString(16).padStart(2, "0");
    const b = parseInt(rgb[3], 10).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return s;
}

/**
 * Transform raw SVG string for favicon: primary color fill + padding for apple-touch.
 * Returns the transformed SVG string.
 */
export function transformSvgForFavicon(svgString: string, primaryColor: string): string {
  if (!svgString || !svgString.includes("<svg")) return svgString;
  const primary = toHex(primaryColor);

  // 1) Replace theme-dependent fill/stroke: black, #000, currentColor with primary
  let svg = svgString
    .replace(/\bfill\s*=\s*["'](?:#000|black|currentColor)["']/gi, `fill="${primary}"`)
    .replace(/\bstroke\s*=\s*["'](?:#000|black|currentColor)["']/gi, `stroke="${primary}"`)
    .replace(/\bfill\s*=\s*["']#000000["']/gi, `fill="${primary}"`);

  // 2) Remove or replace <style> that sets .fill to #000/#fff (theme-dependent)
  svg = svg.replace(
    /<style[^>]*>[\s\S]*?<\/style>/gi,
    (styleBlock) => {
      if (/\.fill\s*\{[^}]*fill\s*:\s*(#000|#fff|black|white|currentColor)/i.test(styleBlock)) {
        return `<style>path, circle, rect, ellipse, polygon, .fill { fill: ${primary} !important; }</style>`;
      }
      return styleBlock;
    }
  );

  // 3) Ensure all fill-less paths get primary (inject override style inside defs or add defs+style)
  const hasPrimaryStyle = new RegExp(`fill:\\s*${primary.replace(/[#()]/g, "\\$&")}`).test(svg);
  if (!hasPrimaryStyle) {
    if (/<defs[\s\S]*?>/i.test(svg)) {
      svg = svg.replace(/(<defs[^>]*>)/i, `$1<style>path, circle, rect, ellipse, polygon, .fill { fill: ${primary}; }</style>`);
    } else {
      const afterSvgOpen = svg.indexOf(">", svg.indexOf("<svg")) + 1;
      svg = svg.slice(0, afterSvgOpen) + `<defs><style>path, circle, rect, ellipse, polygon, .fill { fill: ${primary}; }</style></defs>` + svg.slice(afterSvgOpen);
    }
  }

  // 4) Add padding for apple-touch: wrap graphical content (not defs) in scaled+centered group
  const viewBoxMatch = svg.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  const vb = viewBoxMatch ? viewBoxMatch[1].trim().split(/[\s,]+/).map(Number) : [0, 0, 512, 512];
  if (vb.length < 4) return svg;
  const [minX, minY, w, h] = vb;
  const size = Math.max(w, h, 1);
  const scale = FAVICON_PADDING_RATIO;
  const cx = minX + w / 2;
  const cy = minY + h / 2;
  const translateX = size / 2 - scale * cx;
  const translateY = size / 2 - scale * cy;

  const innerMatch = svg.match(/<svg[\s\S]*?>([\s\S]*?)<\/svg>/i);
  const inner = innerMatch ? innerMatch[1] : "";
  const openTag = svg.match(/<svg[^>]*>/i)?.[0] ?? "<svg>";

  // Keep <defs>...</defs> outside the transform so gradients/refs work; wrap the rest
  const defsMatch = inner.match(/<defs[\s\S]*?>[\s\S]*?<\/defs>/i);
  const defsBlock = defsMatch ? defsMatch[0] : "";
  const rest = defsMatch ? inner.replace(/<defs[\s\S]*?>[\s\S]*?<\/defs>/i, "").trim() : inner;
  const wrappedRest = rest ? `<g transform="translate(${translateX}, ${translateY}) scale(${scale})">${rest}</g>` : rest;
  const newInner = defsBlock ? (defsBlock + "\n" + wrappedRest) : wrappedRest;

  return svg.replace(/<svg[\s\S]*?>[\s\S]*?<\/svg>/i, openTag + newInner + "</svg>");
}
