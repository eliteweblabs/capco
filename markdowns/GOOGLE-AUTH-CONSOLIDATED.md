# Google (Supabase OAuth) Auth – Consolidated

All Google sign-in logic lives in **one place** to avoid loops and scattered workarounds.

## Single source of truth

- **`src/lib/auth-google.ts`**
  - `startGoogleSignIn(redirectUrl?)` – starts Supabase Google OAuth (PKCE in browser).
  - `handleLoginPageQueryParams()` – handles `/auth/login?provider=google` and `?error=...`.
  - Sets `window.handleGoogleSignup` and one document-level click listener for `.provider-btn[data-provider="google"]`.
  - When loaded on `/auth/login`, runs `handleLoginPageQueryParams()` so `?provider=google` auto-starts OAuth.

## Standalone page (no App.astro)

- **`/auth/google`** (`src/pages/auth/google.astro`)
  - One button: “Continue with Google”.
  - One script: imports `startGoogleSignIn` from `lib/auth-google.ts`, button click calls `startGoogleSignIn(redirectTo)`.
  - Query: `?redirect=/path` (default `/project/dashboard`).
  - Use this URL when you want a minimal, reliable Google sign-in (e.g. link from emails, or when the main app script fails).

## Where the script is loaded

- **App.astro** – loads `auth-google.ts` so every page that uses the main layout (navbar, dropdown, login form) has `handleGoogleSignup` and the Google button works.
- **auth/login.astro** – loads `auth-google.ts` (login uses LayoutFullForm → App, so App already loads it; the extra script on login ensures the route bundle also has it and `?provider=google` is handled).

## Fallback when script is missing

- **AuthProviders.astro** – if `window.handleGoogleSignup` is not a function, redirects to **`/auth/google?redirect=...`** so the user always has a working path (standalone page).

## Callback (unchanged)

- User is sent to `redirectTo: ${origin}/auth/callback?redirect=...`.
- **`/auth/callback`** – client-side `exchangeCodeForSession(code)`, then POST to `/api/auth/callback` to set cookies, then redirect to `redirect` param.
- **`/api/auth/callback`** – GET redirects to `/auth/callback?query`; POST sets session cookies.

## Removed / don’t use

- **`login-form-client.ts`** – deleted; logic moved to `lib/auth-google.ts`.
- **`/api/auth/google-start`** – server-side start; do **not** use as fallback for the main flow (no PKCE in browser → callback exchange fails → loop).
- **test-login** – now redirects to `/auth/google?redirect=...` (single standalone page).

## Flow summary

1. User clicks “Sign in with Google” (login form, dropdown, or `/auth/google`).
2. Either `handleGoogleSignup()` runs (script loaded) or user is sent to `/auth/google?redirect=...`.
3. `startGoogleSignIn(redirect)` runs in the browser → Supabase `signInWithOAuth` → redirect to Google.
4. Google redirects to `/auth/callback?code=...&redirect=...`.
5. Callback page runs `exchangeCodeForSession(code)` (PKCE verifier in localStorage), POSTs tokens to `/api/auth/callback`, then redirects to `redirect`.
