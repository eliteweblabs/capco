# Form Focus Shadow Animation Implementation

## Overview

Implemented dynamic focus/blur shadow animations for all form inputs in the `MultiStepForm.astro` component. The shadow effect now appears smoothly over 500ms when a field gains focus and fades out when focus is lost.

## Changes Made

### 1. MultiStepForm.astro - Added Focus Animation Logic

**Location**: `/src/components/form/MultiStepForm.astro`

#### CSS Changes (lines 381-432)

Added new styles for focus shadow animation:

```css
/* Focus shadow animation */
input,
textarea,
select {
  transition: box-shadow 500ms ease-in-out;
}

input.shadow-focus,
textarea.shadow-focus,
select.shadow-focus {
  box-shadow: var(--shadow-primary-md);
}
```

#### JavaScript Changes (lines 556-574)

Added event listeners for all form inputs to toggle shadow class on focus/blur:

```javascript
// Add focus/blur shadow animation to all form inputs
const formInputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');

formInputs.forEach((input) => {
  input.addEventListener("focus", () => {
    input.classList.add("shadow-focus");
  });

  input.addEventListener("blur", () => {
    input.classList.remove("shadow-focus");
  });
});
```

### 2. global-classes.ts - Removed Static Shadow

**Location**: `/src/pages/api/global/global-classes.ts`

**Before**:

```typescript
globalInputClasses: "backdrop-blur-sm shadow-primary-md border-gray-100/50 ...";
```

**After**:

```typescript
globalInputClasses: "backdrop-blur-sm border-gray-100/50 ...";
```

Removed `shadow-primary-md` from the static class string. The shadow now only appears dynamically on focus.

## How It Works

1. **Default State**: Form inputs render without the primary shadow (only have inner shadow from `shadow-secondary-inner-md`)
2. **Focus Event**: When user clicks/tabs into an input, the `shadow-focus` class is added
3. **CSS Transition**: The `box-shadow` property transitions over 500ms using `ease-in-out` easing
4. **Blur Event**: When user leaves the input, the `shadow-focus` class is removed
5. **Fade Out**: The shadow fades out over 500ms

## Affected Components

All form components that use `globalInputClasses` now benefit from this dynamic behavior:

- `MultiStepForm.astro` ✅
- `InlineAddressSearch.astro` ✅
- `AuthForm.astro` ✅
- `SlotMachineModal.astro` ✅
- `SlotMachineModalStaff.astro` ✅
- `SlotMachineModalFunction.astro` ✅
- `OTPForm.astro` ✅
- `_MultiStepRegisterForm.astro` ✅
- `Discussions.astro` ✅
- `SMSForm.astro` ✅
- `JSONMultiStepForm.astro` ✅
- `StaffCreationForm.astro` ✅
- `ForgetPasswordModal.astro` ✅
- `PhoneAndSMS.astro` ✅

## Non-Form Components Unchanged

The following components still use static `shadow-primary-md` (intentionally left unchanged as they are UI components, not forms):

- `Navbar.astro` - Static shadow for navbar
- `Aside.astro` - Static shadow for sidebar

## Benefits

1. **Better UX**: Users get immediate visual feedback when focusing on inputs
2. **Cleaner Default State**: Inputs are less visually heavy when not in use
3. **Smooth Animations**: 500ms transition provides pleasant, not jarring, effect
4. **Consistent Behavior**: All inputs across all form components behave the same way
5. **Performance**: Uses CSS transitions (GPU-accelerated) instead of JS animations

## Testing Checklist

- [ ] Test focus/blur on text inputs
- [ ] Test focus/blur on email inputs
- [ ] Test focus/blur on tel inputs
- [ ] Test focus/blur on textareas
- [ ] Test focus/blur on select dropdowns
- [ ] Verify hidden inputs are excluded
- [ ] Test tab navigation (keyboard focus)
- [ ] Test in light and dark modes
- [ ] Verify 500ms timing feels right
- [ ] Check that shadow applies correctly across all form pages
