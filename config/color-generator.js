/**
 * Simple color palette generator for Tailwind config
 * Generates all color shades from a single hex color
 */

function hexToHsl(hex) {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse hex values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function generateColorPalette(baseColor) {
  // Ensure we have a valid hex color
  if (!baseColor || !baseColor.match(/^#[0-9A-F]{6}$/i)) {
    console.warn("Invalid base color, using default:", baseColor);
    baseColor = "#3b82f6"; // Default blue
  }

  const [h, s, l] = hexToHsl(baseColor);

  // Generate Tailwind-style color palette
  return {
    DEFAULT: baseColor,
    50: hslToHex(h, Math.max(s - 20, 10), Math.min(l + 45, 95)),
    100: hslToHex(h, Math.max(s - 15, 15), Math.min(l + 40, 90)),
    200: hslToHex(h, Math.max(s - 10, 20), Math.min(l + 30, 85)),
    300: hslToHex(h, Math.max(s - 5, 25), Math.min(l + 20, 75)),
    400: hslToHex(h, s, Math.min(l + 10, 65)),
    500: baseColor, // This is the main color
    600: hslToHex(h, Math.min(s + 5, 90), Math.max(l - 10, 25)),
    700: hslToHex(h, Math.min(s + 10, 95), Math.max(l - 20, 20)),
    800: hslToHex(h, Math.min(s + 15, 100), Math.max(l - 30, 15)),
    900: hslToHex(h, Math.min(s + 20, 100), Math.max(l - 40, 10)),
    950: hslToHex(h, Math.min(s + 25, 100), Math.max(l - 50, 5)),
  };
}
