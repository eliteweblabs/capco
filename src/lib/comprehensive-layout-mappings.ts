// Comprehensive Layout Class Mapping - Generated from obfuscated.css
// Maps obfuscated class names to their corresponding Tailwind CSS layout classes
// Focus on layout properties only (excluding colors)
// Generated on: 2025-10-06T16:54:00.000Z

export const comprehensiveLayoutMappings = {
  // Visibility
  W4ZbYGNsrIdquBSInLRP: "collapse",

  // Position
  Wb7_kpRwKZR5nS8FSfqY: "bottom-6", // bottom: 1.5rem
  WtybE6QXotwQ7CRR7j5E: "rounded-tl-xl", // border-end-start-radius: 0.75rem

  // Border radius
  W5n_NSFnC6y2nqoHw_5x: "rounded-md", // border-radius: 0.375rem

  // Border width
  WLibwhDKgps6unDTx3Tu: "border-b-2", // border-bottom-width: 2px

  // Padding
  WRGBwx7chjo_Yl4BG16j: "pe-4", // padding-inline-end: 1rem

  // Text decoration
  W_sCP6_PDfz0Lqf875WU: "underline", // text-decoration-line: underline

  // Additional mappings found in the CSS file
  // (These would need to be manually identified from the full CSS analysis)

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
};

// Reverse mapping for easy lookup
export const reverseComprehensiveMappings = Object.fromEntries(
  Object.entries(comprehensiveLayoutMappings).map(([key, value]) => [value, key])
);

// Helper function to get Tailwind classes for an obfuscated class
export function getComprehensiveTailwindClasses(obfuscatedClass: string): string | null {
  return comprehensiveLayoutMappings[obfuscatedClass] || null;
}

// Helper function to find obfuscated class for Tailwind classes
export function getComprehensiveObfuscatedClass(tailwindClasses: string): string | null {
  return reverseComprehensiveMappings[tailwindClasses] || null;
}

// Helper function to get all available mappings
export function getAllLayoutMappings(): Record<string, string> {
  return comprehensiveLayoutMappings;
}

// Helper function to search for classes by partial match
export function searchLayoutMappings(searchTerm: string): Record<string, string> {
  const results: Record<string, string> = {};

  Object.entries(comprehensiveLayoutMappings).forEach(([obfuscated, tailwind]) => {
    if (
      obfuscated.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tailwind.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      results[obfuscated] = tailwind;
    }
  });

  return results;
}

// Total mappings: 25
export const TOTAL_MAPPINGS = Object.keys(comprehensiveLayoutMappings).length;
