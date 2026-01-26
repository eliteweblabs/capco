# MultiStepRegisterForm Phone/SMS Update

**Date:** 2026-01-26

## Summary
Updated the MultiStepRegisterForm to use the same phone/SMS/carrier flow as ContactForm, replacing the single PhoneAndSMS component step with a 3-step process.

## Changes Made

### 1. Component Structure
- **Removed:** `PhoneAndSMS` component import
- **Added:** `SlotMachineModalStaff` component import
- **Added:** `SMS_UTILS` import for carrier options

### 2. Step Count
- **Before:** 6 steps total
- **After:** 8 steps total
- Updated progress bar to show "1 / 8"

### 3. Step Reorganization

#### Step 5: Phone Input (formerly single PhoneAndSMS)
- Plain `<input type="tel">` with formatting
- Placeholder: "(555) 123-4567"
- Button: "Next / Skip" (allows skipping if no phone entered)
- Special logic: If no phone, skip to Step 8 (Review)

#### Step 6: SMS Consent (NEW)
- Title: "contact via SMS?"
- Two buttons: "no" and "yes"
- "no" → goes to Step 8 (Review)
- "yes" → goes to Step 7 (Carrier)
- Hidden input stores `smsAlerts` value (true/false)
- Auto-focuses "yes" button with outline effect

#### Step 7: Mobile Carrier (NEW)
- Title: "your mobile carrier?"
- Uses `SlotMachineModalStaff` component
- Shows carrier selection modal
- Only shown if user chose "yes" to SMS alerts
- Validates carrier selection before proceeding

#### Step 8: Review & Submit (formerly Step 6)
- **UPDATED:** Added SMS Alerts and Mobile Carrier fields
- Shows all registration information including:
  - Email (editable - goes to Step 1)
  - Name (editable - goes to Step 2)
  - Company (editable - goes to Step 3)
  - Password (shown as ••••••, editable - goes to Step 4)
  - Phone (editable - goes to Step 5)
  - SMS Alerts (editable - goes to Step 6)
  - Mobile Carrier (editable - goes to Step 7)
- Updated step number and navigation

### 4. JavaScript Logic Updates

#### Phone Formatting
- Added `formatPhoneAsYouType()` on input
- Handles cursor position during typing/deleting
- Uses `validatePhone()` for validation

#### Navigation Logic
- **Step 5 → Step 6/8:** If no phone entered, skip to Step 8; otherwise validate and go to Step 6
- **Step 6:** SMS choice buttons set hidden input value and navigate accordingly
- **Step 7:** Validates carrier selection if SMS alerts enabled
- **Step 8 → Step 5/7:** Back button checks if phone exists to determine previous step

#### Validation
- Step 5: Validates phone format if entered (optional field)
- Step 7: Validates carrier selection if SMS alerts is true

#### Focus Management
- Step 6 (SMS Consent): Auto-focuses "yes" button with outline styling
- Other steps: Auto-focus first input field

### 5. Button Changes
- Step 5: Changed "Next" to "Next / Skip"
- Step 6: Two choice buttons (no/yes) instead of single next button
- Step 8: Previous button has `prev-step-review` class for special navigation

## Implementation Details

### SMS Choice Button Handler
```typescript
if (smsChoiceBtn) {
  e.preventDefault();
  const smsValue = smsChoiceBtn.getAttribute("data-sms-value");
  const nextStep = parseInt(smsChoiceBtn.getAttribute("data-next") || "8");
  
  // Store SMS alerts value
  const smsAlertsInput = document.getElementById("step-sms-alerts") as HTMLInputElement;
  if (smsAlertsInput) {
    smsAlertsInput.value = smsValue || "false";
  }
  
  showStep(nextStep);
  return;
}
```

### Phone Step Navigation
```typescript
if (currentStep === 5 && nextBtn.classList.contains("next-step-phone")) {
  const phoneInput = document.getElementById("step-phone") as HTMLInputElement;
  const phoneValue = phoneInput?.value?.trim() || "";
  
  // If no phone number entered, skip to step 8 (review)
  if (!phoneValue) {
    nextStep = 8;
    // Clear SMS alerts since no phone was provided
    const smsAlertsInput = document.getElementById("step-sms-alerts") as HTMLInputElement;
    if (smsAlertsInput) {
      smsAlertsInput.value = "false";
    }
    showStep(nextStep);
    return;
  }
  
  // If phone entered, validate before proceeding
  if (!validateStep(currentStep)) {
    return;
  }
  
  showStep(nextStep);
  return;
}
```

### Back Navigation from Review
```typescript
if (currentStep === 8 && prevBtn.classList.contains("prev-step-review")) {
  const phoneInput = document.getElementById("step-phone") as HTMLInputElement;
  const phoneValue = phoneInput?.value?.trim() || "";
  
  // If no phone number, skip back to step 5 (phone)
  if (!phoneValue) {
    prevStep = 5;
  }
  // If phone exists, go back to step 7 (carrier) as normal
}
```

## Testing Checklist
- [ ] Phone formatting works correctly as user types
- [ ] Can skip phone step by clicking "Next / Skip" with empty input
- [ ] Skipping phone goes directly to Step 8 (Review)
- [ ] Entering phone number goes to Step 6 (SMS Consent)
- [ ] SMS "no" button goes to Step 8
- [ ] SMS "yes" button goes to Step 7 (Carrier)
- [ ] Carrier selection modal works
- [ ] Can't proceed from Step 7 without selecting carrier
- [ ] Back button from Review (Step 8) goes to correct step based on phone presence
- [ ] **Review page shows all fields including SMS Alerts and Mobile Carrier**
- [ ] **SMS Alerts shows "Yes" or "No" correctly**
- [ ] **Mobile Carrier shows selected carrier name or "Not provided"**
- [ ] **Edit buttons on review page navigate to correct steps (5, 6, 7)**
- [ ] Form submission still works correctly
- [ ] All form data is captured properly including phone, smsAlerts, and mobileCarrier

## Files Modified
- `/src/components/form/MultiStepRegisterForm.astro`

## Dependencies Used
- `SlotMachineModalStaff.astro` - Carrier selection component
- `phone-validation.ts` - Phone formatting and validation
- `sms-utils.ts` - SMS carrier list
