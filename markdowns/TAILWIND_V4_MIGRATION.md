# Tailwind CSS v3 → v4 Migration Guide

## Overview

This guide will help you migrate from Tailwind CSS v3.4.1 (using `@astrojs/tailwind`) to Tailwind CSS v4.1.11 (using `@tailwindcss/vite`).

## ⚠️ Important Considerations

**Before starting:**
- This is a **major breaking change** - test thoroughly
- Flowbite compatibility with Tailwind v4 needs verification
- Your dynamic color generation system will need adaptation
- Consider doing this in a feature branch first

## Migration Steps

### Step 1: Update Dependencies

```bash
npm uninstall @astrojs/tailwind tailwindcss @tailwindcss/forms @tailwindcss/typography tailwindcss-animate
npm install tailwindcss@^4.1.11 @tailwindcss/vite@^4.1.11
npm install -D @tailwindcss/typography@^0.5.13
```

**Note:** `@tailwindcss/forms` and `tailwindcss-animate` may not be needed in v4, or may have different packages. Check compatibility.

### Step 2: Update Astro Config

**File: `astro.config.mjs`**

**Option A: Using Vite Plugin (Recommended for Astro)**
**Remove:**
```javascript
import tailwind from "@astrojs/tailwind";
// ...
integrations: [tailwind(), react()],
```

**Add:**
```javascript
import tailwindcss from '@tailwindcss/vite'
// ...
integrations: [react()], // Remove tailwind() from here
// ...
vite: {
  plugins: [tailwindcss()], // Add Tailwind as Vite plugin
  define: {
    // ... your existing defines
  },
},
```

**Option B: Using PostCSS Plugin (Alternative, may work better with Flowbite)**
If you encounter issues with the Vite plugin, you can use PostCSS instead:

**Keep integrations as-is (remove tailwind integration):**
```javascript
integrations: [react()], // Remove tailwind() from here
```

**Update PostCSS config (see Step 7) instead of Vite plugins.**

### Step 3: Update CSS Files

**File: `src/styles/tailwind.css`**

**Change from:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**To:**
```css
@import 'tailwindcss';
```

### Step 4: Migrate Tailwind Config to CSS

**This is the BIGGEST change** - Tailwind v4 uses CSS-based configuration instead of JavaScript config files.

**Create/Update: `src/styles/tailwind.css`**

You'll need to convert your `tailwind.config.mjs` to CSS using the `@theme` directive. Here's how to handle your dynamic colors:

```css
@import 'tailwindcss';
@import '@tailwindcss/typography';
@import './colors.css';
@import './global.css';
@import './fonts.css';

/* Dynamic theme configuration */
/* Note: CSS variables will need to be set via JavaScript at runtime */

@theme {
  /* Content paths - now in CSS */
  --content: './src/**/*.{astro,js,ts,jsx,tsx,vue,svelte}';
  
  /* Dark mode */
  --dark-mode: class;
  
  /* Fonts */
  --font-family-sans: var(--font-outfit, "Outfit Variable"), sans-serif;
  
  /* Font sizes */
  --font-size-body: 14px;
  
  /* Z-index */
  --z-index-negative: -1;
  --z-index-base: 1;
  
  /* Animations */
  --animate-pulse-slow: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  
  /* Colors - These will be set dynamically via CSS variables */
  /* Primary colors - set via JavaScript */
  --color-primary-50: var(--primary-50);
  --color-primary-100: var(--primary-100);
  --color-primary-200: var(--primary-200);
  --color-primary-300: var(--primary-300);
  --color-primary-400: var(--primary-400);
  --color-primary-500: var(--primary-500);
  --color-primary-600: var(--primary-600);
  --color-primary-700: var(--primary-700);
  --color-primary-800: var(--primary-800);
  --color-primary-900: var(--primary-900);
  --color-primary-950: var(--primary-950);
  
  /* Secondary colors - set via JavaScript */
  --color-secondary-50: var(--secondary-50);
  --color-secondary-100: var(--secondary-100);
  /* ... etc for all shades */
  
  /* Neutral colors */
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-300: #d4d4d4;
  --color-neutral-400: #a3a3a3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;
  --color-neutral-950: #0a0a0a;
  
  /* Success colors */
  --color-success-50: #f0fdf4;
  --color-success-100: #dcfce7;
  /* ... etc */
  
  /* Warning colors */
  --color-warning-50: #fffbeb;
  /* ... etc */
  
  /* Danger colors */
  --color-danger-50: #fef2f2;
  /* ... etc */
  
  /* Custom colors */
  --color-black: #171717;
  --color-white: #ffffff;
  
  /* Icon colors */
  --color-icon-primary: #6E6E6E;
  --color-icon-primary-dark: #a3a3a3;
  --color-icon-secondary: #737373;
  --color-icon-secondary-dark: #737373;
  
  /* Background images */
  --bg-btn-gradient: linear-gradient(to right, var(--primary-500), var(--primary-700));
}

/* Safelist classes - these need to be in your CSS or use @source directive */
@source "../node_modules/flowbite/**/*.js";
```

### Step 5: Create Dynamic Color Injection Script

Since you use dynamic colors from environment variables, you'll need a script to inject CSS variables at runtime.

**Create: `src/lib/tailwind-colors.ts`**

```typescript
import { generateColorPalette } from '../../color-generator.js';

export function injectTailwindColors() {
  if (typeof window === 'undefined') return; // SSR check
  
  const primaryColor = import.meta.env.GLOBAL_COLOR_PRIMARY || "#825BDD";
  const secondaryColor = import.meta.env.GLOBAL_COLOR_SECONDARY || "#0ea5e9";
  
  const primaryPalette = generateColorPalette(primaryColor);
  const secondaryPalette = generateColorPalette(secondaryColor);
  
  const root = document.documentElement;
  
  // Set primary colors
  Object.entries(primaryPalette).forEach(([shade, color]) => {
    root.style.setProperty(`--primary-${shade}`, color);
    root.style.setProperty(`--color-primary-${shade}`, color);
  });
  
  // Set secondary colors
  Object.entries(secondaryPalette).forEach(([shade, color]) => {
    root.style.setProperty(`--secondary-${shade}`, color);
    root.style.setProperty(`--color-secondary-${shade}`, color);
  });
}
```

**Add to your main layout component:**

```astro
<script>
  import { injectTailwindColors } from '../lib/tailwind-colors';
  
  if (typeof window !== 'undefined') {
    injectTailwindColors();
  }
</script>
```

### Step 6: Handle Safelist Classes

Tailwind v4 handles safelist differently. You have options:

**Option A: Use `@source` directive in CSS**
```css
@source "../node_modules/flowbite/**/*.js";
@source inline("translate-x-full translate-x-0 -translate-x-full");
```

**Option B: Keep a minimal config file** (Tailwind v4 supports this for complex cases)
```javascript
// tailwind.config.mjs (minimal, only for content/safelist)
export default {
  content: [
    "./src/**/*.{astro,js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js"
  ],
  safelist: [
    "translate-x-full",
    "translate-x-0",
    // ... your safelist items
  ]
}
```

### Step 7: Update PostCSS Config

**File: `postcss.config.mjs`**

**Option A: If using Vite plugin (from Step 2)**
```javascript
export default {
  plugins: {
    // Remove tailwindcss plugin - it's now handled by Vite
    autoprefixer: {},
  },
};
```

**Option B: If using PostCSS plugin instead**
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {}, // Tailwind v4 PostCSS plugin
    autoprefixer: {},
  },
};
```

**Note:** If you use Option B, you don't need the Vite plugin in Step 2. Choose one approach.

### Step 8: Handle Custom Plugins

**Flowbite Plugin:**
- Check if Flowbite v3.1.2 is compatible with Tailwind v4
- May need to update Flowbite or find alternatives
- Test all Flowbite components after migration

**Custom Scrollbar Plugin:**
Convert to CSS:
```css
@theme {
  /* Custom utilities */
}

@utility scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}
```

**tailwindcss-animate:**
- Check if this plugin is compatible with v4
- May need to use CSS animations instead

### Step 9: Update Content Paths

In Tailwind v4, content paths can be specified in CSS:
```css
@source "./src/**/*.{astro,js,ts,jsx,tsx,vue,svelte}";
@source "../node_modules/flowbite/**/*.js";
```

Or keep in minimal config file (see Step 6).

### Step 10: Test Everything

1. **Build test:**
   ```bash
   npm run build
   ```

2. **Check for errors:**
   - Look for missing classes
   - Check Flowbite components
   - Verify dynamic colors work
   - Test dark mode

3. **Visual regression:**
   - Compare before/after screenshots
   - Test all pages
   - Check responsive breakpoints

## Potential Issues & Solutions

### Issue 1: Flowbite Compatibility
**✅ GOOD NEWS:** Flowbite is fully compatible with Tailwind v4!

**Solution:**
- Flowbite automatically detects Tailwind v3 or v4
- Update Flowbite to latest version: `npm install flowbite@latest`
- No manual configuration needed - it adapts automatically
- However, you may need to use `@tailwindcss/postcss` instead of Vite plugin (see Step 2 alternative)

### Issue 2: Dynamic Colors Not Working
**Problem:** CSS variables not being set correctly.

**Solution:**
- Ensure color injection script runs before page render
- Use `:root` selector for CSS variables
- Check browser DevTools to verify variables are set
- Consider server-side color injection if needed

### Issue 3: Missing Classes
**Problem:** Some utility classes not generating.

**Solution:**
- Use `@source` directive for dynamic classes
- Add to safelist in config file
- Check content paths are correct

### Issue 4: Build Errors
**Problem:** PostCSS or Vite errors.

**Solution:**
- Remove tailwindcss from PostCSS plugins
- Ensure Vite plugin is configured correctly
- Clear `.astro` cache: `rm -rf .astro`

## Rollback Plan

If migration fails:

1. **Git revert:**
   ```bash
   git checkout main
   git branch -D tailwind-v4-migration
   ```

2. **Restore dependencies:**
   ```bash
   npm install @astrojs/tailwind@^5.1.1 tailwindcss@^3.4.1
   ```

3. **Restore config files:**
   - Restore `tailwind.config.mjs`
   - Restore `astro.config.mjs`
   - Restore `src/styles/tailwind.css`

## Migration Checklist

- [ ] Backup current codebase
- [ ] Create feature branch
- [ ] Update dependencies
- [ ] Update Astro config
- [ ] Migrate CSS files
- [ ] Convert Tailwind config to CSS
- [ ] Create color injection script
- [ ] Update PostCSS config
- [ ] Handle custom plugins
- [ ] Test build
- [ ] Test all pages visually
- [ ] Test Flowbite components
- [ ] Test dark mode
- [ ] Test responsive design
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Monitor for issues

## Resources

- [Tailwind CSS v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Astro + Tailwind v4 Example](https://github.com/withastro/astro/tree/main/examples/with-tailwindcss)

## Estimated Time

- **Small project:** 2-4 hours
- **Medium project (yours):** 4-8 hours
- **With testing:** 8-12 hours

## Recommendation

Given your complex setup with:
- Dynamic color generation
- Flowbite integration
- Custom plugins
- Extensive safelist

**Consider:**
1. Testing in a separate branch first
2. Verifying Flowbite v4 compatibility before starting
3. Having a rollback plan ready
4. Testing thoroughly before merging

Would you like me to help you start the migration, or do you want to test Flowbite compatibility first?
