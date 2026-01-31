# Multi-Step Form registerUser Parameter

## Overview

Added a `registerUser` parameter to the multi-step form configuration system that controls email uniqueness validation and redirect behavior.

## Problem

Different forms have different requirements for email handling:

- **Registration forms**: Should block duplicate emails and redirect to login
- **Project submission forms (MEP)**: Should allow existing users to proceed (backend handles user lookup/reuse)

## Solution

Added a `registerUser` boolean flag to `MultiStepFormConfig` that determines email validation behavior.

## Configuration

### Interface Update

Added to `/src/lib/multi-step-form-config.ts`:

```typescript
export interface MultiStepFormConfig {
  formId: string;
  formAction: string;
  formMethod?: "post" | "get";
  totalSteps: number;
  progressBar?: boolean;
  registerUser?: boolean; // NEW: If true, require unique email and redirect to login if exists
  // ... other properties
}
```

### Usage Examples

**Registration Form** (`registerUser: true`):

```typescript
export const registerFormConfig: MultiStepFormConfig = {
  formId: "multi-step-register-form",
  formAction: "/api/auth/register",
  totalSteps: 8,
  registerUser: true, // ✅ Block duplicate emails, redirect to login
  // ...
};
```

**MEP Form** (`registerUser: false`):

```typescript
export const mepFormConfig: MultiStepFormConfig = {
  formId: "multi-step-mep-form",
  formAction: "/api/mep/submit",
  totalSteps: 6,
  registerUser: false, // ✅ Allow existing users (backend handles lookup)
  // ...
};
```

## Behavior

### When `registerUser: true`

1. User enters email on Step 1
2. Handler calls `/api/auth/check-email` to verify uniqueness
3. **If email exists:**
   - Shows warning notification: "Email Already Registered"
   - Includes link to login with callback URL: `/auth/login?redirect=/current-form`
   - Auto-redirects after 10 seconds
   - Prevents form advancement
4. **If email is new:**
   - Allows proceeding to next step

### When `registerUser: false` (or undefined)

1. User enters email on Step 1
2. No uniqueness check performed
3. User can proceed to next step
4. Backend handles existing user lookup/update

## Handler Logic

### Email Validation Check

Updated in `/src/lib/multi-step-form-handler.ts`:

```typescript
// Email uniqueness validation (configurable via registerUser flag)
const shouldCheckEmailUniqueness = options.formConfig?.registerUser === true;

if (shouldCheckEmailUniqueness) {
  const emailInput = stepEl.querySelector('input[type="email"]') as HTMLInputElement;
  if (emailInput && emailInput.value) {
    const emailValid = await validateEmailUniqueness(emailInput.value);
    if (!emailValid) {
      // Redirect to login with callback URL to return to this form
      const currentUrl = window.location.pathname;
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(currentUrl)}`;

      // Show notification with link
      window.showNotice(
        "warning",
        "Email Already Registered",
        `<a href="${loginUrl}">Click here to log in and continue</a>`,
        10000
      );

      // Auto-redirect after 10 seconds
      setTimeout(() => {
        window.location.href = loginUrl;
      }, 10000);

      return false; // Block advancement
    }
  }
}
```

### Passing Config to Handler

```typescript
const handler = createMultiStepFormHandler(form.id, formConfig?.totalSteps || 8, {
  onStepChange: (stepNumber) => {
    console.log(`Step changed to: ${stepNumber}`);
  },
  formConfig: formConfig, // Pass full config to access registerUser flag
});
```

## Login Redirect Flow

### 1. Login Page Updates

Updated `/src/pages/auth/login.astro`:

```typescript
// Get redirect parameter to send user back after login
const redirectUrl = Astro.url.searchParams.get("redirect") || "/project/dashboard";

// Redirect authenticated users to specified URL
if (isAuth) {
  return Astro.redirect(redirectUrl);
}
```

### 2. AuthForm Component

Updated `/src/components/form/AuthForm.astro`:

```astro
---
const { globalInputClasses, redirectUrl = "/project/dashboard" } = Astro.props;
---

<form action="/api/auth/signin" method="post">
  <!-- Hidden redirect field -->
  <input type="hidden" name="redirect" value={redirectUrl} />
  <!-- ... email/password fields -->
</form>
```

### 3. Signin API Endpoint

Updated `/src/pages/api/auth/signin.ts`:

```typescript
const redirectTo = formData.get("redirect")?.toString() || "/dashboard";

// After successful authentication...
return redirect(redirectTo);
```

## Complete Flow Example

### Registration Form Flow (registerUser: true)

1. User visits `/auth/register-json`
2. Enters email: `existing@example.com`
3. Clicks "next"
4. Handler checks email → **Already exists**
5. Shows notification: "Email Already Registered"
6. Links to: `/auth/login?redirect=/auth/register-json`
7. Auto-redirects after 10 seconds
8. User logs in
9. Redirected back to `/auth/register-json`
10. Form shows "Logged in as existing@example.com"

### MEP Form Flow (registerUser: false)

1. User visits `/mep-form` (not authenticated)
2. Enters email: `existing@example.com`
3. Clicks "next"
4. Handler **skips email check** → Proceeds to Step 2
5. Completes form
6. Submits
7. Backend checks for existing user
8. If found: Updates existing user's profile, creates project
9. If not found: Creates new user account, creates project

## Benefits

1. **Flexibility**: Different forms can have different email handling strategies
2. **User Experience**: No confusion about why form blocks existing emails (only when needed)
3. **Clean Architecture**: Config-driven behavior, no hardcoded form ID checks
4. **Seamless Return**: Users can return to the exact form they were filling out after login
5. **Backend Compatibility**: MEP form backend can still handle user lookup/creation as needed

## Files Modified

1. `/src/lib/multi-step-form-config.ts` - Added `registerUser` to interface
2. `/src/lib/forms/mep-form-config.ts` - Set `registerUser: false`
3. `/src/lib/forms/register-form-config.ts` - Set `registerUser: true`
4. `/src/lib/multi-step-form-handler.ts` - Updated validation logic to use flag
5. `/src/pages/auth/login.astro` - Added redirect parameter handling
6. `/src/components/form/AuthForm.astro` - Added redirect hidden field
7. `/src/pages/api/auth/signin.ts` - Added redirect parameter to response

## Future Use Cases

This pattern can be extended for other form types:

- Contact forms: `registerUser: false` (anyone can submit)
- Account settings: `registerUser: false` (editing existing user)
- Invite/onboarding: `registerUser: true` (ensure unique emails)
