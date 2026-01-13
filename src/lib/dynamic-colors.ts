/**
 * Dynamic Color Injection
 * Injects CSS color variables at runtime based on database colors
 * This allows color changes to take effect immediately without rebuild
 */

/**
 * Generate a complete Tailwind color palette from a base hex color
 */
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

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
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateColorPalette(baseColor: string): Record<string | number, string> {
  // Ensure we have a valid hex color
  if (!baseColor || !baseColor.match(/^#[0-9A-F]{6}$/i)) {
    console.warn("[dynamic-colors] Invalid base color, using default:", baseColor);
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

/**
 * Inject color CSS variables into the document root
 * This updates colors dynamically without requiring a rebuild
 */
export function injectDynamicColors(primaryColor: string, secondaryColor: string) {
  if (typeof window === "undefined") {
    return; // SSR check
  }

  console.log("[dynamic-colors] Injecting colors:", { primaryColor, secondaryColor });

  const primaryPalette = generateColorPalette(primaryColor);
  const secondaryPalette = generateColorPalette(secondaryColor);

  const root = document.documentElement;

  // Set primary color CSS variables
  Object.entries(primaryPalette).forEach(([shade, color]) => {
    root.style.setProperty(`--color-primary-${shade}`, color);
  });

  // Set secondary color CSS variables
  Object.entries(secondaryPalette).forEach(([shade, color]) => {
    root.style.setProperty(`--color-secondary-${shade}`, color);
  });

  console.log("[dynamic-colors] ✅ Colors injected successfully");
}
