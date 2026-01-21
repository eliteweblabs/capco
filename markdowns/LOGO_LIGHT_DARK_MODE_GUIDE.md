# Logo Light/Dark Mode Setup Guide

The logo system now supports separate logos for light and dark themes, automatically switching based on the user's theme preference.

## How It Works

The logo component uses CSS classes (`dark:hidden` and `hidden dark:block`) to show/hide the appropriate logo based on the `.dark` class on the `<html>` element. This works seamlessly with the existing theme toggle system.

## Environment Variables

### Option 1: Single Logo (Backward Compatible)
If you only set `GLOBAL_COMPANY_LOGO_SVG`, it will be used for both light and dark modes:

```bash
GLOBAL_COMPANY_LOGO_SVG="<img src='data:image/png;base64,...' alt='Company Name' />"
```

### Option 2: Separate Light/Dark Logos (Recommended)
Set separate logos for light and dark modes:

```bash
# Light mode logo (shown when theme is light)
GLOBAL_COMPANY_LOGO_SVG_LIGHT="<img src='data:image/png;base64,...' alt='Company Name' />"

# Dark mode logo (shown when theme is dark)
GLOBAL_COMPANY_LOGO_SVG_DARK="<img src='data:image/png;base64,...' alt='Company Name' />"
```

### Option 3: Fallback Behavior
If you set both `GLOBAL_COMPANY_LOGO_SVG_LIGHT` and `GLOBAL_COMPANY_LOGO_SVG_DARK`, but one is missing, the system will fall back to `GLOBAL_COMPANY_LOGO_SVG` for the missing one.

## Icon Support

The same system works for icons (favicons):

```bash
# Single icon (used for both themes)
GLOBAL_COMPANY_ICON_SVG="<svg>...</svg>"

# Or separate icons
GLOBAL_COMPANY_ICON_SVG_LIGHT="<svg>...</svg>"
GLOBAL_COMPANY_ICON_SVG_DARK="<svg>...</svg>"
```

## Examples

### Example 1: PNG Logo with Base64
```bash
# Light mode - white background logo
GLOBAL_COMPANY_LOGO_SVG_LIGHT="<img src='data:image/png;base64,iVBORw0KG...' alt='Company' style='height: 36px;' />"

# Dark mode - dark background logo (or inverted colors)
GLOBAL_COMPANY_LOGO_SVG_DARK="<img src='data:image/png;base64,iVBORw0KG...' alt='Company' style='height: 36px;' />"
```

### Example 2: SVG Logo
```bash
# Light mode - dark logo on light background
GLOBAL_COMPANY_LOGO_SVG_LIGHT="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'><path fill='#000000' d='...'/></svg>"

# Dark mode - light logo on dark background
GLOBAL_COMPANY_LOGO_SVG_DARK="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'><path fill='#FFFFFF' d='...'/></svg>"
```

## Setting Up in Railway

1. Go to your Railway project settings
2. Navigate to **Variables**
3. Add the following variables:

   **For separate light/dark logos:**
   - `GLOBAL_COMPANY_LOGO_SVG_LIGHT` = Your light mode logo (SVG or `<img>` tag)
   - `GLOBAL_COMPANY_LOGO_SVG_DARK` = Your dark mode logo (SVG or `<img>` tag)

   **Or for a single logo:**
   - `GLOBAL_COMPANY_LOGO_SVG` = Your logo (will be used for both themes)

4. Redeploy your application

## Testing

1. Toggle between light and dark mode using the theme toggle button
2. The logo should automatically switch between the light and dark versions
3. Check browser console for `[LOGO]` debug messages if the logo doesn't appear

## Technical Details

- The logo component uses Tailwind's `dark:` modifier classes
- Light logo: `class="dark:hidden"` (hidden when dark mode is active)
- Dark logo: `class="hidden dark:block"` (hidden by default, shown when dark mode is active)
- Theme detection uses the `.dark` class on `<html>` element, which is managed by the theme toggle system
- Server-side rendering uses the theme cookie to determine initial logo

## Troubleshooting

**Logo not switching:**
- Ensure both `GLOBAL_COMPANY_LOGO_SVG_LIGHT` and `GLOBAL_COMPANY_LOGO_SVG_DARK` are set
- Check browser console for errors
- Verify the theme toggle is working (check if `.dark` class is added/removed from `<html>`)

**Logo not showing:**
- Check that the logo markup is valid (contains `<svg>` or `<img>`)
- Verify environment variables are set correctly
- Check browser console for `[LOGO]` debug messages

