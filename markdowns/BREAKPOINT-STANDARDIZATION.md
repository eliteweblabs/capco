# Breakpoint Standardization Guide

## Overview

This document explains the standardized breakpoint system and identifies files that need to be updated for consistency.

## Breakpoint Constants

All breakpoints are now defined in `/src/lib/ux-utils.ts`:

```typescript
export const BREAKPOINTS = {
  SM: 640, // Tailwind sm: breakpoint
  MD: 768, // Tailwind md: breakpoint (standard mobile/desktop distinction)
  LG: 1024, // Tailwind lg: breakpoint
  XL: 1280, // Tailwind xl: breakpoint
  "2XL": 1536, // Tailwind 2xl: breakpoint
} as const;
```

## Utility Functions

### Standard Mobile Detection (768px - md breakpoint)

Use `isMobile()` for general mobile/desktop distinction:

```typescript
import { isMobile } from "../../lib/ux-utils";

if (isMobile()) {
  // Mobile-specific code (< 768px)
}
```

### Small Mobile Detection (640px - sm breakpoint)

Use `isSmallMobile()` for components that use `sm:` Tailwind classes:

```typescript
import { isSmallMobile } from "../../lib/ux-utils";

if (isSmallMobile()) {
  // Small mobile-specific code (< 640px)
  // Use this when your component uses sm: Tailwind classes
}
```

### Other Utilities

- `isTablet()`: 768px ≤ width < 1024px
- `isDesktop()`: width ≥ 1024px
- `getViewportSize()`: Returns 'mobile' | 'tablet' | 'desktop'

## When to Use Which Function

| Component Uses                   | Function to Use   | Reason                        |
| -------------------------------- | ----------------- | ----------------------------- |
| `sm:` classes (e.g., `sm:ml-64`) | `isSmallMobile()` | Matches sm breakpoint (640px) |
| `md:` classes (e.g., `md:block`) | `isMobile()`      | Matches md breakpoint (768px) |
| General mobile/desktop           | `isMobile()`      | Standard distinction at 768px |

## Files That Need Updating

### ✅ Already Updated

1. `/src/lib/ux-utils.ts` - Added BREAKPOINTS constant and isSmallMobile()
2. `/src/components/ui/ToggleSidebar.astro` - Now uses isSmallMobile() and imports from ux-utils

### 🔄 Files with Hardcoded Breakpoints (Need Review)

These files have hardcoded breakpoint checks that should potentially use the utility functions:

1. **`/src/components/ui/App.astro`** (Lines 1422, 1435, 1439, 1447, 1542, 1545)
   - Currently defines its own window.isMobile() functions at 768px
   - These are exposed as global window functions
   - Decision needed: Should these delegate to ux-utils functions?

2. **`/src/components/form/SlotMachineModalStaff.astro`** (Line 1316)
   - `const itemHeight = window.innerWidth <= 768 ? 56 : 48;`
   - Should use: `const itemHeight = isMobile() ? 56 : 48;`

3. **`/src/components/form/SlotMachineModal.astro`** (Line 1119)
   - `const itemHeight = window.innerWidth <= 768 ? 56 : 48;`
   - Should use: `const itemHeight = isMobile() ? 56 : 48;`

4. **`/src/components/form/SlotMachineModalFunction.astro`** (Line 1494)
   - `const itemHeight = window.innerWidth <= 768 ? 56 : 48;`
   - Should use: `const itemHeight = isMobile() ? 56 : 48;`

5. **`/src/components/ui/AdaptiveVideoPlayer.astro`** (Line 136)
   - `const isMobile = isAnyMobile ? isAnyMobile() : window.innerWidth < 768;`
   - Should import and use isMobile() from ux-utils

## Implementation Plan

### Phase 1: Update SlotMachine Components

Replace hardcoded breakpoint checks with `isMobile()` function in:

- SlotMachineModalStaff.astro
- SlotMachineModal.astro
- SlotMachineModalFunction.astro

### Phase 2: Update AdaptiveVideoPlayer

Import and use the global `isMobile()` function.

### Phase 3: Consolidate App.astro Global Functions

Decide whether to:

- Option A: Have App.astro import and re-export ux-utils functions
- Option B: Keep App.astro functions but have them delegate to ux-utils
- Option C: Remove App.astro functions and update all consumers to use ux-utils

### Phase 4: Documentation

Update cursor rules and documentation to mandate use of ux-utils functions.

## Benefits

1. **Single Source of Truth**: All breakpoints defined in one place
2. **Easy Updates**: Change breakpoint values in one location
3. **Type Safety**: TypeScript ensures correct usage
4. **Consistency**: All components use the same breakpoint logic
5. **Maintainability**: Easier to track and update breakpoint-related code

## Rules Going Forward

1. ❌ **DO NOT** use hardcoded breakpoint checks like `window.innerWidth < 640`
2. ✅ **DO** import and use functions from `/src/lib/ux-utils.ts`
3. ✅ **DO** use `isSmallMobile()` for components with `sm:` classes
4. ✅ **DO** use `isMobile()` for general mobile/desktop distinction
5. ✅ **DO** add new breakpoint utilities to `ux-utils.ts` if needed

## Testing Checklist

After updates, test at these widths:

- [ ] 320px (small mobile)
- [ ] 639px (just below sm breakpoint)
- [ ] 640px (sm breakpoint)
- [ ] 767px (just below md breakpoint)
- [ ] 768px (md breakpoint)
- [ ] 1023px (just below lg breakpoint)
- [ ] 1024px (lg breakpoint)

## Related Files

- `/src/lib/ux-utils.ts` - Breakpoint constants and utility functions
- `tailwind.config.mjs` - Tailwind breakpoint configuration
- `/src/components/ui/ToggleSidebar.astro` - Example of correct usage
