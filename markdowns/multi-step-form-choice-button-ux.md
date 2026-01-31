# Multi-Step Form Choice Button UX Pattern

## Overview
Implemented a better UX pattern for choice buttons (radio button alternatives) in the multi-step form system where users **select first, then proceed** rather than selecting and immediately advancing.

## Problem
The initial implementation had choice buttons that would immediately advance to the next step when clicked. This was problematic because:
- Users couldn't change their selection
- No visual confirmation of selection
- Broke the established pattern of other form steps

## Solution
Changed choice buttons to a **select-then-proceed** pattern:

### 1. Button Configuration
Choice buttons no longer have `dataNext` - they only select:

```typescript
{
  type: "choice",
  label: "Gas",
  variant: "outline",
  size: "base",
  dataValue: "gas",  // ✅ Only stores value
  // dataNext: 6,    // ❌ Removed - no auto-advance
  classes: "fuel-choice",
}
```

### 2. Next/Submit Button Required
Add a separate next/submit button that is **initially disabled**:

```typescript
{
  type: "next",
  label: "next",
  variant: "secondary",
  size: "base",
  dataNext: 6,
  icon: "arrow-right",
  iconPosition: "right",
  classes: "disabled:opacity-50 disabled:cursor-not-allowed",
  disabled: true, // ✅ Initially disabled until choice is made
}
```

## Handler Logic

### Visual Selection
When a choice button is clicked:
1. Updates the hidden input value
2. Adds visual highlight to selected button:
   - `!ring-2` - Ring border
   - `!ring-primary-600` - Primary color
   - `!bg-primary-50` - Light background
3. Removes highlight from other buttons

### Button Enabling
After a choice is selected:
- The next/submit button is enabled (`disabled = false`)
- User can then click next to proceed

## Code Changes

### `/src/lib/forms/mep-form-config.ts`
**Step 5 (Fuel Source):**
- Removed `dataNext` from Gas/Electric choice buttons
- Added disabled `next` button

**Step 6 (HVAC System):**
- Removed `dataNext` from all HVAC choice buttons
- Added disabled `submit` button

### `/src/lib/multi-step-form-handler.ts`
**Fuel Choice Handler:**
```typescript
if (fuelChoiceBtn) {
  e.preventDefault();
  const fuelValue = fuelChoiceBtn.getAttribute("data-value");

  // Update hidden input
  const fuelInput = form.querySelector('input[name="fuelSource"]') as HTMLInputElement;
  if (fuelInput) {
    fuelInput.value = fuelValue || "";
  }

  // Visual feedback: highlight selected button
  const allFuelButtons = form.querySelectorAll("button.fuel-choice");
  allFuelButtons.forEach((btn) => {
    btn.classList.remove("!ring-2", "!ring-primary-600", "!bg-primary-50");
  });
  fuelChoiceBtn.classList.add("!ring-2", "!ring-primary-600", "!bg-primary-50");

  // Enable the next button
  const nextButton = form.querySelector(
    `.sms-step[data-step="${currentStep}"] button.next-step`
  ) as HTMLButtonElement;
  if (nextButton) {
    nextButton.disabled = false;
  }

  return;  // ✅ Don't advance - wait for user to click next
}
```

**HVAC Choice Handler:**
Same pattern but enables submit button instead.

### `/src/lib/multi-step-form-config.ts`
Added `disabled` property to `FormButtonConfig` interface:
```typescript
export interface FormButtonConfig {
  // ... existing properties
  disabled?: boolean; // Whether button is disabled initially
}
```

### `/src/components/form/MultiStepForm.astro`
Renders the `disabled` attribute on all button types:
```astro
<Button
  {...btnConfig}
  type="button"
  class={`${button.type}-step ${button.classes || ""}`}
  disabled={button.disabled}
  dataAttributes={{...}}
>
```

## Benefits
1. **User Control**: Users can change their selection before proceeding
2. **Visual Feedback**: Selected option is clearly highlighted
3. **Consistent UX**: Follows the same pattern as other form steps
4. **Accessibility**: Disabled state provides clear affordance
5. **Validation**: Form can't advance without a selection

## Example Flow
1. User sees Step 5: "Fuel Source?"
2. User clicks "Gas" → Button gets highlighted ring + background
3. "Next" button becomes enabled
4. User can click "Electric" to change → Visual highlight updates
5. User clicks "Next" → Proceeds to Step 6
6. Step 6 shows only Gas HVAC options (conditional rendering)

## Usage for Future Forms
When creating choice button steps:
1. Remove `dataNext` from choice buttons
2. Add `dataValue` with the value to store
3. Add a separate next/submit button with `disabled: true`
4. Handler will automatically enable button when choice is made
