/**
 * Font configuration for primary, secondary, and tertiary font selection.
 * Used by settings.astro, DynamicColorsAndFonts.astro, and Tailwind.
 * Handwritten fonts are grouped for easy discovery.
 */

export interface FontOption {
  value: string;
  label: string;
  /** Google Fonts URL for loading, or null for system fonts (sans-serif, serif, monospace) */
  googleUrl: string | null;
  /** When true, font is handwritten/cursive style */
  handwritten?: boolean;
}

/** System font options (no loading needed) */
const systemFonts: FontOption[] = [
  { value: "sans-serif", label: "sans-serif (System Default)", googleUrl: null },
  { value: "serif", label: "serif (System Default)", googleUrl: null },
  { value: "monospace", label: "monospace (System Default)", googleUrl: null },
];

/** Standard body/heading fonts */
const standardFonts: FontOption[] = [
  { value: "Outfit Variable", label: "Outfit Variable", googleUrl: null },
  { value: "Noto Serif Variable", label: "Noto Serif Variable", googleUrl: null },
  { value: "Roboto", label: "Roboto", googleUrl: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" },
  { value: "Open Sans", label: "Open Sans", googleUrl: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap" },
  { value: "Lato", label: "Lato", googleUrl: "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap" },
  { value: "Montserrat", label: "Montserrat", googleUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" },
  { value: "Poppins", label: "Poppins", googleUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" },
  { value: "Inter", label: "Inter", googleUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" },
  { value: "Raleway", label: "Raleway", googleUrl: "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700&display=swap" },
  { value: "Source Sans Pro", label: "Source Sans Pro", googleUrl: "https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap" },
  { value: "Nunito", label: "Nunito", googleUrl: "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap" },
  { value: "Playfair Display", label: "Playfair Display", googleUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" },
  { value: "Merriweather", label: "Merriweather", googleUrl: "https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap" },
  { value: "Oswald", label: "Oswald", googleUrl: "https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;600;700&display=swap" },
  { value: "Lora", label: "Lora", googleUrl: "https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap" },
  { value: "PT Sans", label: "PT Sans", googleUrl: "https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" },
  { value: "Ubuntu", label: "Ubuntu", googleUrl: "https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;700&display=swap" },
  { value: "Noto Sans", label: "Noto Sans", googleUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;600;700&display=swap" },
  { value: "Work Sans", label: "Work Sans", googleUrl: "https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;600;700&display=swap" },
  { value: "Crimson Text", label: "Crimson Text", googleUrl: "https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;700&display=swap" },
  { value: "Fira Sans", label: "Fira Sans", googleUrl: "https://fonts.googleapis.com/css2?family=Fira+Sans:wght@300;400;600;700&display=swap" },
  { value: "Bebas Neue", label: "Bebas Neue", googleUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" },
  { value: "Comfortaa", label: "Comfortaa", googleUrl: "https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;600;700&display=swap" },
  { value: "Quicksand", label: "Quicksand", googleUrl: "https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;600;700&display=swap" },
  { value: "Rubik", label: "Rubik", googleUrl: "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;600;700&display=swap" },
  { value: "Josefin Sans", label: "Josefin Sans", googleUrl: "https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&display=swap" },
  { value: "Libre Baskerville", label: "Libre Baskerville", googleUrl: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap" },
  { value: "Cabin", label: "Cabin", googleUrl: "https://fonts.googleapis.com/css2?family=Cabin:wght@400;600;700&display=swap" },
  { value: "Dosis", label: "Dosis", googleUrl: "https://fonts.googleapis.com/css2?family=Dosis:wght@300;400;600;700&display=swap" },
  { value: "Arvo", label: "Arvo", googleUrl: "https://fonts.googleapis.com/css2?family=Arvo:wght@400;700&display=swap" },
  { value: "Titillium Web", label: "Titillium Web", googleUrl: "https://fonts.googleapis.com/css2?family=Titillium+Web:wght@300;400;600;700&display=swap" },
  { value: "Mukta", label: "Mukta", googleUrl: "https://fonts.googleapis.com/css2?family=Mukta:wght@300;400;600;700&display=swap" },
  { value: "Karla", label: "Karla", googleUrl: "https://fonts.googleapis.com/css2?family=Karla:wght@300;400;600;700&display=swap" },
  { value: "Barlow", label: "Barlow", googleUrl: "https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;600;700&display=swap" },
  { value: "DM Sans", label: "DM Sans", googleUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap" },
  { value: "Manrope", label: "Manrope", googleUrl: "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;700&display=swap" },
  { value: "Space Grotesk", label: "Space Grotesk", googleUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans", googleUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap" },
];

/** Handwritten / cursive fonts */
const handwrittenFonts: FontOption[] = [
  { value: "Dancing Script", label: "Dancing Script", googleUrl: "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap", handwritten: true },
  { value: "Pacifico", label: "Pacifico", googleUrl: "https://fonts.googleapis.com/css2?family=Pacifico&display=swap", handwritten: true },
  { value: "Caveat", label: "Caveat", googleUrl: "https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap", handwritten: true },
  { value: "Permanent Marker", label: "Permanent Marker", googleUrl: "https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap", handwritten: true },
  { value: "Satisfy", label: "Satisfy", googleUrl: "https://fonts.googleapis.com/css2?family=Satisfy&display=swap", handwritten: true },
  { value: "Great Vibes", label: "Great Vibes", googleUrl: "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap", handwritten: true },
  { value: "Sacramento", label: "Sacramento", googleUrl: "https://fonts.googleapis.com/css2?family=Sacramento&display=swap", handwritten: true },
  { value: "Kalam", label: "Kalam", googleUrl: "https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap", handwritten: true },
  { value: "Patrick Hand", label: "Patrick Hand", googleUrl: "https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap", handwritten: true },
  { value: "Caveat Brush", label: "Caveat Brush", googleUrl: "https://fonts.googleapis.com/css2?family=Caveat+Brush&display=swap", handwritten: true },
  { value: "Shadows Into Light", label: "Shadows Into Light", googleUrl: "https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap", handwritten: true },
  { value: "Indie Flower", label: "Indie Flower", googleUrl: "https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap", handwritten: true },
];

/** All fonts for primary select (standard + handwritten, excluding Dancing Script from standard since it's in handwritten) */
const primaryFonts = [
  ...standardFonts,
  ...handwrittenFonts,
];

/** Fonts for secondary/tertiary (add system options) */
const secondaryAndTertiaryFonts = [
  ...systemFonts,
  ...primaryFonts,
];

/** Build fontConfigs map for DynamicColorsAndFonts (url by font name) */
export function getFontConfigsMap(): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  for (const f of [...standardFonts, ...handwrittenFonts]) {
    map[f.value] = f.googleUrl;
  }
  return map;
}

/** Get all fonts with Google URLs for preloading (e.g. on settings page) */
export function getFontsForSelect(): FontOption[] {
  return secondaryAndTertiaryFonts;
}

/** Get primary fonts only (no system) for primary font select */
export function getPrimaryFonts(): FontOption[] {
  return primaryFonts;
}

/** Inline style for option to display in its font */
export function getOptionStyle(fontValue: string): string {
  if (fontValue === "sans-serif" || fontValue === "serif" || fontValue === "monospace") {
    return `font-family: ${fontValue};`;
  }
  return `font-family: '${fontValue.replace(/'/g, "\\'")}', sans-serif;`;
}

/** Google Fonts URLs to preload all fonts (for settings page dropdown preview). Batched to avoid URL length limits. */
export function getFontPreloadUrls(): string[] {
  const fonts = [...standardFonts, ...handwrittenFonts].filter((f) => f.googleUrl);
  const encoded = fonts.map((f) => `family=${encodeURIComponent(f.value).replace(/%20/g, "+")}`);
  const batchSize = 8;
  const urls: string[] = [];
  for (let i = 0; i < encoded.length; i += batchSize) {
    const batch = encoded.slice(i, i + batchSize).join("&");
    urls.push(`https://fonts.googleapis.com/css2?${batch}&display=swap`);
  }
  return urls;
}
