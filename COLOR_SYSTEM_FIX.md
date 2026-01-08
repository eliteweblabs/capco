# Color System Fix - Multi-Client Support

## Problem Identified

The color system had hardcoded fallback values that prevented proper multi-client customization:

1. **Secondary color was hardcoded** in `tailwind.config.mjs` (not reading from env vars)
2. **Button gradient was hardcoded** with specific color values
3. Colors would fall back to defaults (`#825BDD`, `#0ea5e9`) when env vars weren't set

## Changes Made

### 1. Fixed `tailwind.config.mjs`

**Before:**
```javascript
const primaryColor = process.env.GLOBAL_COLOR_PRIMARY || "#825BDD";
// Secondary color was hardcoded in the colors object
secondary: {
  500: "#0ea5e9", // Hardcoded!
  // ...
}
```

**After:**
```javascript
const primaryColor = process.env.GLOBAL_COLOR_PRIMARY || "#825BDD";
const secondaryColor = process.env.GLOBAL_COLOR_SECONDARY || "#0ea5e9";

const primaryColorPalette = generateColorPalette(primaryColor);
const secondaryColorPalette = generateColorPalette(secondaryColor);

// Now uses dynamic palette
secondary: secondaryColorPalette,
```

### 2. Fixed Button Gradient

**Before:**
```javascript
"btn-gradient": "linear-gradient(to right, #825BDD, #5327BA)", // Hardcoded
```

**After:**
```javascript
"btn-gradient": `linear-gradient(to right, ${primaryColorPalette[500]}, ${primaryColorPalette[700]})`, // Dynamic
```

## How It Works Now

1. **Build time**: `tailwind.config.mjs` reads `GLOBAL_COLOR_PRIMARY` and `GLOBAL_COLOR_SECONDARY` from environment variables
2. **Color generation**: Both colors generate full palettes (50-950 shades) automatically
3. **Fallback**: If env vars aren't set, uses defaults (`#825BDD` for primary, `#0ea5e9` for secondary)
4. **CSS generation**: `scripts/generate-colors.js` also reads env vars and generates `src/styles/colors.css`

## Required Environment Variables

For each client deployment, set these in Railway:

```bash
GLOBAL_COLOR_PRIMARY="#825BDD"      # Main brand color (hex)
GLOBAL_COLOR_SECONDARY="#0ea5e9"    # Secondary brand color (hex)
```

## Testing Locally

1. Create a `.env` file:
```bash
GLOBAL_COLOR_PRIMARY="#FF0000"
GLOBAL_COLOR_SECONDARY="#00FF00"
```

2. Run the color generation:
```bash
npm run generate-colors
```

3. Check `src/styles/colors.css` - it should show your custom colors

4. Build and verify:
```bash
npm run build
```

## Verification Checklist

- [ ] `GLOBAL_COLOR_PRIMARY` is set in Railway
- [ ] `GLOBAL_COLOR_SECONDARY` is set in Railway
- [ ] Build logs show: `🎨 [TAILWIND] Using primary color: #YOUR_COLOR`
- [ ] Build logs show: `🎨 [TAILWIND] Using secondary color: #YOUR_COLOR`
- [ ] Colors appear correctly in the deployed site

## Important Notes

- Colors are generated at **build time**, not runtime
- If you change colors in Railway, you need to **redeploy** for changes to take effect
- The `generate-colors` script runs automatically during `npm run build` and `npm run build:railway`
- Default colors (`#825BDD`, `#0ea5e9`) are only used if env vars are not set

