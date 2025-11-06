# Auth Workflow Directory Structure

## Overview
This app has **two separate authentication systems**:
1. **Supabase OAuth** - For user authentication (login/signup)
2. **Google People API OAuth** - For accessing Google Contacts (standalone PDF system)

---

## Directory Structure

### Client-Side Auth Pages (`src/pages/auth/`)
```
src/pages/auth/
├── login.astro          # Login page UI
├── _login.astro         # Alternative login page (if exists)
├── register.astro       # Registration page UI
└── callback.astro       # OAuth callback handler (client-side PKCE flow)
```

**Key File: `callback.astro`**
- Handles **Supabase OAuth callbacks** (client-side)
- Uses PKCE flow (code verifier stored in localStorage)
- Exchanges authorization code for session tokens
- Sends tokens to `/api/auth/callback` (POST) to set server cookies

---

### Server-Side Auth API (`src/pages/api/auth/`)
```
src/pages/api/auth/
├── signin.ts            # Main signin endpoint (password + OAuth initiation)
├── callback.ts          # Unified callback handler (GET + POST)
├── login.ts             # Legacy login endpoint?
├── register.ts          # User registration
├── logout.ts            # Logout endpoint
├── signout.ts          # Alternative signout?
├── verify.ts           # Email verification
├── verify-custom.ts     # Custom verification?
├── check-email.ts       # Email availability check
├── forgot-password.ts   # Password reset request
├── reset-password.ts    # Password reset completion
├── set-session.ts       # Session management
└── save-avatar.ts       # Save user avatar from Google
```

**Key Files:**

#### `signin.ts` (POST)
- Handles **password login** and **OAuth initiation**
- For OAuth: redirects to Supabase OAuth → `/auth/callback` (client-side)
- For password: sets cookies directly and redirects to `/dashboard`

#### `callback.ts` (GET + POST)
- **GET handler**: Routes callbacks:
  - Google People API OAuth → `/api/google/____oauth-callback`
  - Supabase OAuth → `/auth/callback` (client-side)
- **POST handler**: Receives tokens from client-side PKCE exchange
  - Verifies session with Supabase
  - Sets auth cookies
  - Saves Google avatar if present
  - Logs login event

---

### Google People API (`src/pages/api/google/`)
```
src/pages/api/google/
├── signin.ts            # Initiates Google People API OAuth
├── ____oauth-callback.ts # Handles Google People API OAuth callback
├── signout.ts           # Clears Google tokens
├── contacts.ts          # Get Google contacts
├── contacts-v3.ts       # Alternative contacts endpoint?
├── places-autocomplete.ts # Google Places API
└── debug-oauth.ts       # OAuth debugging
```

**Key Files:**

#### `signin.ts` (GET)
- Initiates Google People API OAuth flow
- Redirects to `/api/auth/callback` (not `/api/google/oauth-callback`)
- Encodes redirect URL in state parameter

#### `____oauth-callback.ts` (GET)
- Handles Google People API OAuth callback
- Exchanges code for tokens
- Stores tokens in cookies (`google_access_token`, `google_refresh_token`)
- Used for accessing Google Contacts (not for user authentication)

**Note:** This is imported by `/api/auth/callback.ts` (GET) when Google People API OAuth is detected.

---

### Auth Library Files (`src/lib/`)
```
src/lib/
├── auth-cookies.ts      # Cookie management (set/get/clear)
├── auth.ts              # Auth utilities?
├── auth-utils.ts        # Auth helper functions?
├── supabase.ts          # Server-side Supabase client
├── supabase-client.ts   # Client-side Supabase singleton
├── supabase-admin.ts    # Admin Supabase client
├── campfire-auth.ts     # Campfire integration
└── google-auth.ts       # Google auth utilities?
```

**Key Files:**

#### `auth-cookies.ts`
- `setAuthCookies()` - Sets `sb-access-token` and `sb-refresh-token` cookies
- `clearAuthCookies()` - Clears auth cookies
- `getCurrentSession()` - Retrieves session from cookies

#### `supabase.ts`
- Server-side Supabase client
- Uses `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE`
- Created once at module load

#### `supabase-client.ts`
- Client-side Supabase singleton
- Prevents multiple GoTrueClient instances
- Uses `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE`

---

## Authentication Flow Diagrams

### Supabase OAuth Flow (User Login)

```
1. User clicks "Sign in with Google"
   ↓
2. POST /api/auth/signin (provider=google)
   ↓
3. Server: supabase.auth.signInWithOAuth()
   ↓
4. Redirect to Google OAuth
   ↓
5. User authorizes
   ↓
6. Google redirects to: /auth/callback?code=...&state=...
   ↓
7. Client: callback.astro (client-side)
   - Gets code from URL
   - Uses Supabase client (PKCE flow)
   - Exchanges code for session tokens
   ↓
8. POST /api/auth/callback (tokens)
   ↓
9. Server: Verifies session, sets cookies
   ↓
10. Redirect to /project/dashboard
```

### Google People API OAuth Flow (Contacts Access)

```
1. User needs Google Contacts (e.g., in PDF system)
   ↓
2. GET /api/google/signin?redirect=...
   ↓
3. Server: Redirects to Google OAuth
   (redirect_uri: /api/auth/callback)
   ↓
4. User authorizes
   ↓
5. Google redirects to: /api/auth/callback?code=...&state=...
   ↓
6. GET /api/auth/callback
   - Detects Google People API OAuth (from state)
   - Imports /api/google/____oauth-callback
   ↓
7. GET /api/google/____oauth-callback
   - Exchanges code for tokens
   - Stores tokens in cookies
   ↓
8. Redirects back to original page
```

### Password Login Flow

```
1. User submits login form
   ↓
2. POST /api/auth/signin (email + password)
   ↓
3. Server: supabase.auth.signInWithPassword()
   ↓
4. Sets auth cookies
   ↓
5. Redirects to /dashboard
```

---

## Key Differences

| Feature | Supabase OAuth | Google People API OAuth |
|---------|---------------|------------------------|
| **Purpose** | User authentication | Google Contacts access |
| **Initiation** | `/api/auth/signin` | `/api/google/signin` |
| **Callback** | `/auth/callback` (client) | `/api/auth/callback` (server) |
| **Final Handler** | `/api/auth/callback` (POST) | `/api/google/____oauth-callback` |
| **Tokens** | Supabase session tokens | Google API tokens |
| **Storage** | `sb-access-token`, `sb-refresh-token` | `google_access_token`, `google_refresh_token` |
| **Flow** | PKCE (client-side exchange) | Authorization code (server-side) |

---

## Environment Variables Required

### For Supabase OAuth:
```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE=your_publishable_key
```

### For Google People API OAuth:
```bash
GOOGLE_PEOPLE_CLIENT_ID=your_client_id
GOOGLE_PEOPLE_CLIENT_SECRET=your_client_secret
```

---

## Common Issues & Solutions

### Issue: "Can't find variable: supabaseUrl"
**Solution:** Ensure `PUBLIC_SUPABASE_URL` is set in environment variables.

### Issue: OAuth callback not working
**Check:**
1. Redirect URL registered in Supabase Dashboard
2. `PUBLIC_SUPABASE_URL` matches Supabase project URL
3. Client-side code has access to environment variables

### Issue: Google People API OAuth not routing correctly
**Check:**
1. `/api/google/signin.ts` redirects to `/api/auth/callback`
2. `/api/auth/callback.ts` (GET) detects Google People API OAuth from state
3. `/api/google/____oauth-callback.ts` is accessible

---

## Notes

- The Google People API OAuth callback is named `____oauth-callback.ts` (with underscores) to avoid conflicts with Supabase OAuth
- Both OAuth flows use `/api/auth/callback` as the initial redirect URI
- The GET handler in `/api/auth/callback.ts` routes to the appropriate handler based on state detection
- Supabase OAuth uses PKCE flow (client-side) for security
- Google People API OAuth uses server-side token exchange

