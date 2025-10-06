// Enhanced Responsive Layout Class Mapping - Generated from obfuscated.css
// Maps obfuscated class names to their corresponding Tailwind CSS layout classes
// Includes support for responsive breakpoints (sm:, md:, lg:, xl:, 2xl:)
// Generated on: 2025-10-06T16:57:08.059Z

export const enhancedResponsiveMappings = {
  // Base classes (no responsive prefix)
  W0cenyZF9cRiC_vsa2iB: "h-full", // height: 100% - This is the class you mentioned!
  W4ZbYGNsrIdquBSInLRP: "collapse", // visibility: collapse
  W5n_NSFnC6y2nqoHw_5x: "rounded-md", // border-radius: 0.375rem
  Wb7_kpRwKZR5nS8FSfqY: "bottom-6", // bottom: 1.5rem
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

  // Responsive classes (these would be identified from media queries)
  // Note: The CSS file uses media queries but doesn't use sm:, md: prefixes
  // Instead, it uses different class names for different breakpoints
  fE3pmEmw8F30VPtAqcha: "max-w-sm sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl", // max-width responsive

  // Additional responsive examples (these would need to be manually identified)
  // For example, if there's a class that has different values at different breakpoints:
  // responsiveClass: "base-class sm:sm-class md:md-class lg:lg-class"
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
export function getEnhancedResponsiveClasses(obfuscatedClass: string): string | null {
  return enhancedResponsiveMappings[obfuscatedClass] || null;
}

// Function to get all enhanced mappings
export function getAllEnhancedMappings(): Record<string, string> {
  return enhancedResponsiveMappings;
}

// Function to search enhanced mappings
export function searchEnhancedMappings(searchTerm: string): Record<string, string> {
  const results: Record<string, string> = {};

  Object.entries(enhancedResponsiveMappings).forEach(([obfuscated, tailwind]) => {
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
export const TOTAL_ENHANCED_MAPPINGS = Object.keys(enhancedResponsiveMappings).length;
