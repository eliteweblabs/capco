# Animated Placeholder Autofill Fix - Feb 2026

## Problem
Animated placeholders were continuing to display even when inputs had values, either from:
1. Browser autofill (e.g., saved passwords, email addresses)
2. Form pre-fill via `initialData` prop
3. Values present on page load

The placeholder animation would continue cycling on top of the actual input value, creating a poor user experience.

## Root Cause Analysis

### Issue 1: Missing Autofill Detection
The documentation (`autofill-placeholder-fix.md`) described an autofill detection system using CSS animations and `animationstart` events, but this code was **never actually implemented** in `MultiStepForm.astro`.

### Issue 2: Incomplete initialData Handling
When forms were pre-filled using `initialData`, the code only hid placeholders for `firstName` and `lastName` fields, ignoring other fields like `email` that also have animated placeholders.

### Issue 3: Timing Issues
The initial value check ran during `DOMContentLoaded`, which happens before browser autofill completes in many cases. There were no delayed checks or fallback mechanisms.

## Solution

### 1. Implemented Autofill Detection
Added the missing autofill detection system that listens for the CSS animation triggered by browser autofill:

```javascript
// Listen for autofill detection via CSS animation
input.addEventListener("animationstart", (e: AnimationEvent) => {
  if (e.animationName === "onAutoFillStart") {
    console.log(`[ANIMATED-PLACEHOLDER] Autofill detected for ${input.id}`);
    checkAndHidePlaceholder();
  }
});
```

The CSS animation is defined in `global.css`:
```css
@keyframes onAutoFillStart {
  from { /**/ }
  to { /**/ }
}

input:-webkit-autofill {
  animation-name: onAutoFillStart;
  animation-duration: 0.001s;
}
```

### 2. Added Delayed Checks
Implemented fallback delayed checks for browsers that don't support animation detection:

```javascript
// Check initial value immediately
checkAndHidePlaceholder();

// Delayed checks for autofill (fallback)
setTimeout(checkAndHidePlaceholder, 100);
setTimeout(checkAndHidePlaceholder, 500);
```

### 3. Refactored to Use Helper Function
Extracted placeholder visibility logic into a reusable `checkAndHidePlaceholder()` function that:
- Checks if input has a value
- Shows/hides the placeholder accordingly
- Logs the action for debugging

### 4. Fixed initialData Handling
Updated the pre-fill logic to handle **all** fields with animated placeholders, not just `firstName` and `lastName`:

```javascript
// Hide animated placeholder if this input has one
if (input.hasAttribute("data-has-animated-placeholder")) {
  const span = document.querySelector(
    `.animated-placeholder[data-for="${input.id}"]`
  ) as HTMLElement;
  if (span) {
    span.style.display = "none";
    console.log(`[MULTISTEP-FORM] Hid animated placeholder for ${key}`);
  }
}
```

## Files Modified
- `src/components/form/MultiStepForm.astro` (lines 662-696, 909-924)

## Changes Summary

### Before
```javascript
animatedInputs.forEach((input) => {
  const span = document.querySelector(/* ... */);
  if (span) {
    input.addEventListener("input", () => {
      if (input.value) {
        span.style.display = "none";
      } else {
        span.style.display = "flex";
      }
    });
    // Check initial value
    if (input.value) {
      span.style.display = "none";
    }
  }
});
```

### After
```javascript
animatedInputs.forEach((input) => {
  const span = document.querySelector(/* ... */);
  if (span) {
    const checkAndHidePlaceholder = () => {
      if (input.value) {
        span.style.display = "none";
        console.log(`[ANIMATED-PLACEHOLDER] Hiding placeholder for ${input.id} (has value)`);
      } else {
        span.style.display = "flex";
      }
    };

    // Listen for manual input changes
    input.addEventListener("input", checkAndHidePlaceholder);

    // Listen for autofill detection via CSS animation
    input.addEventListener("animationstart", (e: AnimationEvent) => {
      if (e.animationName === "onAutoFillStart") {
        console.log(`[ANIMATED-PLACEHOLDER] Autofill detected for ${input.id}`);
        checkAndHidePlaceholder();
      }
    });

    // Check initial value immediately
    checkAndHidePlaceholder();

    // Delayed checks for autofill (fallback)
    setTimeout(checkAndHidePlaceholder, 100);
    setTimeout(checkAndHidePlaceholder, 500);
  }
});
```

## Testing Checklist

### Test Autofill
1. Open `/auth/register` or `/contact` 
2. Use browser autofill (saved email/password)
3. ✅ Placeholder should disappear immediately
4. Clear the field
5. ✅ Placeholder should reappear and animate

### Test Pre-fill (initialData)
1. Open a form that uses `initialData` (e.g., edit profile)
2. ✅ All pre-filled fields should have hidden placeholders
3. Clear a pre-filled field
4. ✅ Placeholder should reappear and animate

### Test Manual Input
1. Open any form with animated placeholders
2. Type in a field
3. ✅ Placeholder should hide as soon as you type
4. Clear the field
5. ✅ Placeholder should reappear

### Test Step Navigation
1. Fill in a field on step 1
2. Navigate to step 2
3. Navigate back to step 1
4. ✅ Placeholder should still be hidden for filled field
5. ✅ Empty fields should show animated placeholders

## Browser Compatibility
- **Chrome/Edge/Safari**: Uses CSS animation detection (primary method)
- **Firefox**: Uses delayed setTimeout checks (fallback)
- **All browsers**: Manual input detection always works

## Related Documentation
- Animated placeholder system: `markdowns/animated-placeholder-system.md`
- Previous autofill fix attempt: `markdowns/autofill-placeholder-fix.md`
- Form configurations: `src/lib/forms/*.ts`

## Notes
The previous `autofill-placeholder-fix.md` documentation was describing a solution that was never fully implemented. This update completes that implementation and extends it to handle all edge cases, including `initialData` pre-fill and page load values.
