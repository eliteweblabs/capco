# libphonenumber-js Phone Inputs Audit

**Date**: 2026-01-29  
**Purpose**: Audit all phone inputs to ensure libphonenumber-js is properly integrated

## Summary

✅ **libphonenumber-js** is installed: `v1.12.35` (in package.json)  
✅ **Central validation library exists**: `src/lib/phone-validation.ts` uses libphonenumber-js  
✅ **Most multi-step forms** properly use the validation library

## Phone Inputs by File

### ✅ PROPERLY CONFIGURED (Using libphonenumber-js)

#### 1. **MultiStepRegisterForm.astro**

- **Location**: `src/components/form/MultiStepRegisterForm.astro`
- **Status**: ✅ Fully configured
- **Implementation**:
  ```typescript
  import { validatePhone, formatPhoneAsYouType } from "../../lib/phone-validation";
  ```
- **Features**:
  - Real-time formatting with `formatPhoneAsYouType()`
  - Validation with `validatePhone()`
  - Dynamic button text ("Skip" vs "next")

#### 2. **ContactForm.astro** (Features)

- **Location**: `src/features/contact-form/components/ContactForm.astro`
- **Status**: ✅ Fully configured
- **Implementation**:
  ```typescript
  import { validatePhone, formatPhoneAsYouType } from "../../../lib/phone-validation";
  ```
- **Features**:
  - Real-time formatting
  - Validation on submission
  - Dynamic button text

#### 3. **JSONMultiStepForm.astro**

- **Location**: `src/components/form/JSONMultiStepForm.astro`
- **Status**: ✅ Fully configured
- **Implementation**:
  ```typescript
  import { validatePhone, formatPhoneAsYouType } from "../../lib/phone-validation";
  ```
- **Features**:
  - Automatically applies to ALL `input[type="tel"]` in the form
  - Real-time formatting
  - Validation on step navigation

#### 4. **PhoneAndSMS.astro**

- **Location**: `src/components/form/PhoneAndSMS.astro`
- **Status**: ✅ Fully configured
- **Implementation**:
  - Imports both from npm package AND validation library:
    ```typescript
    import { isValidPhoneNumber, AsYouType } from "libphonenumber-js";
    import { validatePhone, formatPhoneAsYouType } from "../../lib/phone-validation";
    ```
- **Features**:
  - Real-time formatting
  - Validation with visual indicator (green checkmark)
  - SMS opt-in integration
  - Mobile carrier selection

---

### ⚠️ MISSING LIBPHONENUMBER (Need to Add)

#### 5. **ContactFormWithUpload.astro**

- **Location**: `src/components/common/ContactFormWithUpload.astro`
- **Status**: ❌ NOT using libphonenumber-js
- **Current**: Plain `<input type="tel">` with no validation/formatting
- **Line**: 82
  ```astro
  <input type="tel" id="phone" name="phone" autocomplete="tel" class={globalInputClasses} />
  ```
- **Action Needed**: Add phone formatting and validation

#### 6. **settings.astro** (Admin Settings)

- **Location**: `src/pages/admin/settings.astro`
- **Status**: ❌ NOT using libphonenumber-js
- **Current**: Plain `<input type="tel">` for company phone
- **Line**: 231
  ```astro
  <input
    type="tel"
    id="phone"
    name="phone"
    value={settings.phone}
    class={globalInputClasses}
    placeholder="+1234567890"
  />
  ```
- **Action Needed**: Add phone formatting (validation optional for company phone)

#### 7. **ContactForm.astro** (Root)

- **Location**: `src/ContactForm.astro`
- **Status**: ❌ NOT using libphonenumber-js
- **Current**: Plain `<input type="tel">` with no validation/formatting
- **Line**: 188
  ```astro
  <input
    type="tel"
    id="phone"
    name="phone"
    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600..."
    placeholder="Enter your phone number"
  />
  ```
- **Action Needed**: Add phone formatting and validation

#### 8. **cal-booking.astro** (Test Page)

- **Location**: `src/pages/tests/cal-booking.astro`
- **Status**: ❌ NOT using libphonenumber-js
- **Current**: Plain `<input type="tel">` in test page
- **Line**: 117
  ```astro
  <input type="tel" id="bookingPhone" placeholder="+1234567890" />
  ```
- **Action Needed**: Add phone formatting (test page, lower priority)

---

## Recommendation

### Files Requiring Updates

1. **`src/components/common/ContactFormWithUpload.astro`** (Priority: HIGH)
2. **`src/ContactForm.astro`** (Priority: HIGH)
3. **`src/pages/admin/settings.astro`** (Priority: MEDIUM)
4. **`src/pages/tests/cal-booking.astro`** (Priority: LOW - test page)

### Implementation Pattern

For each file, add the following script section:

```astro
<script>
  import { formatPhoneAsYouType, validatePhone } from "../path/to/lib/phone-validation";

  document.addEventListener("DOMContentLoaded", () => {
    const phoneInput = document.getElementById("phone") as HTMLInputElement;
    if (!phoneInput) return;

    let lastValue = "";

    phoneInput.addEventListener("input", (e) => {
      const input = e.target as HTMLInputElement;
      const cursorPosition = input.selectionStart || 0;

      // Format as user types
      const formatted = formatPhoneAsYouType(input.value);
      const wasDeleting = input.value.length < lastValue.length;

      input.value = formatted;
      lastValue = formatted;

      // Maintain cursor position
      if (wasDeleting) {
        input.setSelectionRange(cursorPosition, cursorPosition);
      } else {
        input.setSelectionRange(formatted.length, formatted.length);
      }
    });
  });
</script>
```

---

## Central Library Details

### Location

`src/lib/phone-validation.ts`

### Functions

#### `validatePhone(phoneValue: string): boolean`

- Validates US phone numbers using libphonenumber-js
- Returns `true` for:
  - Empty/optional fields
  - Partial numbers (3+ digits, still typing)
  - Complete valid US numbers (10-11 digits)
- Returns `false` for invalid numbers

#### `formatPhoneAsYouType(value: string): string`

- Formats phone number as user types
- Strips non-digits, then applies US formatting
- Example: `5551234567` → `(555) 123-4567`

### Example Usage

```typescript
import { validatePhone, formatPhoneAsYouType } from "../../lib/phone-validation";

// Format on input
phoneInput.addEventListener("input", (e) => {
  e.target.value = formatPhoneAsYouType(e.target.value);
});

// Validate before submission
if (!validatePhone(phoneValue)) {
  showError("Please enter a valid US phone number");
}
```

---

## Notes

- ✅ **Good**: All major multi-step forms already use libphonenumber-js
- ⚠️ **Issue**: Some standalone forms and admin settings pages don't use it
- 📝 **Consistency**: Should apply formatting to ALL phone inputs for better UX
- 🎯 **Pattern**: The existing implementations in MultiStepRegisterForm and ContactForm provide excellent templates to follow

---

## Next Steps

1. Update `ContactFormWithUpload.astro` with phone formatting
2. Update `src/ContactForm.astro` with phone formatting
3. Update admin settings page phone input
4. (Optional) Update test page cal-booking.astro

All updates should use the existing `src/lib/phone-validation.ts` functions for consistency.
