# Custom CSS in Global Settings

## Overview

Added ability to inject custom CSS through the CMS Global Settings page, allowing per-client style customization without code changes.

## Implementation

### 1. Database Storage

Custom CSS is stored in the `globalSettings` table with key `custom_css`:

- **Key**: `custom_css`
- **Value**: Plain CSS text
- **Type**: TEXT/LONGTEXT
- **Access**: Admin only

### 2. Backend Integration

#### `global-company-data.ts`

Added `customCss` to the return object:

```typescript
// Custom CSS (allows per-client CSS overrides and customization)
customCss: get("custom_css") || "",
```

### 3. Frontend Injection

#### `App.astro`

Custom CSS is injected in the `<head>` section after favicons and before scripts:

```astro
<!-- Custom CSS from CMS Global Settings -->
{
  customCss && customCss.trim() && (
    <style is:inline set:html={customCss} data-source="cms-custom-css" />
  )
}
```

**Injection Strategy**:
- Uses `is:inline` to inject CSS directly without processing
- Uses `set:html` to render raw CSS (sanitized server-side)
- Adds `data-source="cms-custom-css"` attribute for debugging
- Only injects if `customCss` exists and is not empty
- Placed after theme/color variables but before page render

### 4. Admin UI

#### `settings.astro`

Added "Custom CSS" section between Analytics and Typography:

**Features**:
- Large textarea (12 rows) with monospace font
- Syntax placeholder with helpful examples
- Warning banner about advanced usage
- Database storage indicator (💾)
- Helpful tips about CSS variables

**Form Field**:
```astro
<textarea
  id="custom_css"
  name="custom_css"
  rows="12"
  class={globalInputClasses + " font-mono text-xs"}
  placeholder="/* Example CSS */"
>{settings.customCss}</textarea>
```

## Usage Examples

### 1. Override Button Styles

```css
/* Custom primary button style */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}
```

### 2. Add Custom Utility Classes

```css
/* Gradient text effect */
.custom-highlight {
  background: linear-gradient(120deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### 3. Override Specific Components

```css
/* Customize navigation bar */
nav.navbar {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

/* Dark mode adjustment */
.dark nav.navbar {
  background: rgba(17, 24, 39, 0.95);
}
```

### 4. Use Theme Variables

```css
/* Leverage existing CSS variables */
.custom-card {
  border: 2px solid var(--color-primary-500);
  background: var(--color-primary-50);
}

.dark .custom-card {
  background: var(--color-primary-900);
}
```

### 5. Hide/Show Elements

```css
/* Hide specific elements for this client */
.speed-dial {
  display: none !important;
}

/* Add custom branding watermark */
.footer::after {
  content: "Powered by Custom Solutions Inc.";
  display: block;
  text-align: center;
  opacity: 0.5;
}
```

## Best Practices

### 1. Use Specific Selectors

❌ **Bad**: Too broad, affects entire site
```css
button {
  background: red;
}
```

✅ **Good**: Targeted and specific
```css
.project-dashboard .btn-primary {
  background: var(--color-primary-600);
}
```

### 2. Leverage CSS Variables

❌ **Bad**: Hard-coded colors don't respect theme
```css
.custom-header {
  background: #825BDD;
}
```

✅ **Good**: Uses theme variables, respects dark mode
```css
.custom-header {
  background: var(--color-primary-500);
  color: var(--color-primary-50);
}
```

### 3. Handle Dark Mode

❌ **Bad**: Only works in light mode
```css
.custom-banner {
  background: white;
  color: black;
}
```

✅ **Good**: Works in both modes
```css
.custom-banner {
  background: white;
  color: black;
}

.dark .custom-banner {
  background: rgb(17, 24, 39);
  color: white;
}
```

### 4. Test Before Deployment

1. Add CSS in settings
2. Save and reload page
3. Check both light and dark modes
4. Verify responsive behavior (mobile/tablet/desktop)
5. Use browser DevTools to inspect changes

### 5. Comment Your Code

```css
/* 
 * Custom branding for CAPCO Design Group
 * Added: 2026-01-30
 * Purpose: Match brand guidelines with rounded corners
 */
.btn-primary {
  border-radius: 12px;
}
```

## Security Considerations

### Server-Side Rendering
- CSS is rendered server-side during SSR
- No XSS risk since CSS doesn't execute JavaScript
- HTML entities are automatically escaped by Astro

### Admin-Only Access
- Only Admin role can edit custom CSS
- Changes require authentication
- All updates logged to database

### Validation
- CSS is stored as plain text
- No preprocessing or compilation
- Invalid CSS won't break site (browser ignores it)

## Available CSS Variables

### Colors (Primary)
```css
var(--color-primary-50)   /* Lightest */
var(--color-primary-100)
var(--color-primary-200)
var(--color-primary-300)
var(--color-primary-400)
var(--color-primary-500)  /* Base color */
var(--color-primary-600)
var(--color-primary-700)
var(--color-primary-800)
var(--color-primary-900)
var(--color-primary-950)  /* Darkest */
```

### Colors (Secondary)
```css
var(--color-secondary-50)   /* Lightest */
/* ... same shades as primary ... */
var(--color-secondary-950)  /* Darkest */
```

### Typography
```css
var(--font-family)           /* Primary font */
var(--font-family-secondary) /* Secondary/fallback font */
```

## Troubleshooting

### CSS Not Appearing

1. **Check Database**: Verify `custom_css` key exists in `globalSettings`
2. **Clear Cache**: Reload page with cache clear (Cmd+Shift+R / Ctrl+Shift+R)
3. **Inspect Source**: Check if `<style data-source="cms-custom-css">` appears in HTML
4. **Browser DevTools**: Look for CSS in Elements > Styles panel

### Styles Not Working

1. **Specificity Issue**: Increase selector specificity or use `!important`
2. **Syntax Error**: Check CSS syntax (missing semicolons, brackets)
3. **Dark Mode**: Add `.dark` prefix for dark mode overrides
4. **Tailwind Classes**: Use `@layer utilities` to avoid conflicts

### Example Debug CSS

```css
/* Debug: Add red border to all elements */
* {
  outline: 1px solid red !important;
}
```

## Migration Guide

If you have existing custom CSS in code or separate files:

1. Copy CSS content
2. Navigate to `/admin/settings`
3. Scroll to "Custom CSS" section
4. Paste CSS into textarea
5. Click "Save Settings"
6. Remove old CSS files from codebase

## Related Files

- **Backend**: `src/pages/api/global/global-company-data.ts`
- **Frontend**: `src/components/ui/App.astro`
- **Admin UI**: `src/pages/admin/settings.astro`
- **Database**: `globalSettings` table

## Future Enhancements

Potential improvements for future versions:

1. **CSS Preprocessor**: Add SCSS/Less support
2. **Syntax Validation**: Real-time CSS syntax checking
3. **Version History**: Track CSS changes over time
4. **Preview Mode**: Live preview before saving
5. **Templates**: Pre-built CSS snippets library
6. **Per-Page CSS**: Allow custom CSS per page via CMS
7. **CSS Minification**: Compress CSS for performance
