# Supabase Google OAuth Branding (No Custom Domain)

Show your app name and logo on the Google OAuth consent screen instead of `random-string.supabase.co`. No Supabase custom domain ($10/mo) required.

**Reference:** [Fix Supabase Google OAuth Branding Without Paying for Custom Domains](https://www.supascale.app/blog/supabase-google-oauth-branding-without-custom-domain)

## What You Get

- **Before:** "Continue to **jlbhzsgfliueshfsdb.supabase.co**"
- **After:** "Continue to **Your Project Name**" (with your logo)

## Prerequisites

- Supabase project with Google OAuth already working
- A domain you own (production site URL)
- **Privacy policy** page (this app has `/privacy`)
- **Terms of service** page (this app has `/terms`)
- Logo image: square, at least 120×120px

## Step 1: Verify Your Domain (Google Search Console)

1. Go to [Google Search Console](https://search.google.com/search-console)
2. **Add Property** → **URL prefix** → enter your site (e.g. `https://yourapp.com`)
3. Verify (e.g. download HTML file, put in site root, then **Verify**)

Google must see you own the domain for OAuth consent screen configuration.

## Step 2: Create or Use a Google Cloud Project

1. [Google Cloud Console](https://console.cloud.google.com/) → project dropdown → **New Project**
2. Name the project **exactly** what you want on the consent screen (e.g. "Rothco Built" or your company name)
3. Select that project

## Step 3: OAuth Consent Screen

1. **APIs & Services** → **OAuth consent screen**
2. User type: **External** (unless org-only)
3. **Create**

### App information

- **App name:** Your app/company name (replaces the Supabase subdomain text)
- **User support email:** Your support email
- **App logo:** Upload square logo (min 120×120px)

### App domain

- **Application home page:** `https://yourdomain.com`
- **Application privacy policy:** `https://yourdomain.com/privacy`
- **Application terms of service:** `https://yourdomain.com/terms`

### Authorized domains

- **Add domain** → enter your domain only, e.g. `yourdomain.com` (no `https://`)
- Domain must be verified in Search Console (Step 1)

### Developer contact

- Add email(s) for Google to contact you

**Save and Continue.**

## Step 4: Scopes

1. **Add or Remove Scopes**
2. For basic sign-in only, use:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
3. **Update** → **Save and Continue**

Avoid extra sensitive scopes if you only need login; they can trigger verification or testing mode.

## Step 5: Test Users (Optional)

If the app is in **Testing** mode, add test user emails so they can sign in. Skip if you will publish in Step 8.

## Step 6: OAuth Credentials

1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: e.g. "Supabase Auth"
5. **Authorized redirect URIs** → Add:
   ```text
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```
   Replace `YOUR-PROJECT-REF` with your Supabase project reference (from Supabase dashboard URL or project settings).
6. **Create** → copy **Client ID** and **Client Secret**

## Step 7: Supabase

1. Supabase project → **Authentication** → **Providers** → **Google**
2. Enable Google
3. Paste **Client ID** and **Client Secret** from Step 6
4. Save

## Step 8: Publish the OAuth App

1. Back in GCP: **APIs & Services** → **OAuth consent screen**
2. Under **Publishing status** → **Publish App**
3. Confirm

Until you publish, branding may not show correctly and only test users can sign in (if in Testing mode). For email/profile/openid only, publishing is usually immediate.

## Step 9: Test

Use an incognito window:

1. Open your app’s login page
2. Click “Sign in with Google”
3. Confirm the consent screen shows your **app name** and **logo**, not the Supabase subdomain

## Troubleshooting

| Issue | Check |
|-------|--------|
| Still shows Supabase subdomain | App **published**; domain in **Authorized domains**; domain matches Search Console property |
| Unverified app warning | For non-sensitive scopes, users can use **Advanced** → **Go to [App Name] (unsafe)**; warning often goes away after publishing/verification |
| Logo missing | Square image, ≥120×120px, publicly accessible; allow up to 24h for cache |
| Redirect URI mismatch | Redirect in GCP must match exactly: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` |

## This Project

- **Auth:** Google OAuth used in `src/pages/auth/login.astro`, `register.astro` via `signInWithOAuth({ provider: "google" })`.
- **Pages:** `/privacy` and `/terms` exist (e.g. via `[...slug].astro` and content); use your production base URL when filling consent screen and authorized domains.

No code changes are required; only Google Cloud and Supabase configuration.
