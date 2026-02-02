# Button Group Default Variant Change

## Change Summary
Updated the default variant for choice buttons in button groups from `"secondary"` to `"outline"`.

## Files Modified

### 1. `/src/lib/multi-step-form-config.ts`
Added `choice` default to `GLOBAL_BUTTON_DEFAULTS`:
```typescript
choice: {
  variant: "outline" as const,
  size: "md" as const,
},
```

### 2. `/src/components/form/MultiStepForm.astro`
Updated fallback variant from `"secondary"` to `"outline"` for old-style choice buttons (line ~377):
```typescript
variant={btnConfig.variant || "outline"}
```

## Impact
- All choice buttons in button groups now default to `"outline"` variant
- Provides better visual distinction between selected/unselected states
- Works with the new touch-device hover fixes using `[@media(hover:hover)]`
- Individual buttons can still override this by specifying their own `variant` property

## Example Usage
```typescript
buttons: [
  {
    type: "choice",
    label: "Gas",
    dataValue: "gas",
    // Will use "outline" variant by default
  },
  {
    type: "choice", 
    label: "Electric",
    variant: "primary", // Can override with explicit variant
    dataValue: "electric",
  },
]
```
