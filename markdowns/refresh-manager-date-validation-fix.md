# Refresh Manager Date Validation Fix

**Date:** 2026-02-03  
**Issue:** Refresh manager was broken due to invalid date handling  
**Status:** Fixed

## Problem

The refresh manager was encountering "Invalid time value" errors when trying to parse and format dates. This occurred in two places:

1. **`adjustDueDate` function** (`src/scripts/project-item-handlers.ts`)
   - Was attempting to parse dates without validating if the date string was valid
   - Would fail when `data-due-date` was `null`, empty string, or invalid format

2. **Refresh Manager** (`src/lib/refresh-manager.ts`)
   - Was attempting to format dates without checking if the value was valid
   - Would fail when database returned `null` or empty string for date fields
   - Date comparison logic didn't handle null/empty values properly

## Root Cause

Projects in the database can have `null` or empty values for optional date fields like `dueDate`. When the refresh manager tried to:
- Format these dates for display
- Compare dates to determine if updates were needed
- Update date input elements

...it would throw `RangeError: Invalid time value` errors, breaking the refresh cycle.

## Solution

### 1. Fixed `adjustDueDate` function

Added validation before parsing dates:

```typescript
const currentDate = input.getAttribute("data-due-date");
if (!currentDate || currentDate === "") {
  console.error(`❌ [ADJUST] No current date for project ${projectId}`);
  return;
}

// Validate the date before parsing
const date = new Date(currentDate);
if (isNaN(date.getTime())) {
  console.error(`❌ [ADJUST] Invalid date format for project ${projectId}:`, currentDate);
  return;
}
```

### 2. Fixed Refresh Manager Date Formatting (Input Elements)

```typescript
if (element.hasAttribute("data-due-date")) {
  // Only update if newValue is valid
  if (newValue && newValue !== "" && newValue !== "null") {
    element.setAttribute("data-due-date", String(newValue));
    try {
      const date = new Date(newValue);
      // Validate the date is actually valid
      if (!isNaN(date.getTime())) {
        displayValue = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          hour12: true,
        });
      } else {
        displayValue = String(newValue);
      }
    } catch (e) {
      displayValue = String(newValue);
    }
  } else {
    // Handle null/empty dates - clear the field
    element.setAttribute("data-due-date", "");
    displayValue = "";
  }
}
```

### 3. Fixed Refresh Manager Date Formatting (Text Elements)

```typescript
if (fieldName && (fieldName.includes("Date") || fieldName.includes("At"))) {
  // Handle null/empty dates
  if (!newValue || newValue === "" || newValue === "null") {
    displayValue = "";
  } else {
    try {
      const date = new Date(newValue);
      // Validate the date is actually valid
      if (!isNaN(date.getTime())) {
        displayValue = date.toLocaleString();
      } else {
        displayValue = String(newValue);
      }
    } catch (e) {
      displayValue = String(newValue);
    }
  }
}
```

### 4. Fixed Date Comparison Logic

```typescript
if (fieldName.includes("Date") || fieldName.includes("At")) {
  try {
    // Handle null/empty dates
    if (!currentElementValue || currentElementValue === "" || currentElementValue === "null") {
      valuesAreDifferent = newValueString !== "" && newValueString !== "null";
    } else if (!newValueString || newValueString === "" || newValueString === "null") {
      valuesAreDifferent = currentElementValue !== "" && currentElementValue !== "null";
    } else {
      // Both have values, compare as dates
      const currentDate = new Date(currentElementValue);
      const newDate = new Date(newValueString);
      // Validate both dates are valid before comparing
      if (!isNaN(currentDate.getTime()) && !isNaN(newDate.getTime())) {
        valuesAreDifferent = currentDate.getTime() !== newDate.getTime();
      } else {
        valuesAreDifferent = currentElementValue !== newValueString;
      }
    }
  } catch (e) {
    valuesAreDifferent = currentElementValue !== newValueString;
  }
}
```

## Files Modified

1. `/src/scripts/project-item-handlers.ts`
   - Added date validation in `adjustDueDate()` function (lines 124-133)

2. `/src/lib/refresh-manager.ts`
   - Added date validation in `defaultUpdate()` for input elements (lines 141-168)
   - Added date validation in `defaultUpdate()` for text elements (lines 180-207)
   - Added date validation in date comparison logic (lines 578-604)

## Testing

To verify the fix:

1. Check browser console - should no longer see "Invalid time value" errors
2. Create a project without a due date (null value)
3. Verify the refresh manager continues cycling without errors
4. Add/adjust due dates using the increment/decrement buttons
5. Verify dates update correctly and display formatted values

## Prevention

Moving forward:
- Always validate dates before parsing with `new Date()`
- Always check `isNaN(date.getTime())` after creating a Date object
- Handle null/empty string cases explicitly for optional date fields
- Consider using a date validation utility function for consistency
