# LogoClasses Validation Bug Fix

**Date**: February 2, 2026  
**Issue**: logoClasses field rejected valid CSS classes  
**Status**: ✅ FIXED

---

## Problem

When trying to save CSS classes (e.g., `'w-36 sm:w-40'`) in the **logoClasses** field in `/admin/settings`, the following validation error appeared:

```
Validation Error
Validation errors: logoClasses must be valid SVG markup starting with <svg>
```

### User Input

- Field: Logo CSS Classes
- Value: `w-36 sm:w-40`
- Expected: Should save as CSS classes
- Actual: Rejected with SVG validation error

---

## Root Cause

**File**: `src/pages/admin/settings.astro`  
**Line**: 1470 (original)

The validation logic was checking if the database key includes "logo" OR "icon", and if so, requiring the value to be valid SVG markup starting with `<svg>`:

```typescript
// BEFORE (buggy code):
if ((dbKey.includes("logo") || dbKey.includes("icon")) && trimmedValue) {
  if (!trimmedValue.trim().startsWith("<svg")) {
    validationErrors.push(
      `${formKey.replace("_", " ")} must be valid SVG markup starting with <svg>`
    );
    continue;
  }
}
```

**Problem**: Since `logoClasses` contains "logo" in its name, it was incorrectly being treated as SVG markup instead of CSS classes.

---

## Solution

Added an explicit exclusion for `logoClasses` in the SVG validation check:

```typescript
// AFTER (fixed code):
if ((dbKey.includes("logo") || dbKey.includes("icon")) && trimmedValue && dbKey !== "logoClasses") {
  if (!trimmedValue.trim().startsWith("<svg")) {
    validationErrors.push(
      `${formKey.replace("_", " ")} must be valid SVG markup starting with <svg>`
    );
    continue;
  }
}
```

**Key Change**: Added `&& dbKey !== "logoClasses"` to exclude it from SVG validation.

---

## What This Fixes

### Now Works ✅

- `w-36 sm:w-40` - Responsive width sizing
- `h-8 w-auto` - Standard sizing
- `h-12 w-auto text-primary-600` - Size with color
- `h-10 w-32 dark:text-white` - Dark mode support
- Any valid Tailwind CSS classes

### Still Validated ✅

- `logo` field - Still requires SVG markup
- `logoInverted` field - Still requires SVG markup
- `icon*` fields - Still require SVG markup
- `logoClasses` field - Now accepts any text (CSS classes)

---

## Testing

### Test Case 1: Valid CSS Classes

1. Go to `/admin/settings`
2. Find "Logo CSS Classes" field
3. Enter: `w-36 sm:w-40`
4. Click "Save Settings"
5. **Expected**: ✅ Saves successfully without validation error

### Test Case 2: Other Logo Fields Still Validated

1. Find "Logo SVG" field (the textarea)
2. Enter: `w-36 sm:w-40` (not SVG markup)
3. Click "Save Settings"
4. **Expected**: ✅ Shows validation error (correct behavior)

### Test Case 3: Empty logoClasses

1. Clear the "Logo CSS Classes" field
2. Click "Save Settings"
3. **Expected**: ✅ Saves successfully

---

## Files Modified

1. ✅ `src/pages/admin/settings.astro` (line 1470) - Fixed validation logic
2. ✅ `markdowns/logo-classes-feature.md` - Updated documentation with bug fix details

---

## Related Documentation

- `markdowns/logo-classes-feature.md` - Full feature documentation
- `src/pages/api/settings/update.ts` - Backend handling (already correct)
- `src/components/ui/Logo.astro` - Logo component that uses logoClasses

---

## Summary

The bug was a simple oversight in the validation logic. The fix is minimal (one condition added) and surgical (doesn't affect other validations). The `logoClasses` field can now properly accept CSS classes while other logo/icon fields continue to require valid SVG markup.

**Status**: ✅ Bug fixed and documented
