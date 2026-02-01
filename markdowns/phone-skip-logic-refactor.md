# Phone Skip Logic Refactor - Data-Driven Form Configuration

## Problem
The phone skip logic was hardcoded in `multi-step-form-handler.ts`, which meant:
- Every new form needed custom code modifications
- Logic was scattered between handler and config
- Not reusable or maintainable

## Solution
Moved skip logic to JSON form configuration using `skipCondition` property.

## Changes Made

### 1. Contact Form Config (`src/lib/forms/contact-form-config.ts`)

Added `skipCondition: "noValidPhone"` to SMS-related steps:

```typescript
// Step 4: SMS Consent
{
  stepNumber: 4,
  title: "contact via SMS?",
  skipCondition: "noValidPhone", // ← Skip if phone is invalid/empty
  // ... rest of config
}

// Step 5: Mobile Carrier
{
  stepNumber: 5,
  title: "your mobile carrier?",
  skipCondition: "noValidPhone", // ← Skip if phone is invalid/empty
  // ... rest of config
}
```

### 2. Form Handler (`src/lib/multi-step-form-handler.ts`)

#### Updated `shouldSkipStep()` function:
```typescript
if (condition === "noValidPhone") {
  const phoneInput = form.querySelector('input[type="tel"]');
  const phoneValue = phoneInput?.value?.trim() || "";
  const isPhoneValid = phoneValue && validatePhone(phoneValue);
  
  if (!isPhoneValid) {
    console.log(`Skipping step ${stepNumber} (no valid phone)`);
    return true;
  }
  return false;
}
```

#### Removed hardcoded phone logic:
- ❌ Removed special handling for `next-step-phone` class
- ❌ Removed special handling for `prev-step-company` class
- ❌ Removed special handling for `prev-step-review` class
- ✅ Now uses `showStep` override that respects `skipCondition`

## How It Works Now

1. **User skips/fills phone** → Next button clicked
2. **Handler calls `showStep(4)`** → Tries to go to SMS Consent
3. **Override checks `shouldSkipStep(4)`** → Evaluates "noValidPhone" condition
4. **If phone invalid** → Calls `getNextValidStep()` → Finds step 6 (Company)
5. **Shows step 6** → Skipped steps 4 & 5 automatically

## Benefits

✅ **Reusable**: Any form can now use `skipCondition: "noValidPhone"`  
✅ **Maintainable**: Logic is in one place (config + handler)  
✅ **Extensible**: Easy to add new skip conditions like `skipCondition: "noValidEmail"`  
✅ **Type-safe**: Works with existing TypeScript form config types  

## Testing

Test scenarios:
1. ✅ Empty phone → Skip to Company
2. ✅ Partial phone (432) 564 → Skip to Company  
3. ✅ Valid phone (432) 564-7890 → Show SMS Consent
4. ✅ Back button from Company → Skip back correctly based on phone

## Future Enhancements

Can add more skip conditions:
- `skipCondition: "isAuthenticated"` - Skip if user logged in
- `skipCondition: "noEmail"` - Skip if email empty
- `skipCondition: function(form) { ... }` - Custom skip logic
