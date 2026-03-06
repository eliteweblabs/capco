/**
 * Transform CMS/DB SVG icon for favicon use (Node/build script version).
 * Same logic as src/lib/favicon-svg-transform.ts: primary color fill + padding for apple-touch.
 */

const FAVICON_PADDING_RATIO = 0.9;

function toHex(color) {
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

/** Returns true if hex is dark (avg RGB < 136). Used to replace dark fills with primary. */
function isDarkHex(hex) {
  const m = hex.match(/^#?([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])?([0-9a-fA-F])?([0-9a-fA-F])?$/);
  if (!m) return false;
  let r, g, b;
  if (m[4] !== undefined) {
    r = parseInt(m[1] + m[2], 16);
    g = parseInt(m[3] + m[4], 16);
    b = parseInt((m[5] || m[3]) + (m[6] || m[4]), 16);
  } else {
    r = parseInt(m[1] + m[1], 16);
    g = parseInt(m[2] + m[2], 16);
    b = parseInt(m[3] + m[3], 16);
  }
  return (r + g + b) / 3 < 136;
}

/**
 * @param {string} svgString
 * @param {string} primaryColor
 * @returns {string}
 */
export function transformSvgForFavicon(svgString, primaryColor) {
  if (!svgString || !svgString.includes("<svg")) return svgString;
  const primary = toHex(primaryColor);

  let svg = svgString
    .replace(/\bfill\s*=\s*["'](?:#000|black|currentColor)["']/gi, `fill="${primary}"`)
    .replace(/\bstroke\s*=\s*["'](?:#000|black|currentColor)["']/gi, `stroke="${primary}"`)
    .replace(/\bfill\s*=\s*["']#000000["']/gi, `fill="${primary}"`)
    .replace(/\bfill\s*=\s*["'](#[0-9a-fA-F]{3,8})["']/g, (m, hex) =>
      isDarkHex(hex) ? `fill="${primary}"` : m
    )
    .replace(/\bstroke\s*=\s*["'](#[0-9a-fA-F]{3,8})["']/g, (m, hex) =>
      isDarkHex(hex) ? `stroke="${primary}"` : m
    );

  svg = svg.replace(
    /<style[^>]*>[\s\S]*?<\/style>/gi,
    (styleBlock) => {
      if (/\.fill\s*\{[^}]*fill\s*:\s*(#000|#fff|black|white|currentColor)/i.test(styleBlock)) {
        return `<style>path, circle, rect, ellipse, polygon, .fill { fill: ${primary} !important; }</style>`;
      }
      if (/\bfill\s*:\s*(#[0-9a-fA-F]{3,8})/i.test(styleBlock)) {
        return styleBlock.replace(/\bfill\s*:\s*(#[0-9a-fA-F]{3,8})/gi, (m, hex) =>
          isDarkHex(hex) ? `fill: ${primary}` : m
        );
      }
      return styleBlock;
    }
  );

  const overrideStyle = `path, circle, rect, ellipse, polygon, .fill { fill: ${primary} !important; stroke: ${primary} !important; }`;
  const hasPrimaryStyle = new RegExp(`fill:\\s*${primary.replace(/[#()]/g, "\\$&")}`).test(svg);
  if (!hasPrimaryStyle) {
    if (/<defs[\s\S]*?>/i.test(svg)) {
      svg = svg.replace(/(<defs[^>]*>)/i, `$1<style>${overrideStyle}</style>`);
    } else {
      const afterSvgOpen = svg.indexOf(">", svg.indexOf("<svg")) + 1;
      svg = svg.slice(0, afterSvgOpen) + `<defs><style>${overrideStyle}</style></defs>` + svg.slice(afterSvgOpen);
    }
  }

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

  const defsMatch = inner.match(/<defs[\s\S]*?>[\s\S]*?<\/defs>/i);
  const defsBlock = defsMatch ? defsMatch[0] : "";
  const rest = defsMatch ? inner.replace(/<defs[\s\S]*?>[\s\S]*?<\/defs>/i, "").trim() : inner;
  const wrappedRest = rest ? `<g transform="translate(${translateX}, ${translateY}) scale(${scale})">${rest}</g>` : rest;
  const newInner = defsBlock ? defsBlock + "\n" + wrappedRest : wrappedRest;

  return svg.replace(/<svg[\s\S]*?>[\s\S]*?<\/svg>/i, openTag + newInner + "</svg>");
}
