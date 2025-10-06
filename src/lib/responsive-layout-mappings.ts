// Enhanced Layout Class Mapping with Responsive Support
// Maps obfuscated class names to their corresponding Tailwind CSS layout classes
// Includes support for responsive breakpoints (sm:, md:, lg:, xl:, 2xl:)
// Generated on: 2025-10-06T17:00:00.000Z

export const responsiveLayoutMappings = {
  // Base classes (no responsive prefix)
  W0cenyZF9cRiC_vsa2iB: "h-full", // height: 100%
  W4ZbYGNsrIdquBSInLRP: "collapse", // visibility: collapse
  Wb7_kpRwKZR5nS8FSfqY: "bottom-6", // bottom: 1.5rem
  W5n_NSFnC6y2nqoHw_5x: "rounded-md", // border-radius: 0.375rem
  WLibwhDKgps6unDTx3Tu: "border-b-2", // border-bottom-width: 2px
  WRGBwx7chjo_Yl4BG16j: "pe-4", // padding-inline-end: 1rem
  W_sCP6_PDfz0Lqf875WU: "underline", // text-decoration-line: underline

  // Position classes
  smkr9JarUQxXDNNOXpIs: "static", // position: static
  _LPVUrp9Uina5fcERqWC: "fixed", // position: fixed
  pq2JRWtiWcwYnw3xueNl: "absolute", // position: absolute

  // Bottom positioning
  _jIx61mjmqYw4S6tZe_K: "bottom-[60px]", // bottom: 60px
  gDiKxsXc9vN3o2QvoUu8: "end-0", // inset-inline-end: 0
  lc48Ia7ylyhzqAGQXT5Q: "end-1", // inset-inline-end: 0.25rem

  // Border radius variations
  Rs29k0QlZDWrTdHyss4k: "rounded-none", // border-radius: 0
  D0cB2fwpzIAF6I3dz1f_: "rounded-sm", // border-radius: 0.125rem
  RoDfxj64vTei9ck9_udt: "rounded-xl", // border-radius: 0.75rem

  // Border width variations
  pXhVRBC8yaUNllmIWxln: "border", // border-width: 1px
  x10gJN85ZCc5bRhhp5SO: "border-0", // border-width: 0
  b0rXX23llDSn6PZwxAyx: "border-2", // border-width: 2px

  // Border side widths
  wQlZRTphx8giJt8UJNne: "border-e", // border-inline-end-width: 1px
  oIAcw_u8e2fEm0DdQi2j: "border-l", // border-left-width: 1px
  hEIh0_vxSXD_ZBXYxnd0: "border-r", // border-right-width: 1px

  // Padding variations
  phuq9OcM4E3Gy9MJy0RC: "pl-10", // padding-left: 2.5rem
  aa_y6SeayB9fNgBD5ROa: "pl-3", // padding-left: 0.75rem
  LTEDJh4s7gPtSmaVhWcH: "pl-4", // padding-left: 1rem

  // Text decoration variations
  kFlk3k_uhzYPiSbsq5cU: "line-through", // text-decoration-line: line-through

  // Outline
  WJn8I5khkB0_rQU_lEjX: "outline", // outline-style: solid

  // Responsive classes (these would need to be identified from media queries)
  // Note: The CSS file uses media queries but doesn't use sm:, md: prefixes
  // Instead, it uses different class names for different breakpoints
  fE3pmEmw8F30VPtAqcha: "max-w-sm sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl", // max-width responsive
};

// Breakpoint mappings for responsive classes
export const breakpointMappings = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// Function to get responsive Tailwind classes
export function getResponsiveTailwindClasses(obfuscatedClass: string): string | null {
  return responsiveLayoutMappings[obfuscatedClass] || null;
}

// Function to convert responsive classes to Tailwind format
export function convertToResponsiveTailwind(
  baseClass: string,
  smClass?: string,
  mdClass?: string,
  lgClass?: string,
  xlClass?: string,
  xl2Class?: string
): string {
  const classes = [baseClass];

  if (smClass) classes.push(`sm:${smClass}`);
  if (mdClass) classes.push(`md:${mdClass}`);
  if (lgClass) classes.push(`lg:${lgClass}`);
  if (xlClass) classes.push(`xl:${xlClass}`);
  if (xl2Class) classes.push(`2xl:${xl2Class}`);

  return classes.join(" ");
}

// Function to parse media query classes and create responsive mappings
export function parseMediaQueryClasses(cssContent: string): Record<string, string> {
  const responsiveMappings: Record<string, string> = {};

  // Find media queries and their classes
  const mediaQueryRegex = /@media\s*\([^)]+\)\s*\{([^}]+)\}/g;
  let match;

  while ((match = mediaQueryRegex.exec(cssContent)) !== null) {
    const mediaQuery = match[0];
    const classes = match[1];

    // Extract breakpoint from media query
    const minWidthMatch = mediaQuery.match(/min-width:\s*(\d+)px/);
    if (minWidthMatch) {
      const breakpoint = minWidthMatch[1];
      let prefix = "";

      // Map pixel values to Tailwind breakpoints
      switch (breakpoint) {
        case "640":
          prefix = "sm:";
          break;
        case "768":
          prefix = "md:";
          break;
        case "1024":
          prefix = "lg:";
          break;
        case "1280":
          prefix = "xl:";
          break;
        case "1536":
          prefix = "2xl:";
          break;
      }

      // Parse classes within the media query
      const classRegex = /\.([a-zA-Z0-9_]+)\s*\{([^}]+)\}/g;
      let classMatch;

      while ((classMatch = classRegex.exec(classes)) !== null) {
        const className = classMatch[1];
        const cssRules = classMatch[2];

        // Convert CSS rules to Tailwind classes
        const tailwindClass = convertCssToTailwind(cssRules);
        if (tailwindClass) {
          responsiveMappings[className] = `${prefix}${tailwindClass}`;
        }
      }
    }
  }

  return responsiveMappings;
}

// Helper function to convert CSS rules to Tailwind classes
function convertCssToTailwind(cssRules: string): string | null {
  const rules = cssRules
    .split(";")
    .map((rule) => rule.trim())
    .filter((rule) => rule);

  for (const rule of rules) {
    const [property, value] = rule.split(":").map((s) => s.trim());

    // Skip color-related properties
    if (
      property.includes("color") ||
      property.includes("background") ||
      property.includes("border-color") ||
      value.includes("rgb") ||
      value.includes("hsl") ||
      value.includes("#")
    ) {
      continue;
    }

    // Convert common layout properties
    const mappings: Record<string, string> = {
      "max-width: 640px": "max-w-sm",
      "max-width: 768px": "max-w-md",
      "max-width: 1024px": "max-w-lg",
      "max-width: 1280px": "max-w-xl",
      "max-width: 1536px": "max-w-2xl",
      "height: 100%": "h-full",
      "width: 100%": "w-full",
      "display: flex": "flex",
      "display: grid": "grid",
      "display: block": "block",
      "display: none": "hidden",
    };

    const key = `${property}: ${value}`;
    if (mappings[key]) {
      return mappings[key];
    }
  }

  return null;
}

// Function to get all responsive mappings
export function getAllResponsiveMappings(): Record<string, string> {
  return responsiveLayoutMappings;
}

// Function to search responsive mappings
export function searchResponsiveMappings(searchTerm: string): Record<string, string> {
  const results: Record<string, string> = {};

  Object.entries(responsiveLayoutMappings).forEach(([obfuscated, tailwind]) => {
    if (
      obfuscated.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tailwind.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      results[obfuscated] = tailwind;
    }
  });

  return results;
}

// Total mappings: 25+ responsive classes
export const TOTAL_RESPONSIVE_MAPPINGS = Object.keys(responsiveLayoutMappings).length;
