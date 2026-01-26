# MultiStepRegisterForm Navigation Flow

## Complete Step Flow (8 Steps)

```
Step 1: Email
    ↓
Step 2: Name (First + Last)
    ↓
Step 3: Company
    ↓
Step 4: Password
    ↓
Step 5: Phone
    ├─ No phone entered → Skip to Step 8 (Review)
    └─ Phone entered → Continue to Step 6
        ↓
    Step 6: SMS Consent
        ├─ "no" → Skip to Step 8 (Review)
        └─ "yes" → Continue to Step 7
            ↓
        Step 7: Mobile Carrier
            ↓
        Step 8: Review & Submit
```

## Back Navigation Logic

From **Step 8 (Review)**:
- If phone exists → Back to Step 7 (Carrier)
- If no phone → Back to Step 5 (Phone)

From **Step 6 (SMS Consent)**:
- Back to Step 5 (Phone)

From **Step 7 (Carrier)**:
- Back to Step 6 (SMS Consent)

## Data Flow

### Phone Field (Step 5)
- ID: `step-phone`
- Name: `phone`
- Type: `tel`
- Format: Auto-formats as user types (###) ###-####
- Validation: US phone format (if entered)
- Required: No (optional)

### SMS Alerts (Step 6)
- ID: `step-sms-alerts`
- Name: `smsAlerts`
- Type: `hidden`
- Values: `"true"` or `"false"`
- Default: `"false"`

### Mobile Carrier (Step 7)
- ID: `step-carrier`
- Name: `mobileCarrier`
- Component: `SlotMachineModalStaff`
- Values: Carrier ID from `SMS_UTILS.CARRIERS`
- Required: Only if `smsAlerts === "true"`

## Button Behavior

### Step 5 Button
- Text: "Next / Skip"
- Class: `next-step-phone`
- Logic:
  - Empty phone → Jump to Step 8
  - Has phone → Validate & go to Step 6

### Step 6 Buttons
- "no" button:
  - Class: `sms-choice`
  - data-next: "8"
  - data-sms-value: "false"
- "yes" button:
  - Class: `sms-choice`
  - data-next: "7"
  - data-sms-value: "true"
  - Auto-focused with outline effect

### Step 7 Button
- Text: "Next"
- Validates carrier selection before proceeding

### Step 8 Button
- Text: "Create Account"
- Class: `submit-registration`
- Triggers form submission

## Validation Rules

| Step | Field | Rules |
|------|-------|-------|
| 1 | Email | Required, valid email, unique |
| 2 | First Name | Required |
| 2 | Last Name | Required |
| 3 | Company | Required |
| 4 | Password | Required, min 6 chars |
| 5 | Phone | Optional, US format if entered |
| 6 | SMS Alerts | Auto-set by button choice |
| 7 | Carrier | Required if SMS Alerts = true |
| 8 | Review | All previous validations |

## Special Features

### Phone Formatting
```typescript
phoneInput.addEventListener("input", (e) => {
  const formatted = formatPhoneAsYouType(input.value);
  input.value = formatted;
  // Handles cursor position for better UX
});
```

### SMS Choice Focus
```typescript
if (stepNumber === 6) {
  const yesButton = targetStep.querySelector('button[data-sms-value="true"]');
  yesButton.classList.add("!outline", "!outline-2", "!outline-dashed", 
                          "!outline-primary-500", "!outline-offset-2");
  yesButton.focus();
}
```

### Skip Logic
```typescript
// Step 5: No phone → Skip SMS steps
if (!phoneValue) {
  nextStep = 8;
  smsAlertsInput.value = "false";
  showStep(nextStep);
}

// Step 6: "no" → Skip carrier
if (smsValue === "false") {
  nextStep = 8; // Defined in button data-next
}
```

## Form Submission Data

When form is submitted, it includes:
- `email` (string)
- `firstName` (string)
- `lastName` (string)
- `companyName` (string)
- `password` (string)
- `phone` (string, optional)
- `smsAlerts` ("true" | "false")
- `mobileCarrier` (string, optional - only if smsAlerts = true)
- `role` ("Client")

## Implementation Notes

1. **Progressive Enhancement**: Form works without phone/SMS features
2. **Graceful Degradation**: Skipping phone skips all SMS-related steps
3. **Smart Back Navigation**: Remembers user's path through form
4. **Validation Timing**: Validates on "Next", not on "Skip"
5. **Focus Management**: Auto-focuses inputs except SMS consent (focuses button)
