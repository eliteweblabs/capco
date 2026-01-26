# Dynamic Phone Button Text - Implementation

## Overview

Updated the phone number input step in both registration and contact forms to dynamically change the "Next/Skip" button text based on phone validation status.

## Behavior

The button text now changes in real-time as the user types:

1. **Empty field**: Shows "Skip" (or "skip" for contact form)
2. **Valid phone number**: Shows "Next" (or "next" for contact form)
3. **Invalid phone number**: Shows "Skip" (or "skip" for contact form)

## Implementation Details

### Registration Form (`MultiStepRegisterForm.astro`)

**Button HTML Changes:**

```astro
<!-- Before -->
<Button ...> Next / Skip </Button>

<!-- After -->
<Button ...>
  <span id="next-step-phone-text">Skip</span>
</Button>
```

**JavaScript Logic:**

```typescript
phoneInput.addEventListener("input", (e) => {
  // ... existing formatting logic ...

  // Update button text based on phone validation
  if (phoneButtonText) {
    if (!formatted || formatted.trim() === "") {
      phoneButtonText.textContent = "Skip";
    } else if (validatePhone(formatted)) {
      phoneButtonText.textContent = "Next";
    } else {
      phoneButtonText.textContent = "Skip";
    }
  }
});
```

### Contact Form (`ContactForm.astro`)

**Button HTML Changes:**

```astro
<!-- Before -->
<Button ...> next / skip </Button>

<!-- After -->
<Button ...>
  <span id="contact-next-step-phone-text">skip</span>
</Button>
```

**JavaScript Logic:**
Same as registration form, but with lowercase text:

- "skip" instead of "Skip"
- "next" instead of "Next"

## User Experience Benefits

1. **Immediate Feedback**: Users instantly know if their phone number is valid
2. **Clear Action**: Button text clearly indicates what will happen when clicked
3. **Reduced Confusion**: No ambiguous "Next / Skip" - always shows the correct action
4. **Validation Indicator**: Acts as a subtle validation indicator without intrusive error messages

## Technical Notes

- Uses existing `validatePhone()` function from `lib/phone-validation.ts`
- Validation happens on every input event as user types
- No additional API calls or performance impact
- Maintains existing form submission logic
- Works alongside existing phone formatting (`formatPhoneAsYouType`)

## Files Modified

1. `src/components/form/MultiStepRegisterForm.astro`
   - Line 343: Updated button HTML with span wrapper
   - Lines 738-779: Added button text update logic

2. `src/features/contact-form/components/ContactForm.astro`
   - Line 176: Updated button HTML with span wrapper
   - Lines 403-446: Added button text update logic

## Testing

To test the feature:

1. Navigate to registration page or contact form
2. Proceed to the phone number step
3. Observe button text changes:
   - Start typing: Shows "Skip"
   - Complete valid phone: Shows "Next"
   - Delete some digits: Shows "Skip" again
4. Verify clicking works correctly for both scenarios

## Future Enhancements

Possible improvements:

- Add visual styling changes (color, icon) based on validation state
- Add smooth transition animation when text changes
- Show checkmark icon when valid
- Add tooltip explaining why it's "Skip" vs "Next"
