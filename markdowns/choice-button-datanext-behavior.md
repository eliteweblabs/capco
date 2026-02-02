# Choice Button dataNext Behavior Fix

## Problem
Previously, choice buttons with `dataNext` attributes would auto-advance immediately when tapped, not allowing users to review their selection or change their mind.

## New Behavior
Choice buttons with `dataNext` now update the Next/Unsure button's destination instead of auto-advancing.

## How It Works

### 1. When a choice button is selected:
- Store the Next button's original `data-next` value in `data-original-next` attribute
- Update the Next button's `data-next` to the choice button's `data-next` value
- User can now click Next to advance to the appropriate step

### 2. When a choice button is deselected (clicked again):
- Restore the Next button's `data-next` to the original value from `data-original-next`
- If no original value stored, fallback to `currentStep + 1`

### 3. When leaving a step:
- Clear the stored `data-original-next` attribute to prevent state leaking between steps

## Example Flow

**Step 6: Fuel Source Selection**

```typescript
buttons: [
  {
    type: "choice",
    label: "Gas",
    dataValue: "gas",
    dataNext: 7, // Go to step 7 (gas HVAC options)
  },
  {
    type: "choice",
    label: "Electric", 
    dataValue: "electric",
    dataNext: 7, // Go to step 7 (electric HVAC options)
  },
]
// Next button originally has dataNext: 8 (skip HVAC if unsure)
```

**User Flow:**
1. User sees step 6 with Next button set to go to step 8 (unsure path)
2. User clicks "Gas" choice button
3. Next button updates to `data-next="7"` (original 8 is stored)
4. User clicks Next → goes to step 7 with gas options
5. **OR** User clicks "Gas" again to deselect
6. Next button restores to `data-next="8"` (unsure path)

## Benefits
- ✅ Users can review their selection before advancing
- ✅ Users can change their mind and deselect
- ✅ Different choices can route to different next steps
- ✅ Maintains "unsure/skip" fallback behavior
- ✅ Clean state management (clears on step navigation)

## Files Modified
- `/src/lib/multi-step-form-handler.ts`
  - Updated choice button handler (lines ~790-827)
  - Added cleanup in `showStep()` function (lines ~117-122)
