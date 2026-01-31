# MEP Form - Radio Buttons (Choice Buttons) Implementation

## Overview

Added Steps 5 and 6 to the MEP form using "choice buttons" which function like radio buttons with conditional navigation.

## Steps Added

### Step 5: Fuel Source
- **Question**: "Fuel Source?"
- **Options**: 
  - Gas
  - Electric
- **Behavior**: Selecting an option stores the value and navigates to Step 6

### Step 6: HVAC System Type (Conditional)
- **Question**: "HVAC System Type?"
- **Options depend on Step 5 selection**:

**If "Gas" selected:**
- Natural gas fired air handler and furnace
- Propane gas fired air handler and furnace
- Conventional ducted system
- High velocity deducted system
- Gas fired boiler with hot water baseboard
- Gas fired boiler with hydronic radiant floor
- Other

**If "Electric" selected:**
- Ceiling cassette mini split
- Wall mounted mini split
- Electric mini split air handler and conventional ductwork
- Cove Heating
- Other

## Implementation Details

### 1. Choice Buttons Config

Choice buttons use `type: "choice"` with special properties:

```typescript
{
  type: "choice",
  label: "Gas",
  variant: "primary",
  dataNext: 6,              // Which step to go to
  dataValue: "gas",         // Value to store
  classes: "fuel-choice",   // Custom class for handler
}
```

### 2. Hidden Inputs

Each choice-based step has a hidden input to store the selection:

```typescript
{
  type: "hidden",
  id: "step-fuel-source",
  name: "fuelSource",
  required: true,
}
```

### 3. Handler Logic (`multi-step-form-handler.ts`)

Added handlers for fuel and HVAC choices:

```typescript
// Fuel choice buttons (Gas/Electric)
if (fuelChoiceBtn) {
  const fuelValue = fuelChoiceBtn.getAttribute("data-value");
  const fuelInput = form.querySelector('input[name="fuelSource"]');
  fuelInput.value = fuelValue;
  showStep(nextStep);
  return;
}

// HVAC choice buttons
if (hvacChoiceBtn) {
  const hvacValue = hvacChoiceBtn.getAttribute("data-value");
  const hvacInput = form.querySelector('input[name="hvacSystem"]');
  hvacInput.value = hvacValue;
  showStep(nextStep);
  return;
}
```

### 4. Conditional Display Logic

When entering Step 6, the handler checks the fuel source and shows/hides appropriate options:

```typescript
if (stepNumber === 6) {
  const fuelSource = form.querySelector('input[name="fuelSource"]').value;
  
  // Hide all options
  document.querySelectorAll("button.hvac-choice").forEach(btn => {
    btn.style.display = "none";
  });
  
  // Show only relevant options
  if (fuelSource === "gas") {
    document.querySelectorAll("button.hvac-gas").forEach(btn => {
      btn.style.display = "inline-flex";
    });
  } else if (fuelSource === "electric") {
    document.querySelectorAll("button.hvac-electric").forEach(btn => {
      btn.style.display = "inline-flex";
    });
  }
}
```

### 5. Component Updates (`MultiStepForm.astro`)

**Choice button rendering:**
```astro
{button.type === "choice" ? (
  <Button
    type="button"
    variant={button.variant || "secondary"}
    class={button.classes || ""}
    dataAttributes={{
      "data-next": button.dataNext?.toString(),
      "data-value": button.dataValue,
    }}
  >
    {button.label}
  </Button>
) : ...}
```

**Dynamic button layout:**
```astro
<div class={`flex ${hasFullWidthChoices ? "flex-col" : "justify-between"} gap-3`}>
```

When buttons have `w-full` class, they stack vertically instead of horizontally.

## CSS Classes for Conditional Display

Each HVAC option button has multiple classes:

- `hvac-choice` - All HVAC options
- `hvac-gas` - Gas-specific options
- `hvac-electric` - Electric-specific options
- `hvac-gas hvac-electric` - Options available for both (like "Other")

This allows the JavaScript to show/hide groups easily.

## Styling

HVAC buttons are styled for vertical stacking:

```typescript
classes: "hvac-choice hvac-gas w-full !justify-start !text-left mb-2"
```

- `w-full` - Full width
- `!justify-start` - Left-align content
- `!text-left` - Left-align text
- `mb-2` - Margin bottom for spacing

## Data Flow

1. **User clicks "Gas" on Step 5**
   ```
   Click → Set fuelSource="gas" → Navigate to Step 6
   ```

2. **Step 6 loads**
   ```
   Read fuelSource → Hide all HVAC buttons → Show only hvac-gas buttons
   ```

3. **User selects "Natural gas fired air handler and furnace"**
   ```
   Click → Set hvacSystem="natural-gas-fired" → Navigate to Step 7
   ```

4. **Form submission**
   ```
   FormData includes:
   - fuelSource: "gas"
   - hvacSystem: "natural-gas-fired"
   ```

## Form Submission

The API endpoint (`/api/mep/submit.ts`) receives:

```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "(555) 123-4567",
  "address": "123 Main St, Boston, MA",
  "fuelSource": "gas",
  "hvacSystem": "natural-gas-fired"
}
```

## Testing

### Test Flow 1: Gas System
1. Visit `/mep-form`
2. Fill email, name, phone, address (or skip if authenticated)
3. Step 5: Click "Gas"
4. Step 6: Should see only gas HVAC options
5. Select an option
6. Should navigate to Step 7 (when added)

### Test Flow 2: Electric System
1. Visit `/mep-form`
2. Fill email, name, phone, address
3. Step 5: Click "Electric"
4. Step 6: Should see only electric HVAC options
5. Select an option
6. Should navigate to Step 7

### Test Flow 3: Back Navigation
1. Get to Step 6
2. Click "back"
3. Should return to Step 5
4. Change selection (Gas → Electric or vice versa)
5. Go forward to Step 6
6. Should see different options based on new selection

## Console Logs

Watch for these logs in the browser console:

```
[MULTISTEP-FORM] Set fuelSource to: gas
[MULTISTEP-FORM] Entering step 6 with fuelSource: gas
[MULTISTEP-FORM] Showing 7 gas HVAC options
[MULTISTEP-FORM] Set hvacSystem to: natural-gas-fired
```

## Files Changed

1. **`src/lib/forms/mep-form-config.ts`**
   - Added Step 5 (Fuel Source)
   - Added Step 6 (HVAC System Type)
   - Updated totalSteps to 6

2. **`src/lib/multi-step-form-handler.ts`**
   - Added fuel-choice button handler
   - Added hvac-choice button handler
   - Added conditional display logic for Step 6

3. **`src/components/form/MultiStepForm.astro`**
   - Updated choice button rendering to use `data-value`
   - Added dynamic button layout (vertical for w-full buttons)
   - Kept backward compatibility with SMS choice buttons

## Next Steps

Step 7 and beyond can be added using the same pattern:
- Add step to config
- Add any conditional logic needed
- Update totalSteps count

## Pattern for Future Choice-Based Steps

```typescript
// Step with choices
{
  stepNumber: X,
  title: "Question?",
  fields: [
    {
      type: "hidden",
      id: "step-field-name",
      name: "fieldName",
      required: true,
    },
  ],
  buttons: [
    {
      type: "prev",
      label: "back",
      dataPrev: X-1,
    },
    {
      type: "choice",
      label: "Option 1",
      dataNext: X+1,
      dataValue: "option-1",
      classes: "custom-choice",
    },
    {
      type: "choice",
      label: "Option 2",
      dataNext: X+1,
      dataValue: "option-2",
      classes: "custom-choice",
    },
  ],
}
```

Then add handler:
```typescript
const customChoiceBtn = target.closest("button.custom-choice");
if (customChoiceBtn) {
  const value = customChoiceBtn.getAttribute("data-value");
  const input = form.querySelector('input[name="fieldName"]');
  input.value = value;
  showStep(nextStep);
  return;
}
```
