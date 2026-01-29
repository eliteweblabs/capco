# Swipe-to-Close Drawers Implementation

**Date**: 2026-01-29  
**Status**: ✅ Complete

## Summary

Added swipe-to-close functionality to both the sidebar and punchlist drawer, and renamed all "checklist" references to "punchlist" for consistency.

## Changes Made

### 1. ToggleSidebar.astro - Swipe to Close Sidebar

Added touch event handlers to enable swipe-to-close functionality on mobile:

- **Touch Events**: `touchstart`, `touchmove`, `touchend`
- **Swipe Direction**: Left (to close the sidebar)
- **Threshold**: 100px minimum swipe distance
- **Behavior**:
  - Temporarily disables CSS transitions during drag for smooth tracking
  - Updates `transform` in real-time as user swipes
  - Closes sidebar if swipe exceeds threshold
  - Only active on mobile (< 640px)

**Location**: Lines 279-329

### 2. Punchlist.astro - Renamed Checklist to Punchlist

Updated all references from "checklist" to "punchlist":

- `checklist-drawer-toggle` → `punchlist-drawer-toggle`
- `checklist-drawer-backdrop` → `punchlist-drawer-backdrop`
- `checklist-drawer` → `punchlist-drawer`
- `checklist-drawer-close` → `punchlist-drawer-close`
- "Project Checklist" → "Project Punchlist"
- "View Checklist" → "View Punchlist"

### 3. Punchlist.astro - Swipe to Close Drawer

Added touch event handlers to enable swipe-to-close functionality:

- **Touch Events**: `touchstart`, `touchmove`, `touchend`
- **Swipe Direction**: Right (to close the drawer, since it slides in from the right)
- **Threshold**: 100px minimum swipe distance
- **Behavior**:
  - Temporarily disables CSS transitions during drag for smooth tracking
  - Updates `transform` in real-time as user swipes
  - Closes drawer if swipe exceeds threshold
  - Works on all screen sizes

**Location**: Lines 445-497

## Technical Details

### Swipe Detection Algorithm

Both implementations use the same approach:

1. **touchstart**: Capture starting X/Y coordinates, disable transitions
2. **touchmove**: Calculate delta from start, update transform if horizontal swipe detected
3. **touchend**: Check if swipe distance exceeds threshold, close if yes, reset state

### Key Features

- ✅ Vertical scroll preserved (only responds to horizontal swipes)
- ✅ Smooth visual feedback during drag
- ✅ 100px threshold prevents accidental closes
- ✅ Respects existing close methods (button, backdrop, ESC key)
- ✅ Mobile-optimized (sidebar swipe only on mobile)

## Files Modified

1. `/src/components/ui/ToggleSidebar.astro` - Added swipe-to-close for sidebar
2. `/src/components/project/Punchlist.astro` - Renamed checklist → punchlist, added swipe-to-close

## Testing Checklist

- [ ] Test sidebar swipe-to-close on mobile devices
- [ ] Test sidebar swipe doesn't interfere with content scrolling
- [ ] Test punchlist drawer swipe-to-close on all screen sizes
- [ ] Test punchlist drawer swipe doesn't interfere with content scrolling
- [ ] Verify all punchlist drawer buttons still work (toggle, close, backdrop)
- [ ] Verify sidebar buttons still work (toggle, close, backdrop)
- [ ] Test ESC key still closes both drawers
- [ ] Verify punchlist count badge still updates correctly

## Notes

- The `ListBlock.astro` component intentionally keeps its "checklist" variant name as it's a generic list styling option, not related to the punchlist drawer
- Swipe directions are opposite: sidebar swipes LEFT to close (from left edge), punchlist swipes RIGHT to close (from right edge)
- Both implementations use 100px threshold to prevent accidental triggering
