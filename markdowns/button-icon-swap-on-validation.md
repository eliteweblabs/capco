# Button Icon Swap on Validation

## Overview

Implemented dynamic icon swapping for multi-step form buttons that changes from the default icon to a checkmark when the form field becomes valid, providing clear visual feedback to users.

## Implementation Details

### 1. Button Structure

Every button with a `validLabel` now includes both icons in the HTML:

- **Default icon** (e.g., arrow-right): Always rendered with class `icon-default`
- **Valid icon** (checkmark): Always rendered with class `icon-valid hidden`

### 2. CSS State Management

Simple CSS classes control icon visibility:

```css
/* By default, valid icon is hidden */
button.has-valid-state .icon-valid {
  display: none;
}

/* When button has is-valid class, swap icons */
button.has-valid-state.is-valid .icon-default {
  display: none;
}

button.has-valid-state.is-valid .icon-valid {
  display: inline-block;
  animation: iconSwapIn 300ms ease-out;
}
```

### 3. JavaScript Toggle

The `updateButtonIcon()` function is now extremely simple:

```typescript
function updateButtonIcon(button: HTMLElement, isValid: boolean) {
  if (isValid) {
    button.classList.add("is-valid");
  } else {
    button.classList.remove("is-valid");
  }
}
```

### 4. Integration Points

The function is called automatically in all validation handlers:

- **Phone Input Validation**: When user types in phone number field
- **Address Input Validation**: When address is selected/cleared
- **Hidden Input Fields**: When button-group selections are made/cleared

## Animation Details

The checkmark animates in with a delightful effect:

- **0%**: scale(0) + rotate(-90deg) - starts small and rotated
- **50%**: scale(1.2) + rotate(0deg) - bounces slightly larger
- **100%**: scale(1) + rotate(0deg) - settles to normal size
- **Duration**: 300ms with ease-out timing

## User Experience Benefits

1. **Instant Feedback**: Users immediately see when their input is valid
2. **Universal Symbol**: Checkmark is universally recognized as "correct/valid"
3. **Delightful Animation**: Smooth, playful animation feels responsive
4. **Consistent Pattern**: Same behavior across ALL form steps automatically

## Technical Advantages

1. **Simple**: No DOM manipulation, just CSS class toggle
2. **Performant**: No icon creation/destruction, just show/hide
3. **Maintainable**: All button types automatically get this behavior
4. **Accessible**: Screen readers still see the text change
5. **No Flash**: Both icons always exist, no loading/rendering delay

## Files Modified

1. `/src/components/form/MultiStepForm.astro` - Added checkmark icon to all buttons with validLabel
2. `/src/components/common/Button.astro` - Added `icon-default` class to default icons
3. `/src/lib/multi-step-form-handler.ts` - Simplified icon swap logic to class toggle
4. `/src/styles/global.css` (via MultiStepForm styles) - Added CSS for icon state management

## How It Works

Every button that can show validation state includes BOTH icons from the start:

```html
<button class="has-valid-state">
  <span>skip</span>
  <svg class="icon-default">...</svg>
  <!-- arrow-right -->
  <svg class="icon-valid hidden">...</svg>
  <!-- checkmark -->
</button>
```

When valid, JavaScript adds `is-valid` class:

```html
<button class="has-valid-state is-valid">
  <span>next</span>
  <svg class="icon-default" style="display:none">...</svg>
  <svg class="icon-valid" style="display:inline-block">...</svg>
</button>
```
