# Tooltip Mobile Clickable Implementation Summary

## Date: 2026-01-31

## Problem
Tooltips globally did not work on mobile devices unless they were set to `open={true}` (always visible). This was problematic for tooltips attached to non-interactive elements like spans or icons, as they couldn't be toggled on touch devices.

## Solution
Added a new `mobileClickable` parameter to the Tooltip component that enables mobile-friendly tap-to-toggle functionality.

## Changes Made

### 1. Updated Type Definitions
**File**: `src/lib/tooltip-styles.ts`
- Added `mobileClickable?: boolean` to `TooltipStyleConfig` interface
- Updated `getTooltipClasses()` function to accept and handle the new parameter
- Added `mobile-clickable-tooltip` CSS class to wrapper when `mobileClickable={true}`

### 2. Updated Tooltip Component
**File**: `src/components/common/Tooltip.astro`
- Added `mobileClickable?: boolean` to the Props interface
- Extracted `mobileClickable` from both props and X-headers for partial support
- Passed `mobileClickable` to `getTooltipClasses()` function
- Added client-side script to handle touch device interactions:
  - Detects touch devices using `'ontouchstart' in window || navigator.maxTouchPoints > 0`
  - Toggles tooltip visibility on tap for elements with `.mobile-clickable-tooltip` class
  - Prevents interception of clicks on buttons, links, and inputs
  - Closes tooltip when tapping outside

### 3. Updated Partial Wrapper
**File**: `src/pages/partials/tooltip.astro`
- Added `mobileClickable` parameter extraction from both props and headers
- Passed `mobileClickable` to the TooltipComponent

### 4. Documentation
**File**: `markdowns/tooltip-mobile-clickable-parameter.md`
- Comprehensive documentation explaining the feature
- Usage examples and best practices
- Comparison with old approach
- Technical implementation details

### 5. Test Page
**File**: `src/pages/tests/tooltip-mobile-test.astro`
- Created comprehensive test page with multiple tooltip examples
- Demonstrates standard, always-open, and mobile-clickable tooltips
- Shows all tooltip positions (top, bottom, left, right)
- Includes examples of when to use and when not to use `mobileClickable`

## Usage

### Basic Usage
```astro
<Tooltip text="Tap me on mobile" mobileClickable={true}>
  <span>Content with tooltip</span>
</Tooltip>
```

### When to Use
- ✅ Non-interactive elements (spans, divs, icons)
- ✅ Supplementary information that should be hidden by default
- ✅ Elements that won't navigate or trigger other actions

### When NOT to Use
- ❌ Buttons or links (they handle their own clicks)
- ❌ Critical information (use `open={true}` instead)
- ❌ When tooltip should always be visible

## How It Works

1. **Desktop**: Tooltips work normally with hover (no change in behavior)
2. **Mobile**: 
   - Detects touch device capability
   - Adds click handler to tooltip wrapper
   - Toggles opacity classes on tap
   - Closes on outside tap
   - Preserves native behavior for interactive elements

## Testing

To test the implementation:
1. Navigate to `/tests/tooltip-mobile-test`
2. On desktop: Hover over tooltips to see them appear
3. On mobile (or dev tools mobile emulation): Tap on mobile-clickable tooltips to toggle them

## Browser Compatibility

Works on all modern browsers that support:
- Touch Events API
- `classList` manipulation
- ES6+ JavaScript

## Impact

- No breaking changes to existing tooltips
- Opt-in feature via `mobileClickable` parameter
- Backwards compatible with all existing tooltip implementations
- Script only runs if mobile-clickable tooltips are present on the page

## Files Modified
1. `src/lib/tooltip-styles.ts`
2. `src/components/common/Tooltip.astro`
3. `src/pages/partials/tooltip.astro`

## Files Created
1. `markdowns/tooltip-mobile-clickable-parameter.md`
2. `src/pages/tests/tooltip-mobile-test.astro`

## Next Steps

Consider updating existing tooltips in the codebase that could benefit from `mobileClickable`:
- SpeedDial component tooltips (currently using `open={true}`)
- Info icons that are non-interactive
- Help tooltips on form fields
- Status indicators with tooltips
