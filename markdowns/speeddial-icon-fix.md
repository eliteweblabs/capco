# SpeedDial Icon Fix

## Issue
Icons in the SpeedDial component were not showing at all - they had 0 width.

## Root Causes

### 1. Missing Class Attribute in SVG Icons
The `getIcon()` function in `src/lib/simple-icons.ts` was trying to replace `class=""` attributes that didn't exist in the icon-data.json SVG strings. The SVG elements had no class attribute at all.

**Fix:** Updated the `getIcon()` function to:
- Check if a `class` attribute exists in the SVG
- If it exists, replace it
- If it doesn't exist, inject it after the opening `<svg` tag

### 2. Missing inline-block Display Class
The most critical issue: SimpleIcon component was removing the `inline-block` class that `getIcon()` added, and replacing it with only the custom classes (like "mr-0"). This caused SVG elements to have `width="24" height="24"` attributes but no CSS display property, causing them to collapse to **0 width**.

**Fix:** Updated `SimpleIcon.astro` to always include `inline-block` as a base class:
```typescript
const baseClasses = "inline-block";
const finalClasses = [baseClasses, className, variantClasses].filter(Boolean).join(" ");
```

### 3. Incorrect Icon Classes in SpeedDial
The `iconClasses` constant was defined as `"h-12 w-12 p-0 m-0"` which:
- Set icon sizes to 48x48px (way too large)
- This likely caused icons to be clipped or hidden

**Fix:** Changed `iconClasses` to just `"mr-0"` to remove right margin and let the Button component's size prop control the icon size properly.

### 4. Duplicate Class Attributes
Several buttons had duplicate `class` attributes:
- Tutorial button: had both `class="p-0"` and `class={buttonClasses}`
- Contact button: had both `class="p-0"` and `class={buttonClasses}`

**Fix:** Removed the duplicate `class` attributes, keeping only `class={buttonClasses}`.

### 5. Inconsistent Icon Classes
Some buttons used `iconClasses={iconClasses}` while others used `iconClasses="mr-0"`.

**Fix:** Standardized all buttons to use `iconClasses={iconClasses}` for consistency.

## Files Modified

1. **src/lib/simple-icons.ts**
   - Updated the `getIcon()` function to properly inject class attributes

2. **src/components/common/SimpleIcon.astro**
   - Added `inline-block` as a base class to ensure SVGs render with proper width
   - This was the critical fix for the 0-width issue

3. **src/components/ui/SpeedDial.astro**
   - Fixed `iconClasses` constant value
   - Removed duplicate `class` attributes
   - Standardized all buttons to use consistent icon classes

## Testing
After these changes, all icons in the SpeedDial should now be visible and properly sized at 24x24px:
- Book (Tutorial)
- Bug (Debug - Admin only)
- User (Login)
- Phone (Call)
- Comment-dots (Feedback)
- Message-square (Contact)

## Technical Details
The icon sizing system works as follows:
- `size="lg"` prop → `iconSize = 24` (pixels)
- `getIcon()` replaces `width="16"` and `height="16"` with `width="24"` and `height="24"`
- `inline-block` class ensures the SVG respects its width/height attributes
- Without `inline-block`, SVGs collapse to 0 width despite having valid width/height attributes

## Date
2026-01-25
