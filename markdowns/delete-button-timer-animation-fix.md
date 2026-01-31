# Delete Button Timer Animation Fix

## Issue
Delete button was working functionally but the timer ring animation wasn't showing - it didn't have the same visual effect as in other delete buttons throughout the app.

## Root Cause
The CSS styles for the timer ring animation were defined in `DeleteConfirmButton.astro`, but since punchlist items are loaded via partials (fetch/HTMX), the component styles weren't being included in the page.

## Solution
Added the timer ring CSS and icon manipulation logic directly to `PunchlistDrawer.astro`.

### Changes Made

**File: `/src/components/project/PunchlistDrawer.astro`**

#### 1. Added Global Styles (at end of file)
```css
<style is:global>
  @keyframes draw-ring {
    from { stroke-dashoffset: 113.1; }
    to { stroke-dashoffset: 0; }
  }

  .delete-confirm-wrapper {
    position: relative;
    display: inline-flex;
  }

  .timer-ring-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .delete-confirm-wrapper:has([data-state="confirm"]) .timer-ring-overlay {
    opacity: 1 !important;
  }

  .delete-confirm-wrapper:has([data-state="confirm"]) .timer-icon-test {
    animation: draw-ring 3000ms linear forwards;
  }

  .delete-confirm-wrapper [data-state="confirm"] .delete-confirm-icon {
    display: none;
  }
</style>
```

#### 2. Updated First Click Handler
Added:
- Find timer ring elements
- Reset animation (remove/re-add class to restart)
- Change trash icon to stopwatch icon
- Show timer ring via CSS state change

```javascript
// Find the wrapper and timer ring
const wrapper = button.closest(".delete-confirm-wrapper");
const timerRing = wrapper?.querySelector(".timer-ring-overlay");
const timerCircle = timerRing?.querySelector(".timer-icon-test");

if (timerCircle) {
  // Reset animation
  timerCircle.classList.remove("timer-icon-test");
  void timerCircle.offsetWidth; // Force reflow
  timerCircle.classList.add("timer-icon-test");
}

// Change icon to stopwatch
const iconElement = button.querySelector(".delete-confirm-icon");
if (iconElement) {
  iconElement.outerHTML = `<svg class="inline-block stopwatch-icon">...</svg>`;
}
```

#### 3. Added resetButton Helper Function
```javascript
function resetButton(button) {
  button.setAttribute("data-state", "trash");
  button.title = "Delete punchlist item";

  // Restore trash icon
  const stopwatchIcon = button.querySelector(".stopwatch-icon");
  if (stopwatchIcon) {
    stopwatchIcon.outerHTML = `<svg class="inline-block delete-confirm-icon">...</svg>`;
  }
}
```

#### 4. Updated Timeout Handler
Now calls `resetButton(button)` instead of manually setting attributes.

## How It Works Now

### Visual Flow

**Initial State:**
- Trash icon visible
- Timer ring hidden (opacity: 0)
- `data-state="trash"`

**First Click:**
1. Changes `data-state="confirm"`
2. CSS triggers: `.delete-confirm-wrapper:has([data-state="confirm"])`
3. Timer ring fades in (opacity: 1)
4. Timer animation starts (stroke-dashoffset: 113.1 → 0)
5. Trash icon swapped for stopwatch icon
6. Duration: 3000ms

**Second Click (within 3s):**
1. Calls API to delete
2. Resets button to trash state
3. Timer ring fades out
4. Stopwatch icon swapped back to trash

**Timeout (no second click):**
1. Auto-reverts to trash state
2. Timer ring fades out
3. Stopwatch icon swapped back to trash

## CSS Animation Details

### Timer Ring
- SVG circle with `stroke-dasharray` and `stroke-dashoffset`
- Animation draws the circle by reducing dashoffset from 113.1 to 0
- Red stroke (#ef4444)
- Positioned absolutely over the button
- Pointer-events: none (clicks pass through to button)

### State-Based Visibility
Uses modern `:has()` selector:
```css
.delete-confirm-wrapper:has([data-state="confirm"]) .timer-ring-overlay {
  opacity: 1 !important;
}
```

This shows the timer ring when the button inside has `data-state="confirm"`.

### Icon Swap
- Trash icon has class `.delete-confirm-icon`
- Hidden when state is "confirm"
- Replaced with `.stopwatch-icon` via JavaScript
- Swapped back on reset

## Browser Compatibility

### :has() Selector
- Chrome/Edge 105+
- Firefox 121+
- Safari 15.4+

**Fallback:** If `:has()` not supported, functionality still works but timer ring won't show. Can add fallback class-based approach if needed.

## Testing

### Visual Verification
1. Open punchlist drawer
2. Click delete button
3. **Should see:**
   - Timer ring appears and animates (red circle drawing clockwise)
   - Trash icon changes to stopwatch/clock icon
   - Visual feedback that button is in confirm state

4. Click again within 3 seconds
5. **Should see:**
   - Item deletes
   - Button returns to normal
   - Timer ring disappears

6. Or wait 3 seconds without clicking
7. **Should see:**
   - Button auto-reverts
   - Timer ring disappears
   - Back to trash icon

### Console Logs
```
[PUNCHLIST-DELETE] 🎯 FIRST CLICK - showing confirm state
[PUNCHLIST-DELETE] Resetting timer animation
[PUNCHLIST-DELETE] Changing icon to stopwatch
[PUNCHLIST-DELETE] ✅ Waiting for confirmation...
```

## Why Global Styles?

Used `<style is:global>` because:
1. Punchlist items are loaded via partials
2. Component-scoped styles don't apply to dynamically loaded content
3. Global styles are always available
4. Class names are specific enough to avoid conflicts

## Files Modified
- `/src/components/project/PunchlistDrawer.astro`
  - Added `<style is:global>` section with timer ring CSS
  - Updated first click handler to manipulate timer ring and icon
  - Added `resetButton()` helper function
  - Updated timeout handler to use reset function

## Comparison with ProjectItem

The timer ring effect should now be identical to the delete buttons in `ProjectItem.astro` and other places in the app where `DeleteConfirmButton` is used directly (not via partials).

**Same Features:**
- ✅ Red circular timer animation
- ✅ Icon swap (trash ↔ stopwatch)
- ✅ 3-second countdown
- ✅ Auto-revert on timeout
- ✅ Smooth opacity transitions
- ✅ Visual feedback

## Future Improvements

If other components also load items via partials and need delete buttons:
1. Move these global styles to a shared stylesheet
2. Or include them in `App.astro` / global CSS
3. Or create a utility CSS file for delete button animations

For now, having them in `PunchlistDrawer.astro` works since that's where they're needed.
