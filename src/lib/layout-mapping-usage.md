# Layout Class Mapping Usage

This file contains mappings from obfuscated CSS class names to their corresponding Tailwind CSS layout classes.

## Files

- `layout-class-mappings.ts` - Auto-generated basic mappings (6 classes)
- `comprehensive-layout-mappings.ts` - Manual comprehensive mappings (25 classes)

## Usage Examples

### Basic Usage

```typescript
import { getTailwindClasses, getObfuscatedClass } from "./layout-class-mappings";
import { getComprehensiveTailwindClasses } from "./comprehensive-layout-mappings";

// Get Tailwind classes for an obfuscated class
const tailwindClasses = getTailwindClasses("W4ZbYGNsrIdquBSInLRP");
console.log(tailwindClasses); // "collapse"

// Get obfuscated class for Tailwind classes
const obfuscatedClass = getObfuscatedClass("collapse");
console.log(obfuscatedClass); // "W4ZbYGNsrIdquBSInLRP"
```

### Comprehensive Usage

```typescript
import {
  getComprehensiveTailwindClasses,
  searchLayoutMappings,
  getAllLayoutMappings,
} from "./comprehensive-layout-mappings";

// Get all mappings
const allMappings = getAllLayoutMappings();
console.log(allMappings);

// Search for specific classes
const searchResults = searchLayoutMappings("border");
console.log(searchResults);
// Returns: { "WLibwhDKgps6unDTx3Tu": "border-b-2", ... }
```

## Available Mappings

### Position Classes

- `Wb7_kpRwKZR5nS8FSfqY` → `bottom-6`
- `smkr9JarUQxXDNNOXpIs` → `static`
- `_LPVUrp9Uina5fcERqWC` → `fixed`
- `pq2JRWtiWcwYnw3xueNl` → `absolute`

### Border Classes

- `W5n_NSFnC6y2nqoHw_5x` → `rounded-md`
- `WLibwhDKgps6unDTx3Tu` → `border-b-2`
- `pXhVRBC8yaUNllmIWxln` → `border`
- `x10gJN85ZCc5bRhhp5SO` → `border-0`

### Padding Classes

- `WRGBwx7chjo_Yl4BG16j` → `pe-4`
- `phuq9OcM4E3Gy9MJy0RC` → `pl-10`
- `aa_y6SeayB9fNgBD5ROa` → `pl-3`

### Text Classes

- `W_sCP6_PDfz0Lqf875WU` → `underline`
- `kFlk3k_uhzYPiSbsq5cU` → `line-through`

### Visibility Classes

- `W4ZbYGNsrIdquBSInLRP` → `collapse`

## Notes

- These mappings focus on **layout properties only** (excluding colors)
- The comprehensive mappings include manually identified classes from the CSS file
- Use the search function to find classes by partial match
- All mappings are bidirectional (can convert both ways)

## Example: Converting HTML

```html
<!-- Before (using obfuscated classes) -->
<div class="W4ZbYGNsrIdquBSInLRP Wb7_kpRwKZR5nS8FSfqY W5n_NSFnC6y2nqoHw_5x">Content</div>

<!-- After (using Tailwind classes) -->
<div class="collapse bottom-6 rounded-md">Content</div>
```
