// Layout Class Mapping - Generated from obfuscated.css
// Maps obfuscated class names to their corresponding Tailwind CSS layout classes
// Generated on: 2025-10-06T16:53:43.192Z

export const layoutClassMappings = {
  "W4ZbYGNsrIdquBSInLRP": "collapse",
  "Wb7_kpRwKZR5nS8FSfqY": "bottom-6",
  "W5n_NSFnC6y2nqoHw_5x": "rounded-md",
  "WLibwhDKgps6unDTx3Tu": "border-b-2",
  "WRGBwx7chjo_Yl4BG16j": "pe-4",
  "W_sCP6_PDfz0Lqf875WU": "underline"
};

// Reverse mapping for easy lookup
export const reverseLayoutMappings = Object.fromEntries(
  Object.entries(layoutClassMappings).map(([key, value]) => [value, key])
);

// Helper function to get Tailwind classes for an obfuscated class
export function getTailwindClasses(obfuscatedClass: string): string | null {
  return layoutClassMappings[obfuscatedClass] || null;
}

// Helper function to find obfuscated class for Tailwind classes
export function getObfuscatedClass(tailwindClasses: string): string | null {
  return reverseLayoutMappings[tailwindClasses] || null;
}

// Total mappings found: 6
