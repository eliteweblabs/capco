# Responsive Layout Class Mapping Usage

This enhanced mapping system supports responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) in addition to base layout classes.

## Files

- `enhanced-responsive-mappings.ts` - Enhanced mappings with responsive support (25+ classes)
- `comprehensive-layout-mappings.ts` - Basic mappings without responsive prefixes
- `layout-class-mappings.ts` - Auto-generated basic mappings

## Key Features

### ✅ **Responsive Support**

The enhanced mapping system now supports responsive breakpoints:

```typescript
// Example: A class that has different values at different breakpoints
fE3pmEmw8F30VPtAqcha: "max-w-sm sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl";
```

### ✅ **Your Specific Class**

The class you mentioned (`W0cenyZF9cRiC_vsa2iB`) is now mapped:

```typescript
W0cenyZF9cRiC_vsa2iB: "h-full"; // height: 100%
```

## Usage Examples

### Basic Usage

```typescript
import { getEnhancedResponsiveClasses } from "./enhanced-responsive-mappings";

// Get Tailwind classes for an obfuscated class
const tailwindClasses = getEnhancedResponsiveClasses("W0cenyZF9cRiC_vsa2iB");
console.log(tailwindClasses); // "h-full"

// Get responsive classes
const responsiveClasses = getEnhancedResponsiveClasses("fE3pmEmw8F30VPtAqcha");
console.log(responsiveClasses); // "max-w-sm sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
```

### Responsive Class Handling

```typescript
import {
  getEnhancedResponsiveClasses,
  searchEnhancedMappings,
  getAllEnhancedMappings,
} from "./enhanced-responsive-mappings";

// Check if a class has responsive variants
function hasResponsiveVariants(obfuscatedClass: string): boolean {
  const tailwindClasses = getEnhancedResponsiveClasses(obfuscatedClass);
  return (
    tailwindClasses?.includes("sm:") ||
    tailwindClasses?.includes("md:") ||
    tailwindClasses?.includes("lg:") ||
    tailwindClasses?.includes("xl:") ||
    tailwindClasses?.includes("2xl:") ||
    false
  );
}

// Extract responsive breakpoints from a class
function extractResponsiveBreakpoints(obfuscatedClass: string): string[] {
  const tailwindClasses = getEnhancedResponsiveClasses(obfuscatedClass);
  if (!tailwindClasses) return [];

  const breakpoints = [];
  if (tailwindClasses.includes("sm:")) breakpoints.push("sm");
  if (tailwindClasses.includes("md:")) breakpoints.push("md");
  if (tailwindClasses.includes("lg:")) breakpoints.push("lg");
  if (tailwindClasses.includes("xl:")) breakpoints.push("xl");
  if (tailwindClasses.includes("2xl:")) breakpoints.push("2xl");

  return breakpoints;
}

// Example usage
const hasResponsive = hasResponsiveVariants("fE3pmEmw8F30VPtAqcha");
console.log(hasResponsive); // true

const breakpoints = extractResponsiveBreakpoints("fE3pmEmw8F30VPtAqcha");
console.log(breakpoints); // ['sm', 'md', 'lg', 'xl', '2xl']
```

### HTML Processing with Responsive Support

```typescript
import { getAllEnhancedMappings } from "./enhanced-responsive-mappings";

function processHtmlWithResponsiveMappings(html: string): string {
  const allMappings = getAllEnhancedMappings();
  let processedHtml = html;

  Object.entries(allMappings).forEach(([obfuscated, tailwind]) => {
    // Replace obfuscated classes with Tailwind classes (including responsive)
    const regex = new RegExp(`\\b${obfuscated}\\b`, "g");
    processedHtml = processedHtml.replace(regex, tailwind);
  });

  return processedHtml;
}

// Example usage
const html = '<div class="W0cenyZF9cRiC_vsa2iB fE3pmEmw8F30VPtAqcha">Content</div>';
const processedHtml = processHtmlWithResponsiveMappings(html);
console.log(processedHtml);
// Output: '<div class="h-full max-w-sm sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl">Content</div>'
```

## Available Mappings

### Base Classes (No Responsive Prefix)

- `W0cenyZF9cRiC_vsa2iB` → `h-full` (height: 100%)
- `W4ZbYGNsrIdquBSInLRP` → `collapse` (visibility: collapse)
- `W5n_NSFnC6y2nqoHw_5x` → `rounded-md` (border-radius: 0.375rem)
- `Wb7_kpRwKZR5nS8FSfqY` → `bottom-6` (bottom: 1.5rem)

### Responsive Classes (With Breakpoint Prefixes)

- `fE3pmEmw8F30VPtAqcha` → `max-w-sm sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl`

### Position Classes

- `smkr9JarUQxXDNNOXpIs` → `static`
- `_LPVUrp9Uina5fcERqWC` → `fixed`
- `pq2JRWtiWcwYnw3xueNl` → `absolute`

### Border Classes

- `WLibwhDKgps6unDTx3Tu` → `border-b-2`
- `pXhVRBC8yaUNllmIWxln` → `border`
- `Rs29k0QlZDWrTdHyss4k` → `rounded-none`

### Padding Classes

- `WRGBwx7chjo_Yl4BG16j` → `pe-4`
- `phuq9OcM4E3Gy9MJy0RC` → `pl-10`
- `aa_y6SeayB9fNgBD5ROa` → `pl-3`

## Responsive Breakpoints

The system supports all standard Tailwind breakpoints:

- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up
- `2xl:` - 1536px and up

## Example: Converting HTML

```html
<!-- Before (using obfuscated classes) -->
<div class="W0cenyZF9cRiC_vsa2iB fE3pmEmw8F30VPtAqcha W5n_NSFnC6y2nqoHw_5x">Content</div>

<!-- After (using Tailwind classes with responsive support) -->
<div
  class="h-full max-w-sm rounded-md sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
>
  Content
</div>
```

## Notes

- **Responsive classes** are identified by the presence of breakpoint prefixes (`sm:`, `md:`, etc.)
- **Base classes** have no responsive prefixes and apply at all screen sizes
- **Media queries** in the CSS file are converted to responsive Tailwind classes
- **Color properties** are excluded as requested (focus on layout only)
- **Bidirectional conversion** is supported (obfuscated ↔ Tailwind)

## Statistics

- **Total Mappings:** 25+ classes
- **Responsive Classes:** 1+ classes with breakpoint prefixes
- **Base Classes:** 24+ classes without responsive prefixes
- **Categories:** Position, Border, Padding, Text, Visibility, Responsive
