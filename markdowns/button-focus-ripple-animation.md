# Button Focus and Ripple Animation Implementation

## Overview
Added Material Design-inspired ripple animations to all buttons throughout the application with two distinct effects:
- **Focus Ripple**: Slow, centered animation when button gains focus (1200ms)
- **Click Ripple**: Fast animation from click position (600ms)

## Implementation Date
2026-02-01

## Files Modified

### 1. `/src/styles/global.css`
Added CSS animations and styles for button ripple effects:

```css
/* BUTTON FOCUS & RIPPLE ANIMATIONS */
```

#### Key Features:
- **Focus Ripple**: Slow 1200ms animation from center when button gains focus via keyboard/tab
- **Click Ripple**: Fast 600ms animation from exact click XY coordinates  
- **Customizable**: Dark/light ripple variants for different button backgrounds
- **Accessible**: Respects `prefers-reduced-motion` preference
- **Performance**: Uses CSS animations with GPU acceleration

#### Animations:
```css
@keyframes ripple-focus {
  /* Slow 1200ms animation from center */
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  50% { opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}

@keyframes ripple-click {
  /* Fast 600ms animation from click position */
  0% { transform: scale(0); opacity: 1; }
  50% { opacity: 0.6; }
  100% { transform: scale(4); opacity: 0; }
}
```

### 2. `/src/scripts/button-ripple.ts` (NEW)
Created TypeScript script to handle ripple effect logic:

```typescript
createRipple(button, { type: 'focus' | 'click', x?, y? })
```

#### Features:
- **Event Delegation**: Efficient handling using capture phase
- **Automatic Cleanup**: Ripples auto-remove after animation completes
- **Smart Detection**: Only applies to buttons, not inputs/textareas
- **Disabled State**: Respects disabled/aria-disabled attributes
- **No Duplicates**: Prevents multiple focus ripples on same button

### 3. `/src/components/ui/App.astro`
Added script import to load ripple effects globally:

```html
<!-- Button Ripple Effects (Focus and Click animations) -->
<script>
  import "../../scripts/button-ripple";
</script>
```

## User Experience

### Focus Behavior (Keyboard/Tab Navigation)
- User tabs to a button → **Slow ripple animates from center (1200ms)**
- Provides clear visual feedback for keyboard navigation
- Ripple color: Primary color with 25% opacity gradient

### Click Behavior (Mouse/Touch)
- User clicks button → **Fast ripple animates from click point (600ms)**
- Ripple originates from exact X,Y coordinates of click
- Ripple color: White with 50% opacity (light), Primary color (dark buttons)

### Button Variants
The system automatically adapts to different button styles:
- **Primary/Secondary**: White ripple (light background)
- **Outline/Ghost**: Primary-colored ripple (dark/transparent background)
- All buttons maintain proper z-index layering

## Technical Details

### CSS Classes
- `.button-ripple`: Base ripple container
- `.focus-ripple`: Applied for keyboard focus events
- `.click-ripple`: Applied for mouse/touch click events
- `.ripple-dark`: Optional class for dark-styled buttons

### Z-Index Strategy
```css
.button-ripple { z-index: 0; }           /* Behind content */
button > *:not(.button-ripple) { z-index: 1; } /* Content on top */
```

### Performance Considerations
1. **CSS Animations**: Hardware-accelerated transforms
2. **Event Delegation**: Single listener for all buttons
3. **Auto Cleanup**: Ripples removed after animation
4. **No Layout Thrashing**: Absolute positioning, no reflows

### Accessibility
- **Keyboard Focus**: Clear visual indicator for tab navigation
- **Reduced Motion**: Falls back to simple outline when `prefers-reduced-motion` is enabled
- **Disabled States**: Properly respects disabled attributes

## Browser Compatibility
- ✅ Chrome/Edge 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Mobile Safari/Chrome

Uses modern CSS features:
- `color-mix()` for alpha blending
- CSS Custom Properties
- `prefers-reduced-motion` media query

## Testing Checklist
- [x] Click buttons with mouse → ripple from click position
- [x] Tab through buttons → slow ripple from center
- [x] Primary buttons → white ripple
- [x] Outline/ghost buttons → colored ripple
- [x] Disabled buttons → no ripple
- [x] Reduced motion → fallback to outline

## Future Enhancements
- Could add configurable duration via data attributes
- Could add color customization per button variant
- Could add touch/mobile-specific optimizations

## Related Files
- Similar focus animation exists for form inputs in `MultiStepForm.astro` (lines 414-446)
- Button styling logic in `/src/lib/button-styles.ts`
- Button component in `/src/components/common/Button.astro`

## Notes
- Focus ripple is **2x slower** than click ripple (1200ms vs 600ms) as requested
- Both effects use same visual style (radial gradient) but originate from different points
- Works with existing button components without requiring any changes to markup
- Automatically initializes on page load, no manual setup required
