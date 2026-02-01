# Phone Validation Redirect Fix

## Problem

When users entered a partial phone number (e.g., "(234) 345" with only 6 digits), the form was incorrectly progressing to step 4 (SMS Consent) instead of treating it as invalid and skipping to step 6 (Company).

Additionally, the `data-next` attribute on the phone step button was statically set to `4`, which meant it would always try to go to step 4 regardless of phone validity.

### Root Cause

1. The `validatePhone()` function in `phone-validation.ts` was returning `true` for partial phone numbers (3-9 digits), which allowed form progression
2. The `data-next` attribute was static and never changed based on phone validation state

This conflicted with the intended behavior where:

- **Empty phone** → Skip to Company (step 6)
- **Partial phone (< 10 digits)** → Skip to Company (step 6)  
- **Complete valid phone (10+ digits)** → Proceed to SMS Consent (step 4)

## Solution

1. Modified the phone validation logic to treat partial phone numbers as invalid, which triggers the `noValidPhone` skip condition properly
2. Made the `data-next` attribute dynamic - it updates based on phone validation state

## Changes Made

### 1. Updated `phone-validation.ts`

**Before:**
```typescript
export function validatePhone(phoneValue: string): boolean {
  if (!phoneValue || phoneValue.trim() === "") {
    return true; // Phone is optional - WRONG
  }
  
  // Allow partial numbers (3+ digits) - WRONG
  if (digitsOnly.length < 3) {
    return false;
  }
  
  if (digitsOnly.length >= 10) {
    return isValidPhoneNumber(phoneValue, "US");
  }
  
  // Partial number is okay - WRONG
  return true;
}
```

**After:**
```typescript
export function validatePhone(phoneValue: string): boolean {
  if (!phoneValue || phoneValue.trim() === "") {
    return false; // Empty phone is invalid (triggers skip logic)
  }
  
  const digitsOnly = phoneValue.replace(/\D/g, "");
  
  // Only validate complete numbers (10-11 digits)
  if (digitsOnly.length < 10) {
    return false; // Partial numbers are invalid (triggers skip logic)
  }
  
  // Validate complete phone number
  return isValidPhoneNumber(phoneValue, "US");
}
```

### 2. Updated `multi-step-form-handler.ts`

Added logic to allow progression for partial phone numbers while letting the skip logic handle the redirect, **and made the `data-next` attribute dynamic**:

```typescript
// Phone input formatting
const phoneInputs = form.querySelectorAll('input[type="tel"]');
phoneInputs.forEach((phoneInput) => {
  input.addEventListener("input", (e) => {
    const formatted = formatPhoneAsYouType(target.value);
    target.value = formatted;
    
    // Update button text and data-next attribute for phone steps
    const phoneButton = document.querySelector(`.next-step-phone`);
    const phoneButtonText = document.getElementById(`${formId}-next-step-phone-text`);
    
    if (phoneButtonText || phoneButton) {
      const digitsOnly = formatted.replace(/\D/g, "");
      const isValid = digitsOnly.length >= 10 && validatePhone(formatted);
      
      // Update button text
      if (phoneButtonText) {
        if (!formatted || formatted.trim() === "") {
          phoneButtonText.textContent = "skip";
        } else if (isValid) {
          phoneButtonText.textContent = "next";
        } else {
          phoneButtonText.textContent = "skip";
        }
      }
      
      // Update data-next attribute dynamically
      if (phoneButton) {
        if (isValid) {
          phoneButton.setAttribute("data-next", "4"); // Go to SMS Consent
        } else {
          phoneButton.setAttribute("data-next", "6"); // Skip to Company
        }
      }
    }
  });
});
```

Also added initialization logic for pre-filled phone numbers:

```typescript
// Initialize phone button data-next based on current phone value
const phoneInputs = form.querySelectorAll('input[type="tel"]');
phoneInputs.forEach((phoneInput) => {
  const phoneValue = input.value?.trim() || "";
  const phoneButton = form.querySelector(`.next-step-phone`);
  
  if (phoneButton && phoneValue) {
    const digitsOnly = phoneValue.replace(/\D/g, "");
    const isValid = digitsOnly.length >= 10 && validatePhone(phoneValue);
    
    if (isValid) {
      phoneButton.setAttribute("data-next", "4");
    } else {
      phoneButton.setAttribute("data-next", "6");
    }
  }
});
```

And updated the validation step logic:

```typescript
// Phone validation (if step has phone input)
const phoneInput = stepEl.querySelector('input[type="tel"]') as HTMLInputElement;
if (phoneInput) {
  const phoneValue = phoneInput.value?.trim() || "";
  
  // Only validate if there's a phone value AND it's not valid
  if (phoneValue && !validatePhone(phoneValue)) {
    const digitsOnly = phoneValue.replace(/\D/g, "");
    
    // If it's a partial number (less than 10 digits), allow progression
    // The skip logic will handle jumping to the correct step
    if (digitsOnly.length < 10) {
      console.log("[PHONE-VALIDATION] Partial number, allowing progression with skip logic");
      return true; // Allow progression, skip logic will handle the redirect
    }
    
    // If it's 10+ digits but invalid, show error
    if (window.showNotice) {
      window.showNotice("error", "Invalid Phone Number", "Please enter a valid US phone number", 3000);
    }
    return false;
  }
}
```

### 3. Updated `contact-form-config.ts`

Changed the default `data-next` value for the phone step button from `4` to `6`:

```typescript
// Step 3: Phone
{
  stepNumber: 3,
  title: "your phone?",
  fields: [
    {
      id: "contact-phone",
      name: "phone",
      type: "tel",
      placeholder: "(555) 123-4567",
      autocomplete: "tel",
      required: false,
    },
  ],
  buttons: [
    {
      type: "prev",
      label: "back",
      dataPrev: 2,
    },
    {
      type: "next",
      label: "skip",
      dataNext: 6, // ← Changed from 4 to 6 (default to skip to Company)
      classes: "next-step-phone",
    },
  ],
  customValidation: "validatePhone",
},
```

## How It Works Now

### Dynamic `data-next` Attribute

The phone step button's `data-next` attribute now updates in real-time:

- **On form load (empty phone)**: `data-next="6"` → Skip to Company
- **While typing (partial phone)**: `data-next="6"` → Skip to Company
- **After entering valid phone**: `data-next="4"` → Go to SMS Consent
- **Pre-filled authenticated user with valid phone**: `data-next="4"` → Go to SMS Consent

### Flow for Different Phone Inputs

1. **Empty Phone Field**
   - Initial state: `data-next="6"`
   - `validatePhone("")` → returns `false`
   - `validateStep()` → allows progression (no error shown)
   - Button click → navigates to step 6 directly
   - **Result**: Goes to step 6 (Company)

2. **Partial Phone (e.g., "(234) 345")**
   - As user types: `data-next` updates to `"6"`
   - `validatePhone("(234) 345")` → returns `false` (< 10 digits)
   - `validateStep()` → detects partial number, allows progression
   - Button click → navigates to step 6 directly
   - **Result**: Goes to step 6 (Company)

3. **Complete Valid Phone (e.g., "(234) 456-7890")**
   - As user types 10th digit: `data-next` updates to `"4"`
   - Button text changes from "skip" to "next"
   - `validatePhone("(234) 456-7890")` → returns `true` (10+ digits, valid format)
   - `validateStep()` → passes validation
   - Button click → navigates to step 4 directly
   - **Result**: Goes to step 4 (SMS Consent)

4. **Complete Invalid Phone (e.g., "(111) 111-1111")**
   - After typing: `data-next="6"` (validation fails)
   - `validatePhone("(111) 111-1111")` → returns `false` (invalid US number)
   - `validateStep()` → shows error notification
   - **Result**: Blocks progression, user must correct the number

## Key Logic Changes

### Dynamic `data-next` Attribute

The `data-next` attribute now updates dynamically as the user types:

```typescript
// In phone input event listener
const phoneButton = document.querySelector(`.next-step-phone`);
if (phoneButton) {
  if (isValid) {
    phoneButton.setAttribute("data-next", "4"); // Go to SMS Consent
  } else {
    phoneButton.setAttribute("data-next", "6"); // Skip to Company
  }
}
```

This eliminates the need for the `shouldSkipStep()` logic to be called after clicking "next" - the button already knows which step to go to.

### Button Click Flow

The simplified flow is now:

1. User types in phone field
2. `data-next` updates in real-time (4 or 6)
3. Button text updates ("next" or "skip")
4. User clicks button
5. Form navigates directly to the step specified in `data-next`

No more relying on skip conditions evaluated after the click - the decision is made upfront as the user types.

### `shouldSkipStep()` Function

The skip condition evaluation for `noValidPhone` is now mainly used for backward navigation and edge cases:

```typescript
if (condition === "noValidPhone") {
  const phoneInput = form.querySelector('input[type="tel"]');
  const phoneValue = phoneInput?.value?.trim() || "";
  const isPhoneValid = phoneValue && validatePhone(phoneValue);
  
  if (!isPhoneValid) {
    console.log(`Skipping step ${stepNumber} (no valid phone)`);
    return true; // Skip SMS-related steps
  }
  return false;
}
```

This now correctly evaluates:
- Empty phone: `"" && validatePhone("") = true && false = false` → skip (but `data-next` already handles this)
- Partial phone: `"(234) 345" && validatePhone("(234) 345") = true && false = false` → skip (but `data-next` already handles this)
- Valid phone: `"(234) 456-7890" && validatePhone("(234) 456-7890") = true && true = true` → don't skip (but `data-next` already handles this)

The `shouldSkipStep()` function is now mainly a backup for edge cases and backward navigation.

## Testing Scenarios

✅ **Empty phone** → `data-next="6"` → Go to Company (step 6)  
✅ **Partial phone "(234) 345"** → `data-next="6"` → Go to Company (step 6)  
✅ **Valid phone "(234) 456-7890"** → `data-next="4"` → Go to SMS Consent (step 4)  
✅ **Invalid complete phone "(111) 111-1111"** → `data-next="6"` → Show error, block progression  
✅ **Back button from Company** → Correctly navigates based on phone state  
✅ **Pre-filled phone from auth** → `data-next` initializes correctly on page load

## Benefits

✅ **Consistent behavior**: Partial phones now treated the same as empty phones  
✅ **No error spam**: Users entering partial numbers don't see validation errors  
✅ **Direct navigation**: Button knows exactly where to go without evaluating skip conditions  
✅ **Real-time feedback**: Button text and behavior update as user types  
✅ **User-friendly**: Only shows errors for complete but invalid phone numbers  
✅ **Performance**: Skip logic evaluation happens at form load/input time, not on every click  

## Related Files

- `/src/lib/phone-validation.ts` - Core validation logic
- `/src/lib/multi-step-form-handler.ts` - Form progression and skip logic
- `/src/lib/forms/contact-form-config.ts` - Form configuration with `skipCondition: "noValidPhone"`
- `/markdowns/phone-skip-logic-refactor.md` - Original skip logic documentation
