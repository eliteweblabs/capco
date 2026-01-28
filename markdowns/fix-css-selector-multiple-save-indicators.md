# CSS Selector Specificity Bug - Multiple Save Indicators

## Problem

When editing ONE due date field, **THREE save indicators** (spinner icons) were appearing on ALL due date fields in the table, not just the one being edited.

## Root Cause

The CSS selector was too broad:

```css
/* OLD - TOO BROAD */
.relative:has(input[data-refresh="true"][data-edited="true"].saving)::after
```

This selector matched **ANY** `.relative` element that **contains** an input with those attributes, even if deeply nested. Since all due date fields on the page are wrapped in `<div class="relative inline-block">`, when ONE input got the `.saving` class, ALL wrappers matched the selector!

### Why This Happened:

The `:has()` pseudo-class without a direct child selector (`>`) checks **all descendants**, not just direct children.

```html
<!-- ALL THREE of these matched the selector when ANY input had .saving -->
<div class="relative inline-block">
  <input data-refresh="true" data-edited="true" class="saving" /> <!-- EDITED THIS -->
</div>

<div class="relative inline-block">
  <input data-refresh="true" /> <!-- NOT EDITED, but its wrapper still matched! -->
</div>

<div class="relative inline-block">
  <input data-refresh="true" /> <!-- NOT EDITED, but its wrapper still matched! -->
</div>
```

## The Fix

Added `.inline-block` for more specificity and used `>` (direct child) selector:

```css
/* NEW - SPECIFIC */
.relative.inline-block:has(> input[data-refresh="true"][data-edited="true"].saving)::after
```

Now the selector **ONLY** matches:
1. Elements with BOTH `.relative` AND `.inline-block` classes
2. That have a DIRECT child (`>`) input with the `.saving` class
3. Not inputs nested deeper in the tree

## Changes Made

**File**: `/src/styles/global.css`

Updated all save indicator selectors (lines 962-1017):
- Base `::after` element
- `.saving` state (spinner)
- `.saved` state (checkmark)
- `.save-error` state (red X)
- `.fade-out` animation

**Before:**
```css
.relative:has(input[data-refresh="true"][data-edited="true"].saving)::after
```

**After:**
```css
.relative.inline-block:has(> input[data-refresh="true"][data-edited="true"].saving)::after
```

## Result

✅ **ONE save indicator** appears next to the field being edited
✅ Other fields remain unaffected
✅ Indicator correctly shows spinner → checkmark → fade out
✅ No more "phantom" save indicators on other elements

## Debugging Process

1. User noticed 3 save indicators appearing for 1 edit
2. Added `debugger` to JavaScript to confirm `.saving` class was only on one element ✅
3. Inspected DOM - confirmed only ONE element had `.saving` class ✅
4. But saw THREE `::after` pseudo-elements rendering!
5. Discovered all `::after` elements were attached to `div.relative.inline-block::after`
6. Realized CSS selector was matching ALL `.relative` wrappers, not just the one with `.saving` inside
7. Fixed selector to use `.inline-block` + `>` for direct child matching

## Key Lesson

**CSS `:has()` selector scope:**
- `:has(input.saving)` - matches if `input.saving` exists **anywhere** inside (any depth)
- `:has(> input.saving)` - matches **ONLY** if `input.saving` is a direct child

When working with `::after` on parent wrappers, always use `>` to ensure you're targeting the right parent!

---

**Status**: ✅ **FIXED**

**Files Modified**:
- `/src/styles/global.css` - Updated CSS selectors for save indicators
- `/src/scripts/project-item-handlers.ts` - Removed debugger statements (cleanup)
