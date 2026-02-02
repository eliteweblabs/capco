# Animated Placeholder Stagger Delay

## Overview

The MultiStepForm component includes a **staggered delay** for successive animated placeholders within a panel/step. This creates a cascading animation effect where multiple input fields with animated placeholders don't all change simultaneously.

## Location

File: `src/components/form/MultiStepForm.astro`

Functions: 
- `rotatePlaceholders()` (around line 871)
- `resetPlaceholderAnimation()` (around line 961)

## Critical Code (DO NOT REMOVE)

### In rotatePlaceholders() - Line ~944

```typescript
// Line 943-944 - CRITICAL: Stagger delay for successive placeholders
// Not part of a sync group, use normal staggered delay
const staggerDelay = stepIndex * 100;
```

### In resetPlaceholderAnimation() - Line ~991

```typescript
// Line 990-991 - CRITICAL: Stagger delay for reset/initial display
// Apply stagger delay for reset animation too
const staggerDelay = stepIndex * 100;
```

The stagger delay is calculated as:
- **Formula**: `stepIndex * 100` milliseconds
- **stepIndex**: The index of the input within the active step (0, 1, 2, etc.)
- **Result**: 0ms, 100ms, 200ms, 300ms, etc. for successive fields

## How It Works

### In rotatePlaceholders() (Ongoing Cycles)

1. When `rotatePlaceholders()` is called every 2 seconds, it finds all animated inputs in the active step
2. For each input (not in a sync group):
   - Calculate its position within the step (`stepIndex`)
   - Apply a stagger delay: `stepIndex * 100ms`
   - After the delay, trigger the placeholder animation

### In resetPlaceholderAnimation() (Initial Display)

1. When a step becomes active, `resetPlaceholderAnimation()` is called
2. For each input in the active step:
   - Calculate its position within the step (`stepIndex`)
   - Apply the same stagger delay: `stepIndex * 100ms`
   - After the delay, show the first placeholder with animation

### Sync Groups

**Sync Groups** (like firstName/lastName) animate together with **NO stagger delay** (line 928-935 in rotatePlaceholders)

## Example

If a step has 3 input fields with animated placeholders:
- **Initial display (resetPlaceholderAnimation):**
  - Field 1: Animates at 0ms (instantly)
  - Field 2: Animates at 100ms (after Field 1)
  - Field 3: Animates at 200ms (after Field 2)

- **Subsequent rotations (rotatePlaceholders):**
  - Field 1: Animates at 0ms
  - Field 2: Animates at 100ms
  - Field 3: Animates at 200ms

This creates a smooth, cascading effect on both initial display AND during rotation cycles.

## History

This feature has been:
- ✅ Initially implemented in `rotatePlaceholders()`
- ❌ Missing from `resetPlaceholderAnimation()` causing first appearance to be simultaneous
- ✅ **Fixed (Feb 2, 2026)**: Added stagger delay to `resetPlaceholderAnimation()`
- ❌ Accidentally removed in the past
- ✅ Re-added multiple times
- 🛡️ **Now protected** with rules and documentation

## Protection

**⚠️ CRITICAL**: This code must be protected from accidental removal.

A workspace rule has been created to prevent this from being touched during refactoring or optimization.

## Related Code Sections

- **rotatePlaceholders()** (lines ~871-959):
  - Sync group logic (lines ~897-937): Fields like firstName/lastName animate together
  - Normal stagger logic (lines ~938-958): Other fields use the stagger delay
  
- **resetPlaceholderAnimation()** (lines ~961-1000):
  - Applies stagger delay for initial display when step becomes active
  - Same 100ms delay as rotation cycles

## Testing

To verify the stagger delay is working:
1. Navigate to a multi-step form with multiple animated placeholder fields
2. **Test initial display**: When the step first appears, verify placeholders don't all appear at once
3. **Test rotation cycles**: Observe the placeholders cycling through values
4. Verify they don't all change at the exact same time
5. There should be a visible 100ms delay between each field's animation
6. This should happen BOTH on initial display AND during subsequent rotations

## Bug Fix (Feb 2, 2026)

### Problem
The stagger delay was only implemented in `rotatePlaceholders()`, not in `resetPlaceholderAnimation()`.

**Result**: 
- Initial display: All placeholders appeared simultaneously (no stagger)
- Rotation cycles: Placeholders rotated with proper stagger delay

**User complaint**: "im not seeing the delay"

### Root Cause
The `resetPlaceholderAnimation()` function was resetting all placeholders to their first value and triggering the `slideInDown` animation on ALL fields at once with NO stagger delay:

```typescript
// OLD CODE (buggy):
span.style.animation = "slideInDown 400ms ease-out forwards"; // All at once!
```

### Solution
Added the same stagger delay logic to `resetPlaceholderAnimation()`:

```typescript
// NEW CODE (fixed):
const staggerDelay = stepIndex * 100;
setTimeout(() => {
  data.index = 0;
  span.textContent = data.values[0];
  span.style.animation = "slideInDown 400ms ease-out forwards";
}, staggerDelay);
```

Now BOTH functions apply the stagger delay consistently.

## Notes

- The 100ms delay is intentional and creates better UX
- Sync groups (firstName/lastName) should remain synchronized with NO delay
- Don't modify this value without user approval
- The stagger delay MUST be in BOTH functions for consistent behavior
