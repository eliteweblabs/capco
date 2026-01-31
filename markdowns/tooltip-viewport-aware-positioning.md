# Tooltip Viewport-Aware Positioning (Spatial Recognition)

## Overview
Implemented automatic spatial recognition for tooltips to prevent them from being cut off by viewport edges. Tooltips now intelligently adjust their position based on available screen space, providing better UX especially for edge cases like step 1 on the left side of the stepper.

## Problem
Tooltips positioned near viewport edges would be cut off, creating poor user experience. For example:
- Step 1 tooltip on the left edge would extend beyond the left viewport boundary
- Tooltips at the top/bottom of the screen would overflow
- No automatic repositioning based on available space

## Solution
Created a viewport-aware positioning system that:
1. **Detects viewport boundaries** in real-time
2. **Automatically repositions tooltips** when they would overflow
3. **Adjusts arrow positioning** to match the new tooltip position
4. **Works responsively** on scroll, resize, and when tooltips become visible

## How It Works

### 1. Position Detection
The system checks all four edges of the viewport:
- **Left edge**: If tooltip extends beyond left side, shift right or flip to opposite side
- **Right edge**: If tooltip extends beyond right side, shift left or flip to opposite side
- **Top edge**: If tooltip extends beyond top, flip to bottom
- **Bottom edge**: If tooltip extends beyond bottom, flip to top

### 2. Smart Repositioning Logic

#### Horizontal Overflow (Top/Bottom Tooltips)
- When a top or bottom-positioned tooltip overflows horizontally
- The tooltip shifts left or right while maintaining its vertical position
- Uses `calc()` CSS to adjust the left position dynamically
- Example: `left: calc(50% + 20px)` shifts tooltip 20px right from center

#### Vertical Overflow (Top/Bottom Tooltips)
- When a top-positioned tooltip hits the top edge, flip to bottom
- When a bottom-positioned tooltip hits the bottom edge, flip to top
- Completely changes position classes and arrow direction

#### Side Tooltips (Left/Right)
- Left-positioned tooltips that overflow flip to right
- Right-positioned tooltips that overflow flip to left

### 3. Arrow Adjustment
When tooltip position changes, the arrow automatically updates:
- Arrow direction matches new position
- Arrow styling (border colors) updates for proper visual indication
- Maintains proper alignment with trigger element

## Technical Implementation

### Data Attributes
```typescript
<span 
  class="tooltip-content tooltip-auto-position" 
  data-tooltip-position="top"
>
```

### Position Detection Function
```typescript
function adjustTooltipPosition() {
  const tooltips = document.querySelectorAll('.tooltip-auto-position');
  
  tooltips.forEach((tooltip) => {
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 8; // Minimum distance from edge
    
    // Check boundaries and adjust...
  });
}
```

### Event Listeners
- **Scroll**: Adjust on page scroll
- **Resize**: Adjust on window resize
- **MutationObserver**: Detect when tooltips become visible and adjust immediately

### Trigger Points
1. **Initial load**: 100ms delay after page load
2. **Visibility change**: When tooltip opacity changes to visible
3. **User interactions**: Scroll and resize events
4. **Step navigation**: When stepper updates current step

## Features

### Automatic Detection
- No manual configuration needed
- Works for all tooltip instances automatically
- Detects viewport boundaries dynamically

### Performance Optimized
- Uses passive event listeners for scroll/resize
- Only processes visible tooltips (opacity-100)
- Debounced with setTimeout to prevent excessive calculations

### Maintains State
- Stores original position in `data-tooltip-position` attribute
- Can revert to original position when space becomes available
- Preserves tooltip behavior (dismissable, mobile-clickable, etc.)

### Visual Consistency
- Arrow always points to trigger element
- Smooth transitions between positions
- Maintains dark/light mode styling

## Edge Cases Handled

1. **Narrow Viewports**: Tooltips shift horizontally to stay within bounds
2. **Very Top/Bottom**: Flips to opposite side when no space available
3. **Mobile Screens**: Works with touch interactions and mobile-clickable feature
4. **Dynamic Content**: Responds to content changes via MutationObserver
5. **Stepper Progress**: Adjusts as user navigates through form steps

## Browser Compatibility
- Modern browsers with MutationObserver support
- Uses passive event listeners for better scroll performance
- Falls back gracefully if features unavailable

## Usage Examples

### Stepper Tooltips
```astro
<Tooltip 
  text={step.title} 
  position="top" 
  mobileClickable={true}
  open={step.stepNumber === 1}
>
  <span class="step-indicator">1</span>
</Tooltip>
```

Result: Step 1's tooltip (leftmost) automatically shifts right to avoid left edge cutoff.

### General Usage
```astro
<Tooltip text="Help text" position="left">
  <button>Help</button>
</Tooltip>
```

Result: If near right edge, automatically flips to "right" position.

## Files Modified
- `src/components/common/Tooltip.astro` - Added viewport detection script and data attributes
- `src/lib/tooltip-styles.ts` - Added `tooltip-auto-position` class and updated arrow handling
- Arrow class changed from dynamic `{arrowClasses}` to generic `tooltip-arrow` for easier runtime manipulation

## Configuration

### Padding Threshold
```typescript
const padding = 8; // Minimum 8px distance from viewport edge
```

You can adjust this value in the script to change how close tooltips can get to viewport edges.

### Position Priority
Current priority for repositioning:
1. Shift horizontally (for top/bottom tooltips)
2. Flip vertically (if needed)
3. Flip horizontally (for left/right tooltips)

## Benefits

1. **Better UX**: No more cut-off tooltips
2. **Automatic**: Works without manual intervention
3. **Responsive**: Adapts to viewport changes
4. **Universal**: Works for all tooltip instances
5. **Performant**: Optimized event handling
6. **Accessible**: Maintains tooltip readability in all scenarios

## Testing Recommendations
- Test on narrow viewports (mobile)
- Test with stepper on step 1 (leftmost edge)
- Test with stepper on last step (rightmost edge)
- Test scrolling behavior
- Test window resize
- Test in both light and dark modes
- Verify arrow positioning after flips
