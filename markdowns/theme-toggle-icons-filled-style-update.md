# Theme Toggle Icons Update - Filled Style

## Overview
Updated both the "moon" and "sun" icons in the SimpleIcon map from stroked outline style to filled style for better visual consistency with the ThemeToggle component.

## Changes Made

### icon-data.json
- **Replaced moon icon** (line 475) from outline/stroke style to filled style
- **Replaced sun icon** (line 476) from outline/stroke style to filled style
- **Icon style**: Changed from `stroke` with `fill="none"` to `fill="currentColor"`
- **Visual weight**: Both icons now have solid fills for better visibility and modern appearance

## Icon Details

### Moon Icon (Filled Style)
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12.3224 5.68708c.2935-.31028.3575-.77266.1594-1.15098-.1981-.37832-.6146-.5891-1.0368-.52467-1.50847.2302-2.93175.83665-4.12869 1.76276-1.19717.92628-2.12732 2.1411-2.69465 3.52702-.56744 1.38619-.75115 2.89299-.53164 4.37079.2195 1.4776.83393 2.8711 1.77895 4.0436.9448 1.1722 2.18683 2.0826 3.60103 2.6449 1.414.5623 2.9539.7584 4.4683.57 1.5145-.1884 2.9549-.7551 4.1784-1.6475 1.2237-.8924 2.1892-2.0806 2.7972-3.4499.1723-.3879.0809-.8423-.2279-1.1335-.3089-.2911-.7679-.3556-1.145-.1608-.8631.4459-1.8291.6799-2.8118.6791h-.0018c-1.1598.0013-2.2925-.3234-3.2596-.931-.9667-.6074-1.7244-1.4697-2.1856-2.4779-.4611-1.0078-.6079-2.1209-.4243-3.20511.1835-1.08442.6905-2.09837 1.4645-2.91681Z"></path>
</svg>
```

### Sun Icon (Filled Style)
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <path fill-rule="evenodd" d="M13 3a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0V3ZM6.343 4.929A1 1 0 0 0 4.93 6.343l1.414 1.414a1 1 0 0 0 1.414-1.414L6.343 4.929Zm12.728 1.414a1 1 0 0 0-1.414-1.414l-1.414 1.414a1 1 0 0 0 1.414 1.414l1.414-1.414ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-9 4a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2H3Zm16 0a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2h-2ZM7.757 17.657a1 1 0 1 0-1.414-1.414l-1.414 1.414a1 1 0 1 0 1.414 1.414l1.414-1.414Zm9.9-1.414a1 1 0 0 0-1.414 1.414l1.414 1.414a1 1 0 0 0 1.414-1.414l-1.414-1.414ZM13 19a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0v-2Z" clip-rule="evenodd"></path>
</svg>
```

## Benefits
1. **Visual Consistency**: Both icons match the filled style now used throughout the app
2. **Better Contrast**: Filled icons are more visible in both light and dark modes
3. **Modern Aesthetic**: Filled icons are trending in modern UI design
4. **Theme Toggle Harmony**: Perfect visual balance between moon and sun icons
5. **Unified Design**: Matches the design system from ThemeToggle.astro

## Usage
These icons are used in:
- `src/components/ui/ThemeToggle.astro` 
  - Moon icon: dark mode indicator (`theme-toggle-dark-icon`)
  - Sun icon: light mode indicator (`theme-toggle-light-icon`)
- Any other components using `<SimpleIcon name="moon" />` or `<SimpleIcon name="sun" />`

## Files Modified
- `/src/lib/icon-data.json` 
  - Line 475: moon icon
  - Line 476: sun icon

## Related Icons
- `"moon-plus"` - variant with plus symbol (line 474)

## Previous Styles

Both icons previously used outline/stroke style:
- `fill="none"`
- `stroke="currentColor"`
- `stroke-width="2"`
- `stroke-linecap="round"`
- `stroke-linejoin="round"`

Now both use filled style:
- `fill="currentColor"`
- Solid paths with proper fill-rule and clip-rule attributes
