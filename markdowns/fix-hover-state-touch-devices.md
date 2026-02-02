# Fix: Persistent Hover State on Touch Devices

## Problem
After tapping choice buttons on touch devices (iOS, Android), the `:hover` state would persist even after deselecting/deactivating the button. This creates a confusing UX where the button appears to be in hover state when it shouldn't be.

## Root Cause
CSS `:hover` pseudo-classes can "stick" on touch devices after a tap event. This is because:
1. Touch devices emulate hover on tap to support legacy websites
2. The hover state doesn't clear until another element is tapped
3. This is especially noticeable with background color changes

## CSS-Only Solution
Use Tailwind's `@media (hover: hover)` wrapper to **only apply hover effects on devices that actually support hover** (mouse/trackpad), not touch devices.

### Before (incorrect):
```css
hover:bg-primary-500 hover:text-white
```

### After (correct):
```css
[@media(hover:hover)]:hover:bg-primary-500 [@media(hover:hover)]:hover:text-white
```

## What This Does
- **Desktop/Mouse**: Hover effects work normally
- **Touch Devices**: Hover effects are completely disabled
- **No JavaScript needed**: Pure CSS solution, more performant

## Implementation
Updated `/src/lib/button-styles.ts` to wrap all `hover:` utilities with `[@media(hover:hover)]:` prefix for:
- `primary` variant
- `secondary` variant  
- `success` variant
- `warning` variant
- `danger` variant
- `outline` variant (the problematic one for choice buttons)
- `ghost` variant
- `link` variant
- `anchor` variant

Also removed JavaScript `blur()` workarounds and `hover:bg-gray-50` class manipulations from `/src/lib/multi-step-form-handler.ts` since they're no longer needed.

## Benefits
1. ✅ No persistent hover states on touch devices
2. ✅ Better mobile UX
3. ✅ CSS-only, no JavaScript overhead
4. ✅ Follows web standards
5. ✅ More maintainable than JavaScript workarounds

## References
- [MDN: hover media feature](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover)
- [Tailwind CSS: Hover on hover-capable devices](https://tailwindcss.com/docs/hover-focus-and-other-states#hover-on-hover-capable-devices)
