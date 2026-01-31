# Tooltip Mobile Clickable Parameter

## Overview

A new `mobileClickable` parameter has been added to the Tooltip component to enable tooltips to be toggled on mobile devices through tap interactions, rather than requiring them to be always visible with `open={true}`.

## The Problem

Previously, tooltips had two main issues on mobile devices:

1. **Hover-based tooltips don't work on touch devices** - The CSS `group-hover:opacity-100` class doesn't trigger on mobile since there's no hover state
2. **Always-visible tooltips** - The workaround was to use `open={true}`, making tooltips permanently visible, which isn't ideal for non-interactive elements

## The Solution

The `mobileClickable` parameter enables tooltips to:
- Work normally with hover on desktop devices
- Toggle visibility on mobile devices when the wrapper element is tapped
- Automatically detect touch devices and apply the appropriate behavior
- Close when tapping outside the tooltip area

## Usage

### Basic Usage

```astro
<Tooltip text="This tooltip is clickable on mobile" mobileClickable={true}>
  <span>Tap me on mobile</span>
</Tooltip>
```

### With Position and Styling

```astro
<Tooltip 
  text="Mobile-friendly tooltip" 
  position="bottom"
  mobileClickable={true}
  className="text-sm"
>
  <div class="info-icon">ℹ️</div>
</Tooltip>
```

### When to Use `mobileClickable`

**Use `mobileClickable={true}` when:**
- The tooltip is attached to non-interactive elements (spans, divs, icons)
- You want the tooltip hidden by default on mobile
- Users need to actively tap to see the tooltip content
- The element containing the tooltip won't navigate away or trigger other actions

**Don't use `mobileClickable` when:**
- The tooltip is attached to buttons or links (these already handle clicks for their primary action)
- You want the tooltip always visible (use `open={true}` instead)
- The tooltip is for critical information that should always be shown on mobile

### Comparison: Old vs New Approach

#### Old Approach (Always Visible on Mobile)
```astro
<Tooltip text="Always visible" open={true}>
  <span>Info</span>
</Tooltip>
```
- Tooltip always visible on both desktop and mobile
- Can clutter the UI
- Good for critical information

#### New Approach (Toggle on Mobile)
```astro
<Tooltip text="Toggle on mobile" mobileClickable={true}>
  <span>Info</span>
</Tooltip>
```
- Tooltip shows on hover (desktop) or tap (mobile)
- Cleaner UI
- Better for supplementary information

## Technical Details

### How It Works

1. **Touch Detection**: The component automatically detects if the device supports touch using `'ontouchstart' in window || navigator.maxTouchPoints > 0`

2. **Click Handler**: On touch devices, a click event listener is added to the tooltip wrapper that:
   - Toggles the tooltip visibility
   - Prevents default behavior
   - Stops event propagation to avoid conflicts

3. **Interactive Element Protection**: The click handler skips buttons, links, and inputs to preserve their native functionality

4. **Outside Click**: An additional document-level listener closes the tooltip when clicking outside

### CSS Classes Applied

When `mobileClickable={true}`:
- Adds `mobile-clickable-tooltip` class to the wrapper
- Tooltip still uses standard opacity transitions
- Desktop hover behavior remains unchanged

## Browser Support

Works on all modern browsers that support:
- Touch events API
- `classList` manipulation
- ES6+ JavaScript features

## Examples in Codebase

See these files for reference:
- `/src/components/common/Tooltip.astro` - Main component
- `/src/lib/tooltip-styles.ts` - Styling logic
- `/src/pages/partials/tooltip.astro` - Partial wrapper

## Future Enhancements

Potential improvements:
- Add animation options for mobile tooltip transitions
- Support for long-press to show tooltip
- Configurable tap-to-close vs tap-outside-to-close behavior
- Accessibility improvements for screen readers on mobile devices
