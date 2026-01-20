# Font Loading Fix - Open Sans & Other Google Fonts

## Problem

When setting the primary or secondary font to "Open Sans" (or any other Google Font) in the Global Settings, the font was not actually loading. The system would set the CSS variable `--font-family` correctly, but the actual font files were never loaded, causing the browser to fall back to system fonts.

## Root Cause

The application only had **Outfit Variable** font installed and loaded via the npm package `@fontsource-variable/outfit`. All other fonts listed in the settings dropdown (Open Sans, Roboto, Lato, etc.) were never loaded because:

1. They weren't installed as npm packages
2. No Google Fonts links were being injected into the page
3. The system assumed the fonts would "just work" by setting the CSS variable

## Solution

Added dynamic Google Fonts loading to `src/components/ui/App.astro`:

### Changes Made

1. **Font Configuration Map** (lines 268-308)
   - Created a `fontConfigs` object that maps each font name to its Google Fonts URL
   - Outfit Variable is set to `null` since it's loaded via npm

2. **Dynamic Font Loading Function** (lines 310-333)
   - `loadFont(fontName)` function that:
     - Checks if the font has a Google Fonts URL
     - Prevents duplicate loading by checking if link already exists
     - Creates and injects a `<link>` tag to load the font from Google Fonts
     - Loads both primary and secondary fonts

3. **Preconnect Links** (lines 365-366)
   - Added `<link rel="preconnect">` tags for `fonts.googleapis.com` and `fonts.gstatic.com`
   - Improves font loading performance by establishing early connections

## How It Works

When a page loads:

1. The inline script runs immediately (before CSS is parsed)
2. It reads the `fontFamily` and `secondaryFontFamily` values from the server
3. For each font:
   - If it's in the `fontConfigs` map and has a URL, it loads it from Google Fonts
   - If it's `null` (like Outfit Variable), it skips loading (already loaded via npm)
   - If it's a generic font family (like "sans-serif", "serif"), it skips loading

4. Console logs show which fonts are being loaded for debugging

## Testing

To test the fix:

1. Go to Admin → Settings → Global Settings
2. Change the Primary Font Family to "Open Sans"
3. Save the settings
4. Refresh any page
5. Open browser DevTools → Console
6. You should see: `[Font] Loading font: Open Sans`
7. Inspect the Network tab - you should see a request to `fonts.googleapis.com`
8. Inspect an element - the computed style should show "Open Sans" as the font-family

## Fonts Supported

All fonts in the Global Settings dropdown are now supported:

- Roboto
- Open Sans ✅ (Fixed)
- Lato
- Montserrat
- Poppins
- Inter
- Raleway
- Source Sans Pro
- Nunito
- Playfair Display
- Merriweather
- Oswald
- Lora
- PT Sans
- Ubuntu
- Noto Sans
- Work Sans
- Crimson Text
- Fira Sans
- Dancing Script
- Bebas Neue
- Comfortaa
- Quicksand
- Rubik
- Josefin Sans
- Libre Baskerville
- Cabin
- Dosis
- Arvo
- Titillium Web
- Mukta
- Karla
- Barlow
- DM Sans
- Manrope
- Space Grotesk
- Plus Jakarta Sans
- Outfit Variable (loaded via npm)

## Performance Considerations

- **Preconnect**: Early connection to Google Fonts servers reduces loading time
- **Duplicate Prevention**: Font links are only added if they don't already exist
- **Lightweight**: Only loads fonts that are actually selected in settings
- **Display Swap**: All Google Fonts URLs use `display=swap` to prevent FOIT (Flash of Invisible Text)

## Related Files

- `src/components/ui/App.astro` - Font loading logic
- `src/pages/admin/settings.astro` - Font selection UI
- `src/styles/global.css` - Font CSS variables
- `tailwind.config.mjs` - Tailwind font configuration

## Alternative Approaches Considered

1. **Install all fonts via npm** - Would bloat the bundle size significantly
2. **Use Bunny Fonts** (privacy-focused Google Fonts alternative) - Could be considered for GDPR compliance
3. **Self-host all fonts** - More control but requires more maintenance

The current approach (dynamic Google Fonts loading) was chosen for its balance of simplicity, performance, and user experience.
