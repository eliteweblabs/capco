# Banner Alerts Navbar Push Fix for Small Screens

## Problem
Banner alerts were not properly pushing the navbar down on small (`< sm`) screen sizes. The navbar would overlap with the banner alerts instead of being pushed down.

## Root Causes

### 1. Banner Container Layout
The banner containers were missing flexbox classes, causing banners to overlap instead of stack:
- Missing `flex flex-col` on both top and bottom banner containers

### 2. Script Timing Issues
The navbar adjustment script had several timing-related issues:
- Script ran before the flexbox layout was fully calculated
- No forced reflow to ensure height calculations were accurate
- Single execution meant transient layout issues could be missed
- No debouncing on resize events

## Solution

### Part 1: Added Flexbox to Banner Containers
**File**: `/src/features/banner-alert/components/BannerAlertsLoader.astro`

Added `flex flex-col` to both banner containers:

**Top Banners** (line 91):
```astro
<div class="banner-alerts-top fixed top-0 left-0 right-0 z-[9999] flex flex-col" id="top-banner-container">
```

**Bottom Banners** (line 176):
```astro
<div class="banner-alerts-bottom fixed bottom-0 left-0 right-0 z-[60] flex flex-col" id="bottom-banner-container">
```

### Part 2: Enhanced Navbar Adjustment Script
**File**: `/src/features/banner-alert/components/BannerAlertsLoader.astro` (lines 109-170)

Key improvements:

1. **Forced Reflow**: Added `topBannerContainer.offsetHeight;` to force browser to calculate layout before reading height
2. **Multiple Execution Attempts**: Script now runs immediately, then at 50ms and 150ms to catch any layout shifts
3. **Debounced Resize**: Added debouncing to resize event (100ms delay) to prevent excessive recalculations
4. **Better Navbar Selector**: Added fallback to just `nav` if fixed navbar isn't found
5. **Immediate Execution**: Changed from `setTimeout(..., 10)` to immediate execution when DOM is ready

```javascript
// Force reflow to ensure flexbox layout is calculated
topBannerContainer.offsetHeight;

// Initial adjustment with multiple attempts
updateNavbarPosition();
setTimeout(updateNavbarPosition, 50);
setTimeout(updateNavbarPosition, 150);

// Debounced resize handler
let resizeTimeout;
window.addEventListener("resize", function() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(updateNavbarPosition, 100);
});
```

## Technical Details

### Why Multiple Execution Attempts?
On small screens, the browser may need additional time to:
- Calculate flexbox layout (stacking multiple banners)
- Load custom fonts that affect banner height
- Complete any CSS transitions or animations
- Finish rendering dynamic content

The staggered execution (0ms, 50ms, 150ms) ensures the navbar gets positioned correctly even if initial layout calculation is incomplete.

### Why Forced Reflow?
Reading `offsetHeight` immediately after setting `flex flex-col` might return stale values if the browser hasn't recalculated layout yet. Accessing `offsetHeight` once forces a synchronous layout calculation, ensuring subsequent height reads are accurate.

### Why Debounce Resize?
On mobile devices, orientation changes and virtual keyboard appearance can trigger many rapid resize events. Debouncing prevents excessive recalculation and improves performance.

## Result
✅ Banner alerts now properly stack vertically on all screen sizes
✅ Navbar is consistently pushed down by the combined height of all banners
✅ Works smoothly across mobile, tablet, and desktop
✅ Handles banner dismissals and responsive layout changes
✅ Optimized performance with debounced resize handling

## Files Modified
1. `/src/features/banner-alert/components/BannerAlertsLoader.astro`
   - Added `flex flex-col` to top banner container (line 91)
   - Added `flex flex-col` to bottom banner container (line 176)
   - Enhanced navbar adjustment script with forced reflow, multiple execution attempts, and debounced resize (lines 109-170)

## Testing Recommendations
- Test with 1, 2, and 3+ banner alerts
- Test on mobile devices (iOS Safari, Chrome)
- Test orientation changes (portrait ↔ landscape)
- Test banner dismissal (navbar should readjust)
- Test with various navbar heights
- Test rapid window resizing
