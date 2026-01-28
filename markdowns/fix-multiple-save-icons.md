# Fix: Multiple Save Icons Showing Simultaneously

## Problem

User reported multiple save icons (disk/floppy) showing at the same time across different project rows, even though only one field was being edited.

**Root Cause:** When editing a field on Project A, then switching to edit a field on Project B, the `data-edited="true"` attribute was NOT being cleared from Project A's field. This caused the CSS selector to match BOTH fields:

```css
.relative:has(input[data-refresh="true"][data-edited="true"].saving)::after {
  /* Show save icon */
}
```

## Solution

**Before editing any field, clear `data-edited` from ALL other elements:**

```javascript
// CRITICAL: Clear data-edited from ALL OTHER elements first
document.querySelectorAll('[data-edited="true"]').forEach((el) => {
  if (el !== currentElement) {
    el.removeAttribute("data-edited");
    el.classList.remove("saving", "saved", "save-error", "fade-out");
  }
});

// NOW mark THIS element as being edited
currentElement.setAttribute("data-edited", "true");
```

## Why This Fixes It

### Before Fix:
1. User clicks +/- on Project 1 → `Project1.input[data-edited="true"]` + `.saving` → Icon shows ✅
2. User clicks +/- on Project 2 → `Project2.input[data-edited="true"]` + `.saving` → Icon shows ✅
3. **Problem:** Project 1 STILL has `data-edited="true"` from step 1!
4. Result: **Both icons show** because both have `[data-edited="true"]`

### After Fix:
1. User clicks +/- on Project 1 → Clear all others → Set `Project1.input[data-edited="true"]` → Icon shows ✅
2. User clicks +/- on Project 2 → **Clear all others (removes Project 1's `data-edited`)** → Set `Project2.input[data-edited="true"]` → Only Project 2 icon shows ✅
3. Result: **Only ONE icon shows at a time**

## Files Modified

- `/src/scripts/project-item-handlers.ts`
  - Updated `window.adjustDueDate()` to clear all `data-edited` before setting
  - Updated `window.updateProjectField()` to clear all `data-edited` before setting

## Testing

1. Reload dashboard (hard refresh: Cmd+Shift+R)
2. Click +/- on Project 1's due date
3. Verify save icon shows ONLY next to Project 1
4. Click +/- on Project 2's due date  
5. Verify save icon moves to Project 2 (disappears from Project 1)
6. Edit multiple projects rapidly
7. Verify only ONE save icon shows at a time

## Key Insight

**`data-edited="true"` is a "singleton" state** - only ONE element should have it at any time. This ensures the CSS `:has()` selector only matches ONE element, showing ONE icon.

Before this fix, `data-edited` could accumulate on multiple elements, causing multiple icons to appear simultaneously.
