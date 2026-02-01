# Autofill Placeholder Fix

## Problem
Animated placeholders were not disappearing when browser autofill populated input fields. The placeholder would remain visible on top of the autofilled value.

## Root Cause
Browser autofill happens asynchronously, often after the initial JavaScript check for `input.value` has already run. The original code only checked for values on page load and during manual input events, missing autofilled values.

## Solution
Implemented multiple detection strategies to catch autofilled values:

### 1. CSS Animation Detection (Primary Method)
Added keyframe animations that trigger when Chrome/webkit browsers apply autofill:

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

When autofill occurs, this triggers an `animationstart` event that JavaScript can listen for.

### 2. Event Listener
Added listener for the `animationstart` event in the JavaScript:

```javascript
input.addEventListener("animationstart", (e: AnimationEvent) => {
  if (e.animationName === "onAutoFillStart") {
    checkAndHidePlaceholder();
  }
});
```

### 3. Delayed Checks (Fallback)
Added delayed checks as a fallback for browsers/scenarios where the animation method doesn't work:

```javascript
setTimeout(checkAndHidePlaceholder, 100);
setTimeout(checkAndHidePlaceholder, 500);
```

### 4. Refactored Logic
Extracted the placeholder visibility logic into a reusable function:

```javascript
const checkAndHidePlaceholder = () => {
  if (input.value) {
    span.style.display = "none";
  } else {
    span.style.display = "flex";
  }
};
```

This function is called:
- On initial load
- On manual input changes
- When autofill is detected
- After delayed timeouts

## Files Modified
- `src/components/form/MultiStepForm.astro` (lines 550-582, 1018-1047)

## Browser Compatibility
- **Chrome/Edge/Safari**: Works via CSS animation detection
- **Firefox**: Works via delayed checks
- **All browsers**: Manual input always works

## Testing
To test:
1. Open a form with animated placeholders (e.g., `/mep-form`, `/contact`, `/auth/register`)
2. Allow browser to autofill email/name fields
3. Verify animated placeholder disappears immediately
4. Clear the field and verify placeholder reappears

## Related
- Animated placeholder system: `markdowns/animated-placeholder-system.md`
- Form configurations: `src/lib/forms/`
