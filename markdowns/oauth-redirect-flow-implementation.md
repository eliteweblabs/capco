# OAuth Redirect Flow Implementation

## Overview
Fixed the OAuth callback system to properly handle redirect parameters, allowing users to return to the form they were filling out after logging in with Google.

## Problem
When a user clicked "Sign in with Google" from the login page (with a `?redirect=/mep-form` parameter), they would complete OAuth but always be redirected to `/project/dashboard` instead of returning to the MEP form.

## Root Cause
The OAuth flow wasn't preserving the redirect parameter through the multiple steps:
1. Login page → Google OAuth → Supabase callback → Final destination
2. The `redirect` parameter was being lost at the Supabase callback step

## Solution Flow

### 1. Login Page (`/auth/login?redirect=/mep-form`)
- Receives `redirect` parameter from URL
- Passes it to `AuthForm` component
- Adds hidden `<input name="redirect" value="/mep-form">` field

### 2. Google OAuth Initiation (Client-side)
Updated `/src/components/form/AuthForm.astro`:
```typescript
// Get the redirect destination from the hidden form field
const redirectDestination = document.querySelector('input[name="redirect"]')?.value || "/project/dashboard";

// Include it in the OAuth callback URL
const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectDestination)}`;

// Pass to Supabase OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: callbackUrl, // e.g., http://localhost:4321/auth/callback?redirect=/mep-form
    // ...
  },
});
```

### 3. OAuth Callback Page (`/auth/callback?code=...&redirect=/mep-form`)
Updated `/src/pages/auth/callback.astro`:
```javascript
// Capture redirect parameter immediately on page load
const initialUrlParams = new URLSearchParams(initialSearch);
const capturedRedirect = initialUrlParams.get("redirect") || initialHashParams.get("redirect");

console.log("[AUTH-CALLBACK] Captured redirect:", capturedRedirect);

// After successful auth, redirect to the captured URL
const redirectUrl = capturedRedirect || "/project/dashboard";
console.log("[AUTH-CALLBACK] Redirecting to:", redirectUrl);
window.location.replace(redirectUrl);
```

## Complete Flow Example

### User Journey
1. User visits `/mep-form` (not logged in)
2. Enters email: `existing@example.com`
3. System detects email exists (`registerUser: true` forms only)
4. Shows notification: "Click here to log in and continue"
5. Link points to: `/auth/login?redirect=/mep-form`
6. User clicks "Sign in with Google"
7. JavaScript reads hidden field: `redirect=/mep-form`
8. Initiates OAuth with callback: `/auth/callback?redirect=/mep-form`
9. User authenticates with Google
10. Google redirects to: `/auth/callback?code=abc123&redirect=/mep-form`
11. Callback page captures both `code` and `redirect` parameters
12. Exchanges code for session
13. Sets auth cookies
14. Redirects to: `/mep-form` ✅
15. User sees form with "Logged in as user@example.com"
16. Form skips email/name/phone steps (authenticated)
17. User continues from Step 4 (Address)

### URL Parameter Flow
```
Start:     /mep-form
           ↓
Login:     /auth/login?redirect=/mep-form
           ↓
OAuth:     /auth/callback?redirect=/mep-form (registered with Supabase)
           ↓
Google:    https://accounts.google.com/o/oauth2/auth?...&redirect_uri=/auth/callback%3Fredirect%3D%2Fmep-form
           ↓
Return:    /auth/callback?code=abc123&redirect=/mep-form
           ↓
Final:     /mep-form ✅
```

## Files Modified

### 1. `/src/pages/auth/login.astro`
```typescript
// Get redirect parameter
const redirectUrl = Astro.url.searchParams.get("redirect") || "/project/dashboard";

// Redirect authenticated users to specified URL
if (isAuth) {
  return Astro.redirect(redirectUrl);
}

// Pass to AuthForm
<AuthForm {globalInputClasses} {redirectUrl} />
```

### 2. `/src/components/form/AuthForm.astro`
```astro
---
const { globalInputClasses, redirectUrl = "/project/dashboard" } = Astro.props;
---

<form>
  <!-- Hidden field for password login -->
  <input type="hidden" name="redirect" value={redirectUrl} />
  <!-- ... -->
</form>

<script>
  async function triggerGoogleOAuth(e?: Event) {
    // Read redirect from hidden field
    const redirectDestination = document.querySelector('input[name="redirect"]')?.value || "/project/dashboard";
    
    // Include in OAuth callback URL
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectDestination)}`;
    
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        // ...
      },
    });
  }
</script>
```

### 3. `/src/pages/auth/callback.astro`
```javascript
// Capture redirect immediately on page load
const capturedRedirect = initialUrlParams.get("redirect") || initialHashParams.get("redirect");
console.log("[AUTH-CALLBACK] Captured redirect:", capturedRedirect);

// Use it for final redirect (two places in the code)
const redirectUrl = capturedRedirect || "/project/dashboard";
window.location.replace(redirectUrl);
```

### 4. `/src/pages/api/auth/signin.ts`
```typescript
// For password-based login
const redirectTo = formData.get("redirect")?.toString() || "/dashboard";

// After successful auth
return redirect(redirectTo);
```

## Supabase Configuration

### Important Note
The base callback URL must be registered in Supabase:
- ✅ `http://localhost:4321/auth/callback` (development)
- ✅ `https://capcofire.com/auth/callback` (production)

The query parameters (`?redirect=/mep-form`) are automatically preserved by Supabase OAuth and don't need separate registration.

## Benefits

1. **Seamless UX**: Users return to exactly where they were
2. **Works with OAuth**: Google OAuth properly preserves redirect destination
3. **Works with Password**: Password login also respects redirect parameter
4. **Graceful Fallback**: Defaults to `/project/dashboard` if no redirect specified
5. **URL Encoded**: Properly handles special characters in redirect URLs
6. **Immediate Capture**: Captures parameters before any URL manipulation

## Testing

### Test Case 1: MEP Form with Existing Email
1. Visit `/mep-form` (not logged in)
2. Enter existing email
3. Click login link (should go to `/auth/login?redirect=/mep-form`)
4. Sign in with Google
5. Should return to `/mep-form` ✅

### Test Case 2: Direct Login
1. Visit `/auth/login` (no redirect parameter)
2. Sign in with Google
3. Should go to `/project/dashboard` ✅

### Test Case 3: Password Login with Redirect
1. Visit `/auth/login?redirect=/admin/settings`
2. Enter email/password
3. Click "sign in"
4. Should go to `/admin/settings` ✅

## Debug Logging

Key console logs to verify flow:
```
[GOOGLE-SIGNIN] Post-auth redirect destination: /mep-form
[GOOGLE-SIGNIN] Callback URL (OAuth redirect): http://localhost:4321/auth/callback?redirect=%2Fmep-form
[AUTH-CALLBACK] Captured redirect: /mep-form
[AUTH-CALLBACK] Redirecting to: /mep-form
[MEP-FORM] User authenticated via cookies: user@example.com
```
