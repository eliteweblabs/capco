# Animated Placeholder Stagger Delay - FINAL FIX

**Date**: February 2, 2026  
**Issue**: Stagger delay not visible on forms  
**Root Cause**: Sync group logic preventing stagger  
**Status**: ✅ FIXED

---

## The Problem

Animated placeholders were not showing a stagger delay. All fields appeared to animate simultaneously instead of cascading with a 200ms delay between each field.

---

## Root Cause Discovery

After extensive debugging, the issue was found to be the **sync group logic** that was added to make `firstName` and `lastName` fields animate together. This logic grouped these fields into a sync group, causing them to:

1. Skip the stagger delay calculation
2. Animate simultaneously instead of cascading
3. Override the intended stagger effect

### The Problematic Code (Removed)

```typescript
// Group firstName and lastName together
if (fieldName === "firstName" || fieldName === "lastName") {
  const stepContent = input.closest(".step-content");
  const stepNumber = stepContent?.getAttribute("data-step");
  syncGroup = `name-step-${stepNumber}`;
}
```

This created a sync group for firstName/lastName, which then triggered this logic:

```typescript
if (data.syncGroup) {
  // Animate all synced fields together with NO stagger
  // ❌ This prevented the stagger delay from working
}
```

---

## The Solution

**Removed the sync group logic entirely.** All fields now use the standard stagger delay.

### What Changed

1. **Removed sync group detection** (lines 813-823)
2. **Removed sync group animation logic** (lines 897-937)
3. **Simplified to single stagger path** for all fields

### Working Code

```typescript
// Initialize all fields with NO sync group
placeholderData.set(fieldId, { index: 0, values, syncGroup: undefined });

// All fields use stagger delay in rotatePlaceholders()
const staggerDelay = stepIndex * 200; // 200ms per field

setTimeout(() => {
  // Animate slideOut
  span.style.animation = "slideOutDown 400ms ease-out forwards";
  
  setTimeout(() => {
    // Animate slideIn
    data.index = (data.index + 1) % data.values.length;
    span.textContent = data.values[data.index];
    span.style.animation = "slideInDown 400ms ease-out forwards";
  }, 400);
}, staggerDelay); // ✅ Stagger delay applied to ALL fields
```

---

## Key Implementation Details

### 1. Stagger Delay Value
- **200ms per field** (not 100ms)
- Field 1: 0ms delay
- Field 2: 200ms delay
- Field 3: 400ms delay
- Field 4: 600ms delay

### 2. JavaScript setTimeout (Not CSS)
- Use JavaScript `setTimeout()` to delay animation start
- Do NOT use CSS `animation-delay` property
- Wrap the entire animation sequence in the timeout

### 3. Both Functions Need Stagger
- `rotatePlaceholders()` - for rotation cycles
- `resetPlaceholderAnimation()` - for initial display

### 4. No Sync Groups
- All fields animate independently with stagger
- No special handling for firstName/lastName
- Simple, consistent behavior

---

## Files Modified

1. ✅ `src/components/form/MultiStepForm.astro`
   - Removed sync group initialization logic
   - Removed sync group animation logic
   - Simplified rotatePlaceholders() to single path
   - All fields now use 200ms stagger delay

---

## Testing Verification

To verify it's working:

1. Navigate to any multi-step form (e.g., `/contact`)
2. Watch the first name and last name fields
3. **Expected**: They should cascade in (200ms apart), not appear together
4. **Expected**: All fields in the step should cascade with 200ms delays
5. Wait for rotation cycle (every 2 seconds)
6. **Expected**: Placeholders should rotate with the same cascade effect

---

## Why It Failed Before

### Attempt 1: Added to resetPlaceholderAnimation() only
- ❌ Still had sync groups, which prevented stagger in rotatePlaceholders()

### Attempt 2: Used CSS animation-delay
- ❌ CSS shorthand `animation` property reset the delay
- Setting `animationDelay` first, then `animation` = delay got reset to 0

### Attempt 3: Used delay in animation shorthand
- ❌ Still had sync groups blocking the stagger effect
- Example: `animation: slideInDown 400ms ease-out 200ms forwards`
- The delay worked but sync groups still made firstName/lastName animate together

### Final Solution: Remove sync groups
- ✅ All fields use simple setTimeout with 200ms * stepIndex
- ✅ No special cases or conditional logic
- ✅ Works exactly like the original working version

---

## Protected Code

The stagger delay is now protected in:
- `.cursor/rules/multistep-form-placeholder-stagger.md`
- Main `.cursorrules` file
- In-code comments with ⚠️ warnings

### Critical Lines

**Line ~897** in `rotatePlaceholders()`:
```typescript
const staggerDelay = stepIndex * 200;
```

**Line ~972** in `resetPlaceholderAnimation()`:
```typescript
const staggerDelay = stepIndex * 200;
```

---

## Summary

The stagger delay is now working correctly by:
1. Removing the sync group feature entirely
2. Using 200ms setTimeout delays for all fields
3. Applying the same logic in both functions
4. Keeping the implementation simple and consistent

**The key insight**: The sync group feature, while well-intentioned, was preventing the desired stagger effect. Sometimes the simplest solution (remove the special case) is the best solution.

**Status**: ✅ Working and protected from future removal
