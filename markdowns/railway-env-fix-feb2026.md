# Railway Environment Variable Fix (Feb 2026)

## What Was Fixed

The site was not loading on Railway because **environment variables were not available during build**. On Railway, `.env` is not in the build context—vars come from Railway's environment. The code used `loadEnv()` only, which reads from `.env` files and returned empty values.

## Changes Made

1. **astro.config.mjs** – Merge `process.env` with `loadEnv()`:
   - `const env = { ...process.env, ...loaded };`
   - Railway-injected vars are now available during build.

2. **SUPABASE_SERVICE_ROLE_KEY fallback** – Railway template uses this name; the app expected `SUPABASE_SECRET`:
   - **astro.config.mjs** – `define` now uses both.
   - **supabase-admin.ts** – Runtime fallback added.
   - **process-manifest.js** – Accepts both key names.

## Required Railway Variables (Minimum)

| Variable | Required | Notes |
|----------|----------|-------|
| `PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (one or both) |
| `PUBLIC_SUPABASE_PUBLISHABLE` or `PUBLIC_SUPABASE_ANON_KEY` | Yes | Publishable/anon key |
| `RAILWAY_PUBLIC_DOMAIN` | Yes | Your domain (e.g. `capcofire.com`) - often auto-set |
| `RAILWAY_PROJECT_NAME` | Recommended | Company name (e.g. `CAPCO Design Group`) |

## Variables to Remove (If Causing Issues)

- `SITE_CONFIG_URL` – If set to a bad/non-existent path, remove it.
- `PUBLIC_STRIP_HEAVY_FEATURES` / `PUBLIC_DISABLE_HEAVY_SCRIPTS` – Remove if left over from debugging.

## Verify After Deploy

1. Check Railway **Build logs** – Should complete without errors.
2. Check **Deploy logs** – Look for `[---SUPABASE-ADMIN] Supabase admin client configured successfully`.
3. Visit the site – Home page and auth flows should load.
