# CMS Page Ordering Touch Support Fix

**Date:** 2026-01-31  
**Issue:** Drag and drop page ordering in CMS admin panel didn't work on touch devices  
**Fixed by:** Adding touch event handlers alongside existing mouse drag events

## Problem

The CMS admin page (`/admin/cms`) uses HTML5 drag and drop API for reordering pages, which only works with mouse input. Touch devices (tablets, phones) couldn't reorder pages.

## Solution

Added comprehensive touch event support while maintaining existing mouse drag functionality:

### Key Changes in `/src/pages/admin/cms.astro`

1. **Touch Event Handlers Added:**
   - `touchstart`: Initiates drag, captures starting position
   - `touchmove`: Tracks finger movement, updates visual position, highlights drop targets
   - `touchend`: Completes reorder, updates database
   - `touchcancel`: Handles cancellation and cleanup

2. **Visual Feedback for Touch:**
   - 50% opacity on dragged element
   - Scale up effect (105%)
   - Shadow effect
   - Element follows finger position
   - Border highlights on potential drop targets

3. **Code Refactoring:**
   - Extracted database update logic into `updatePageOrder()` function
   - Added `getDragAfterElement()` helper for touch position detection
   - Both mouse and touch events use same update function

## Technical Implementation

### Touch Start

```javascript
row.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length !== 1) return;
    draggedElement = row;
    touchStartY = e.touches[0].clientY;
    row.classList.add("opacity-50", "scale-105", "z-50", "shadow-lg");
    e.preventDefault();
  },
  { passive: false }
);
```

### Touch Move

```javascript
row.addEventListener(
  "touchmove",
  (e) => {
    if (!draggedElement || e.touches.length !== 1) return;
    e.preventDefault();
    touchCurrentY = e.touches[0].clientY;
    const deltaY = touchCurrentY - touchStartY;
    draggedElement.style.transform = `translateY(${deltaY}px)`;
    // Update visual indicators...
  },
  { passive: false }
);
```

### Touch End

```javascript
row.addEventListener(
  "touchend",
  async (e) => {
    if (!draggedElement) return;
    const afterElement = getDragAfterElement(tbody, touchCurrentY);
    // Reorder DOM
    if (afterElement == null) {
      tbody.appendChild(draggedElement);
    } else {
      tbody.insertBefore(draggedElement, afterElement);
    }
    // Reset styles and update database
    await updatePageOrder();
  },
  { passive: false }
);
```

## Benefits

1. **Cross-Platform:** Works on desktop (mouse) and mobile (touch)
2. **Consistent UX:** Same visual feedback across devices
3. **Maintainable:** Shared database update logic
4. **Robust:** Handles edge cases (multi-touch, cancellation)

## Testing

Test on:

- ✅ Desktop browser with mouse
- ✅ Mobile Safari (iOS)
- ✅ Mobile Chrome (Android)
- ✅ Tablet devices
- ✅ Touch-enabled laptops

## Related Files

- `/src/pages/admin/cms.astro` - Main implementation
- `/src/pages/api/cms/pages.ts` - API endpoint for order updates

## Git History Fix

During this commit, we also cleaned up git history to remove accidentally committed API keys from:

- `markdowns/railway-missing-variables-check.md`

The file was sanitized and the commit history was rewritten to prevent GitHub push protection from blocking the deployment.
