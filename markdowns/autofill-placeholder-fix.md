# Autofill Placeholder Fix

## Status: ✅ IMPLEMENTED (Feb 2026)

See `animated-placeholder-autofill-fix.md` for the complete implementation details.

## Problem

Animated placeholders were not disappearing when browser autofill populated input fields. The placeholder would remain visible on top of the autofilled value.

## Solution Implemented

The fix now includes:

1. CSS animation detection for autofill events
2. Event listener for `animationstart` with autofill detection
3. Delayed fallback checks for browsers without animation support
4. Fixed `initialData` pre-fill to handle all fields with animated placeholders

## Files Modified

- `src/components/form/MultiStepForm.astro`

## Testing

Visit any form with animated placeholders:

- `/auth/register` - Registration form
- `/mep-form` - MEP contractor form
- `/contact` - Contact form

Test scenarios:

1. Use browser autofill
2. Pre-fill via `initialData`
3. Manual input
4. Step navigation

All scenarios should properly hide/show placeholders based on input value.
