# Forgot Password Integration

## Overview

The forgot password functionality has been integrated into the `MultiStepForm` component to work specifically with the login form. This eliminates the need for a separate `ForgetPasswordModal.astro` component.

## How It Works

### 1. Login Form Configuration

In `src/lib/forms/login-form-config.ts`, the forgot password button is defined in step 1:

```typescript
{
  type: "prev",
  id: "forgot-password-btn",
  label: "forgot?",
  variant: "anchor",
  size: "sm",
  href: "#",
  icon: "",
  iconPosition: "left",
}
```

### 2. MultiStepForm Integration

The forgot password modal handler is now built into `src/components/form/MultiStepForm.astro` and only initializes when the login form is present:

```javascript
if (document.getElementById("multi-step-login-form")) {
  const forgotPasswordBtn = document.getElementById("forgot-password-btn");
  // ... modal handler logic
}
```

**Important**: The `id` prop is now properly passed from button configs to the Button component, ensuring buttons can be targeted by JavaScript.

### 3. Modal Flow

1. User clicks "forgot?" button on login form
2. Fetches form partial from `/partials/forgot-password-form`
3. Displays modal using `window.showNotice()`
4. Handles form submission to `/api/auth/forgot-password`
5. Shows success/error notifications
6. Redirects on success

## Files Modified

- `src/components/form/MultiStepForm.astro` 
  - Added forgot password modal handler
  - Fixed button `id` prop passing (all button types: choice, navigation, and button-group)
- `src/lib/forms/login-form-config.ts` - Already had the button configured

## Files Removed

- `src/components/form/ForgetPasswordModal.astro` - No longer needed
- Import statement in `src/pages/profile.astro` (line 35) - Not being used

## Benefits

1. **Single Source of Truth** - All login-related functionality is in one place
2. **No Duplication** - Removed standalone component
3. **Form-Specific** - Logic only loads when needed (login form)
4. **Maintainable** - Easier to update and debug
5. **Proper ID Support** - Button IDs now correctly render for JavaScript targeting

## Bug Fix: Button ID Not Rendering

### Issue
Buttons defined in form configs with an `id` property were not getting the ID attribute in the rendered HTML.

### Solution
Updated `MultiStepForm.astro` to pass the `id` prop to Button components in three locations:
1. Navigation buttons (prev, next, submit, skip)
2. Choice buttons (radio-style options)
3. Button-group field buttons

### Impact
All buttons in multi-step forms can now be properly targeted by JavaScript using their configured IDs.

## Testing

To test the forgot password flow:

1. Go to `/auth/login`
2. Click the "forgot?" link under the email field
3. Verify the button has `id="forgot-password-btn"` in the HTML
4. Enter an email address in the modal
5. Submit and verify the success/error notifications
6. Check email for password reset link
