# SpeedDial Persistent Tooltip Animation

**Date**: February 1, 2026

## Summary

Updated SpeedDial component to display tooltips persistently with a staggered animation from bottom to top when the speed dial opens.

## Changes Made

### 1. Removed `open={true}` from Tooltip Props

- Changed all tooltip wrappers from `<Tooltip position="left" open={true} text="..." className="...">`
- To: `<Tooltip position="left" text="..." className="speed-dial-tooltip">`
- Added `speed-dial-tooltip` class to identify speed dial tooltips

### 2. Added Staggered Animation Logic

**When Opening (Bottom to Top)**:

```typescript
const tooltips = speedDialMenu?.querySelectorAll(".speed-dial-tooltip");
if (tooltips) {
  const tooltipsArray = Array.from(tooltips).reverse(); // Reverse for bottom-to-top

  tooltipsArray.forEach((tooltipWrapper, index) => {
    const tooltipContent = tooltipWrapper.querySelector(".tooltip-content") as HTMLElement;
    if (tooltipContent) {
      setTimeout(() => {
        tooltipContent.classList.remove("opacity-0");
        tooltipContent.classList.add("opacity-100");
        tooltipContent.style.pointerEvents = "auto";
      }, index * 100); // 100ms stagger between each tooltip
    }
  });
}
```

**When Closing**:

```typescript
const tooltips = speedDialMenu?.querySelectorAll(".speed-dial-tooltip .tooltip-content");
tooltips?.forEach((tooltip) => {
  tooltip.classList.remove("opacity-100");
  tooltip.classList.add("opacity-0");
  (tooltip as HTMLElement).style.pointerEvents = "none";
});
```

### 3. Updated Functions

- **toggleSpeedDial()**: Added tooltip show/hide logic based on open state
- **hideSpeedDial()**: Added tooltip hide logic

## Behavior

1. **Speed dial closed**: All tooltips are hidden (opacity-0)
2. **User opens speed dial**: Tooltips appear in succession from bottom to top with 100ms delay between each
3. **User closes speed dial**: All tooltips hide immediately
4. **Tooltips are persistent**: They remain visible while speed dial is open (not just on hover)

## Animation Timing

- **Stagger delay**: 100ms between each tooltip
- **Total animation time**: (number of buttons × 100ms)
  - Example: 5 buttons = 500ms total animation
- **Direction**: Bottom to top (reversed array)

## Files Modified

- `/src/components/ui/SpeedDial.astro`

## Testing Checklist

- [ ] Open speed dial on desktop - tooltips animate from bottom to top
- [ ] Open speed dial on mobile - tooltips animate from bottom to top
- [ ] Tooltips remain visible while speed dial is open
- [ ] Close speed dial - tooltips disappear immediately
- [ ] Multiple buttons show tooltips with visible stagger effect
- [ ] Different user states (logged in vs logged out) display correctly

## Notes

- Tooltips use FloatingUI for positioning (automatic viewport collision detection)
- The animation respects the conditional rendering (Admin-only buttons, logged-in vs logged-out states)
- Buttons maintain their individual functionality (navigation, modal triggers, etc.)
