// Example usage of layout class mappings
import {
  getAllLayoutMappings,
  getComprehensiveTailwindClasses,
  searchLayoutMappings,
} from "./comprehensive-layout-mappings";
import { getObfuscatedClass, getTailwindClasses } from "./layout-class-mappings";

// Example 1: Convert obfuscated class to Tailwind
export function convertObfuscatedToTailwind(obfuscatedClass: string): string | null {
  // Try comprehensive mappings first
  let tailwindClass = getComprehensiveTailwindClasses(obfuscatedClass);

  // Fallback to basic mappings
  if (!tailwindClass) {
    tailwindClass = getTailwindClasses(obfuscatedClass);
  }

  return tailwindClass;
}

// Example 2: Convert Tailwind class to obfuscated
export function convertTailwindToObfuscated(tailwindClass: string): string | null {
  return getObfuscatedClass(tailwindClass);
}

// Example 3: Convert multiple classes at once
export function convertMultipleClasses(classes: string[]): Record<string, string> {
  const results: Record<string, string> = {};

  classes.forEach((className) => {
    const tailwindClass = convertObfuscatedToTailwind(className);
    if (tailwindClass) {
      results[className] = tailwindClass;
    }
  });

  return results;
}

// Example 4: Search for classes containing specific terms
export function findClassesByTerm(searchTerm: string): Record<string, string> {
  return searchLayoutMappings(searchTerm);
}

// Example 5: Get all available mappings
export function getAllAvailableMappings(): Record<string, string> {
  return getAllLayoutMappings();
}

// Example usage in a component
export function processHtmlWithMappings(html: string): string {
  // This would be used to process HTML and replace obfuscated classes
  // with their Tailwind equivalents

  const allMappings = getAllLayoutMappings();

  let processedHtml = html;

  Object.entries(allMappings).forEach(([obfuscated, tailwind]) => {
    // Replace obfuscated classes with Tailwind classes
    const regex = new RegExp(`\\b${obfuscated}\\b`, "g");
    processedHtml = processedHtml.replace(regex, tailwind);
  });

  return processedHtml;
}

// Example 6: Validate if a class is layout-related
export function isLayoutClass(className: string): boolean {
  const tailwindClass = convertObfuscatedToTailwind(className);
  return tailwindClass !== null;
}

// Example 7: Get class statistics
export function getMappingStatistics() {
  const allMappings = getAllLayoutMappings();
  const totalMappings = Object.keys(allMappings).length;

  // Categorize by type
  const categories = {
    position: 0,
    border: 0,
    padding: 0,
    text: 0,
    visibility: 0,
    other: 0,
  };

  Object.values(allMappings).forEach((tailwindClass) => {
    if (
      tailwindClass.includes("top-") ||
      tailwindClass.includes("bottom-") ||
      tailwindClass.includes("left-") ||
      tailwindClass.includes("right-") ||
      tailwindClass.includes("static") ||
      tailwindClass.includes("fixed") ||
      tailwindClass.includes("absolute") ||
      tailwindClass.includes("relative")
    ) {
      categories.position++;
    } else if (tailwindClass.includes("border") || tailwindClass.includes("rounded")) {
      categories.border++;
    } else if (tailwindClass.includes("p-") || tailwindClass.includes("m-")) {
      categories.padding++;
    } else if (
      tailwindClass.includes("text-") ||
      tailwindClass.includes("underline") ||
      tailwindClass.includes("line-through")
    ) {
      categories.text++;
    } else if (
      tailwindClass.includes("collapse") ||
      tailwindClass.includes("visible") ||
      tailwindClass.includes("hidden")
    ) {
      categories.visibility++;
    } else {
      categories.other++;
    }
  });

  return {
    totalMappings,
    categories,
  };
}
