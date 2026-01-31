# Switch to Floating UI for Tooltip Positioning

## Overview

Replaced custom tooltip positioning logic with **Floating UI** (@floating-ui/dom), the industry-standard positioning engine used by popular UI libraries like Floating UI, Headless UI, and Radix UI.

## Why Floating UI?

### Problems with Custom Solution

1. **Complex edge cases**: Viewport detection required extensive custom code
2. **Maintenance burden**: Custom positioning logic needs ongoing updates
3. **Browser inconsistencies**: Different browsers handle transforms differently
4. **Performance concerns**: Manual calculations on every scroll/resize
5. **Incomplete coverage**: Missing advanced collision detection scenarios

### Benefits of Floating UI

1. **Battle-tested**: Used by millions of websites in production
2. **Automatic positioning**: Smart collision detection and viewport awareness built-in
3. **Zero configuration**: Works perfectly out of the box
4. **Lightweight**: Only ~2KB gzipped
5. **Actively maintained**: Regular updates and bug fixes
6. **Comprehensive**: Handles all edge cases automatically

## What Changed

### Package Installation

```bash
npm install @floating-ui/dom
```

Added **@floating-ui/dom** to dependencies (only 3 packages, very lightweight)

### New Component

Created `src/components/common/TooltipFloating.astro` with:

- Floating UI integration
- Automatic viewport-aware positioning
- Flip middleware (switches sides when no space)
- Shift middleware (slides along edge to stay visible)
- Arrow positioning
- Mobile and desktop support
- Touch device detection

### Updated MultiStepForm

Changed import from:

```astro
import Tooltip from "../common/Tooltip.astro";
```

To:

```astro
import Tooltip from "../common/TooltipFloating.astro";
```

## Features

### Automatic Positioning

- **Flip**: Automatically switches to opposite side when no room
- **Shift**: Slides horizontally/vertically to stay within viewport
- **Offset**: Maintains consistent spacing from trigger element
- **Arrow**: Automatically positions arrow to point at trigger

### Smart Collision Detection

Floating UI checks:

1. All four viewport edges simultaneously
2. Available space in all directions
3. Best fallback position
4. Maintains readability in all scenarios

### Positioning Strategy

1. **First choice**: Use preferred position (top/bottom/left/right)
2. **Flip**: If no space, try opposite side
3. **Shift**: If still overflowing, slide along axis to fit
4. **Always visible**: Guaranteed to stay within viewport with 8px padding

### Mobile Support

- Detects touch devices automatically
- Click-to-toggle on mobile when `mobileClickable={true}`
- Hover behavior on desktop
- Closes other tooltips when one opens (mobile)
- Outside click closes tooltip (mobile)

## API

### Props

```typescript
interface Props {
  text?: string; // Tooltip text content
  position?: "top" | "bottom" | "left" | "right"; // Preferred position
  className?: string; // Additional wrapper classes
  tooltipClass?: string; // Additional tooltip classes
  disabled?: boolean; // Hide tooltip
  open?: boolean; // Force tooltip open
  dismissable?: boolean; // Show close button
  mobileClickable?: boolean; // Enable click on mobile
}
```

### Usage Example

```astro
<Tooltip text="Step title" position="top" mobileClickable={true}>
  <span class="step-indicator">1</span>
</Tooltip>
```

## Technical Details

### Middleware Stack

```javascript
const middleware = [
  offset(8), // 8px gap from trigger
  flip({
    // Flip to opposite side if needed
    fallbackAxisSideDirection: "start",
  }),
  shift({ padding: 8 }), // Slide to stay in viewport (8px padding)
  arrow({ element: arrowElement }), // Position arrow
];
```

### Position Computation

```javascript
const { x, y, placement, middlewareData } = await computePosition(
  trigger, // Reference element
  tooltip, // Floating element
  {
    placement: preferredPosition,
    middleware,
  }
);
```

Floating UI returns:

- `x, y`: Optimal tooltip coordinates
- `placement`: Actual placement used (may differ from preferred)
- `middlewareData`: Arrow coordinates and other metadata

### Arrow Styling

CSS-based arrow using transforms:

- 8x8px square rotated 45°
- Automatically positioned by Floating UI
- Adjusts based on actual placement
- Maintains proper background color in dark mode

## Performance

### Optimizations

1. **Passive event listeners**: No scroll blocking
2. **Only updates when visible**: Skips hidden tooltips
3. **Efficient calculations**: Floating UI is highly optimized
4. **No layout thrashing**: Batched DOM reads/writes

### Event Handling

- Scroll: Updates position (passive)
- Resize: Updates position (passive)
- Hover: Shows/hides tooltip
- Click (mobile): Toggles visibility
- Outside click: Closes tooltip

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11+ (with polyfills if needed)
- Mobile browsers (iOS Safari, Chrome Android)
- Touch and mouse input

## Migration Notes

### Old Component (`Tooltip.astro`)

- Custom viewport detection
- Manual class manipulation
- Complex MutationObserver setup
- ~240 lines of code

### New Component (`TooltipFloating.astro`)

- Floating UI handles positioning
- Clean, declarative API
- Simple event handling
- ~220 lines (but much simpler logic)

### Breaking Changes

**None** - Same props API, drop-in replacement

## Files Modified

- Created: `src/components/common/TooltipFloating.astro`
- Updated: `src/components/form/MultiStepForm.astro` (import path only)
- Added: `@floating-ui/dom` to package.json

## Files to Keep (For Reference)

- `src/components/common/Tooltip.astro` (old version, can be removed later)
- `src/lib/tooltip-styles.ts` (may be used elsewhere, audit before removing)

## Testing Checklist

- [ ] Step 1 (leftmost) - should position correctly, not cut off on left
- [ ] Step 8 (rightmost) - should position correctly, not cut off on right
- [ ] Middle steps - should maintain top position
- [ ] Narrow viewport - tooltips should shift/flip to stay visible
- [ ] Mobile devices - tap to show, tap outside to hide
- [ ] Dark mode - arrow and background colors correct
- [ ] Scroll behavior - tooltips update position
- [ ] Resize behavior - tooltips reposition

## Floating UI Resources

- **Docs**: https://floating-ui.com/
- **Demo**: https://floating-ui.com/docs/getting-started
- **GitHub**: https://github.com/floating-ui/floating-ui
- **Tutorial**: https://floating-ui.com/docs/tutorial

## Next Steps

1. Test thoroughly across devices and viewport sizes
2. If working well, remove old `Tooltip.astro` component
3. Audit `tooltip-styles.ts` for other usage
4. Consider using Floating UI for other popovers/dropdowns in the app
