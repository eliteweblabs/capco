# Modal Overlay Dynamic Z-Index

## Overview

The global modal overlay (`#global-backdrop`) now supports dynamic z-index adjustment for cases where different modals need to appear at different z-index levels.

## Problem Solved

Previously, the global modal overlay had a fixed z-index of 1000 set in `App.astro`. This caused issues when:
- Modals needed to appear above other fixed-position elements with high z-indexes
- Different contexts required different stacking orders
- Case-by-case z-index adjustments were needed

## Solution

Added three new utility functions available globally via `window`:

### 1. `showModal()` with `zIndex` option

You can now pass a `zIndex` parameter when showing a modal:

```javascript
window.showModal({
  title: "My Modal",
  body: "<p>Content here</p>",
  zIndex: 10010, // Custom z-index for this modal's overlay
  onConfirm: () => console.log("Confirmed")
});
```

### 2. `setModalOverlayZIndex(zIndex)`

Directly set the z-index of the global overlay before opening a modal:

```javascript
// Set overlay z-index to 10010
window.setModalOverlayZIndex(10010);

// Now open your modal using any method
document.getElementById('my-modal').classList.remove('hidden');
```

### 3. `resetModalOverlayZIndex()`

Reset the overlay z-index back to default (1000):

```javascript
// Reset to default
window.resetModalOverlayZIndex();
```

## Implementation Details

### Files Modified

1. **`src/lib/ux-utils.ts`**:
   - Added `zIndex` parameter to `showModal()` function
   - Added `resetZIndex` parameter to `hideModal()` function (defaults to true)
   - Added `setModalOverlayZIndex()` function
   - Added `resetModalOverlayZIndex()` function
   - When `showModal()` is called with a `zIndex`, it applies it to the overlay
   - When `hideModal()` is called, it automatically resets the global overlay z-index to 1000

2. **`src/lib/modal-global.ts`**:
   - Exported new functions to window object
   - Updated TypeScript declarations

3. **`src/components/ui/App.astro`**:
   - Updated window interface TypeScript declarations
   - No change to the base z-index (still 1000)

### Default Behavior

- Global modal overlay default z-index: **1000**
- When `hideModal()` is called on a modal using the global overlay, the z-index is automatically reset to 1000
- If you don't specify a custom `zIndex`, the behavior is unchanged

### Use Cases

```javascript
// Example 1: High-priority modal that needs to be above everything
window.showModal({
  title: "Critical Alert",
  body: "<p>This appears above all other elements</p>",
  zIndex: 99999
});

// Example 2: Set overlay z-index before triggering Flowbite modal
window.setModalOverlayZIndex(10010);
// ... then trigger your modal however you normally would

// Example 3: Reset after closing
window.hideModal('my-modal'); // Automatically resets z-index
// or manually:
window.resetModalOverlayZIndex();
```

## Console Logging

The functions include helpful console logs for debugging:
- `🎨 [UX-UTILS] Setting overlay z-index to {zIndex} for modal {id}`
- `🎨 [UX-UTILS] Reset overlay z-index to default (1000) for modal {id}`
- `🎨 [UX-UTILS] Set global overlay z-index to {zIndex}`
- `🎨 [UX-UTILS] Reset global overlay z-index to default (1000)`

## Notes

- The z-index is only applied to the **global modal overlay** (`#global-backdrop`)
- If a modal creates its own overlay, the z-index parameter is used when creating that overlay
- Auto-reset behavior only applies to the global overlay, not modal-specific overlays
- All functions are available globally via `window` object
