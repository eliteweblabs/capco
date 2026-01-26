# Fix: Profile Page Phone & SMS Visibility Issue

## Problem

On the profile page (`/profile`), when users had existing phone numbers and SMS settings, the SMS section and carrier selection were not visible. This prevented users from:

1. Seeing their SMS alert preferences
2. Viewing their selected mobile carrier
3. Updating their SMS settings

## Root Cause

The `PhoneAndSMS.astro` component had several issues:

### Issue 1: Hidden by Default with `visibility: hidden`

```astro
<div id={smsSectionId} style="visibility: hidden;"></div>
```

The SMS section was hidden using `visibility: hidden`, which meant it would only become visible when JavaScript validated the phone number. On the profile page with pre-populated phone values, this validation wasn't happening correctly.

### Issue 2: Carrier Selection Not Initialized

```astro
<div id={carrierSelectionId}></div>
```

The carrier selection didn't have proper initial visibility state - it should be shown when `smsChecked` is true.

### Issue 3: Invalid Initial State Logic

The script only showed the SMS section when the phone was validated as valid, but on page load with existing values, the validation wasn't running properly:

```javascript
// Old logic
if (isValid) {
  smsSection.style.visibility = "visible";
} else {
  smsSection.style.visibility = "hidden";
}
```

## Solution

### Fix 1: Use CSS Class Instead of Inline Style

Changed from `visibility: hidden` to using the `hidden` class, and conditionally apply it based on whether a phone value exists:

```astro
<div id={smsSectionId} class={value ? "" : "hidden"}></div>
```

This ensures that if a phone value is passed in (like on the profile page), the SMS section is visible by default.

### Fix 2: Initialize Carrier Selection Visibility

```astro
<div id={carrierSelectionId} class={smsChecked ? "" : "hidden"}></div>
```

Show carrier selection immediately if SMS is already checked (existing setting).

### Fix 3: Improved Toggle Logic

Updated the `toggleSmsSection()` function to show the section if there's ANY phone value, not just a valid one:

```javascript
function toggleSmsSection() {
  const phoneValue = phoneInput.value.trim();
  const isValid = validatePhoneNumber(phoneValue);

  if (isValid || phoneValue) {
    // Show if valid OR if there's any phone value (to allow editing)
    smsSection.classList.remove("hidden");
    // Show validation indicator only if actually valid
    if (phoneIndicator && isValid) {
      phoneIndicator.classList.remove("hidden");
      phoneIndicator.classList.add("flex");
    }
  } else {
    // Hide only if completely empty
    smsSection.classList.add("hidden");
  }
}
```

### Fix 4: Better Initial State Handling

```javascript
// Format initial phone value if present
if (phoneInput.value.trim()) {
  phoneInput.value = formatPhone(phoneInput.value);
}

// Initial state - show SMS section if phone has value or SMS is checked
if (phoneInput.value.trim() || smsAlertsCheckbox.checked) {
  smsSection.classList.remove("hidden");
  toggleSmsSection();
}
```

This ensures:

1. Existing phone values are formatted on page load
2. SMS section is shown if phone exists OR SMS is already checked
3. Proper validation indicators are shown

## Files Changed

- `/src/components/form/PhoneAndSMS.astro`
  - Line 86: Changed `style="visibility: hidden;"` to `class={value ? "" : "hidden"}`
  - Line 99: Added `class={smsChecked ? "" : "hidden"}` to carrier selection
  - Lines 209-231: Updated `toggleSmsSection()` logic
  - Lines 254-263: Improved initial state handling

## Testing Scenarios

### Scenario 1: Profile Page with Existing Phone & SMS

- **Before:** SMS section hidden, can't see or edit settings
- **After:** SMS section visible, toggle shows checked state, carrier shows selected value

### Scenario 2: Profile Page with Phone but No SMS

- **Before:** SMS section hidden
- **After:** SMS section visible, toggle shows unchecked state, carrier selection hidden

### Scenario 3: Registration Flow (New User)

- **Before:** SMS section appears after valid phone entered
- **After:** Same behavior - SMS section appears when phone has value

### Scenario 4: Profile Page with No Phone

- **Before:** SMS section hidden (correct)
- **After:** SMS section hidden (same, correct behavior)

## LibPhonenumber-js Integration

The component uses `libphonenumber-js` for:

1. Phone number validation (`isValidPhoneNumber()`)
2. Format-as-you-type functionality (`AsYouType()`)

This integration works correctly - the fix ensures that the SMS section visibility doesn't depend solely on real-time validation, allowing pre-populated values to display correctly.

## Related Files

- `/src/pages/profile.astro` - Profile page that uses PhoneAndSMS component
- `/src/lib/phone-validation.ts` - Phone validation utilities
- `/src/lib/sms-utils.ts` - SMS carrier utilities

## User Impact

Users can now:

- ✅ See their SMS alert preferences on the profile page
- ✅ View their selected mobile carrier
- ✅ Edit their phone number and SMS settings
- ✅ Toggle SMS alerts on/off
- ✅ Change their mobile carrier

## Technical Notes

- The component now properly handles both:
  - Empty initial state (registration)
  - Pre-populated state (profile editing)
- Uses CSS classes instead of inline styles for better maintainability
- Maintains proper validation indicators (green checkmark for valid phone)
- Preserves all existing functionality while fixing the visibility issue
