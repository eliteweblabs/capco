# Animated Placeholder Browser Autofill Fix

## Issue
The animated placeholder feature was displaying over fields that had been auto-filled by the browser, creating a visual conflict where both the autofilled value and the animated placeholder were visible.

## Root Cause
Browser autofill can happen at various times during page load:
- Immediately on page load
- After a short delay (100-500ms)
- After the user interacts with the page
- After JavaScript initialization completes
- Asynchronously after other scripts load

Additionally, different browsers handle autofill differently:
- Chrome/Edge: Sets values and applies `:autofill` pseudo-class
- Firefox: May delay applying values
- Safari: Uses `-webkit-autofill` pseudo-class

## Solution

### 1. Multi-Method Autofill Detection

**Direct Pseudo-Class Checking**:
```typescript
const isAutofilled = input.matches(":-webkit-autofill") || input.matches(":autofill");
```
This directly checks if the browser has marked the field as autofilled, regardless of timing.

**Value Checking**:
```typescript
const hasValue = input.value && input.value.length > 0;
```
Basic check for any value in the field.

### 2. Extended Detection Timing
Added multiple delayed checks to catch autofill at various times:
- Immediate check (0ms)
- Early check (100ms)
- Medium check (500ms)
- Late check (1000ms)
- Very late check (1500ms)
- Ultra late check (2500ms) - catches very slow autofill

### 3. Multiple Event Listeners

**Input Event**: Catches manual typing
```typescript
input.addEventListener("input", checkAndHidePlaceholder);
```

**Change Event**: Catches browser autofill in some browsers
```typescript
input.addEventListener("change", checkAndHidePlaceholder);
```

**CSS Animation Detection**: Uses keyframes to detect autofill styling
```typescript
input.addEventListener("animationstart", (e: AnimationEvent) => {
  if (e.animationName === "onAutoFillStart") {
    checkAndHidePlaceholder();
  }
});
```

### 4. MutationObserver
Watches for attribute changes that some browsers apply during autofill:
```typescript
const observer = new MutationObserver(() => {
  checkAndHidePlaceholder();
});
observer.observe(input, { 
  attributes: true, 
  attributeFilter: ['value', 'data-value'] 
});
```

### 5. Pre-Animation Check
Before starting any placeholder animation, checks all fields one final time:
```typescript
const hasValue = input.value && input.value.length > 0;
const isAutofilled = input.matches(":-webkit-autofill") || input.matches(":autofill");

if (span && (hasValue || isAutofilled)) {
  span.style.display = "none";
}
```

### 6. Continuous Validation During Animation
During the rotation loop, continuously checks autofill state:
```typescript
const hasValue = input.value && input.value.length > 0;
const isAutofilled = input.matches(":-webkit-autofill") || input.matches(":autofill");

if (span && data && !hasValue && !isAutofilled && span.style.display !== "none") {
  // Only then rotate placeholder
}
```

## Files Modified
- `/src/components/form/MultiStepForm.astro`

## Testing
To test this fix:
1. Open a form with animated placeholders (e.g., login or registration)
2. Enable browser autofill with saved credentials
3. Test in multiple browsers (Chrome, Firefox, Safari, Edge)
4. Reload the page and let the browser autofill the fields
5. Try both immediate autofill and delayed autofill scenarios
6. Verify that animated placeholders do NOT appear over autofilled values
7. Verify that placeholders still animate for empty fields
8. Try clearing a field and verify placeholder reappears

## Browser Compatibility
- ✅ Chrome/Edge: Uses `:autofill` pseudo-class
- ✅ Safari: Uses `:-webkit-autofill` pseudo-class
- ✅ Firefox: Caught by value checks and change events
- ✅ All browsers: Fallback to timed checks ensures coverage

## Related Files
- `/src/styles/global.css` - Contains autofill CSS animation detection
- `.cursor/rules/multistep-form-placeholder-stagger.md` - Protected stagger delay logic
- `markdowns/animated-placeholder-stagger-delay.md` - Original stagger implementation docs

## Date
February 2, 2026

## Updates
- Initial fix: Added delayed checks and pre-animation validation
- Enhanced fix: Added pseudo-class checking, change event listener, and MutationObserver for comprehensive autofill detection across all browsers
