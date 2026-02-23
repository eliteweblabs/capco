# Live Site: Google OAuth localhost Redirect + Console Errors Fix

## Problem

1. **Google Auth returns localhost** – After signing in with Google on the live site (e.g. `rothco-firstbranch.up.railway.app`), the redirect goes to `http://localhost:3000/?code=...` instead of the live URL.
2. **Console errors** – 404 for `/scripts/app-globals`, "Cannot use import statement outside a module", and related script failures.

## Root Causes

### OAuth localhost redirect

The OAuth flow uses the **origin** to build the callback URL. If `RAILWAY_PUBLIC_DOMAIN` or `PUBLIC_SITE_URL` is missing in production, or if Supabase/Google are misconfigured, the user can end up on localhost.

**Code fix applied:** `google-start.ts` now prefers `RAILWAY_PUBLIC_DOMAIN` first when set, so production never accidentally falls back to localhost.

**Set env vars on Railway** (use Railway MCP or Railway CLI – see `.cursor/rules/railway-env-config.mdc`):

```bash
# With Railway CLI (ensure project linked: railway status)
railway variables                                    # list current
railway variables --set "PUBLIC_SITE_URL=https://rothco-firstbranch.up.railway.app"
# RAILWAY_PUBLIC_DOMAIN is usually set by Railway (rothco-firstbranch.up.railway.app)
# For capco: railway link → select CAPCO Design Group, then run same --set
```

2. **Supabase Dashboard** → Authentication → URL Configuration:
   - **Site URL**: `https://rothco-firstbranch.up.railway.app` (not localhost)
   - **Redirect URLs**: Add `https://rothco-firstbranch.up.railway.app/auth/callback`
   - Repeat for each deployment (capcofire.com, etc.)

3. **Google Cloud Console** → Credentials → OAuth 2.0 Client:
   - **Authorized redirect URIs** must include:  
     `https://qudlxlryegnainztkrtk.supabase.co/auth/v1/callback`  
     (Supabase’s callback – Google redirects here first)
   - Do **not** use `http://localhost:3000/` for production testing; it will cause exactly this bug.

4. **Check Railway logs** after clicking “Sign in with Google” – you should see:
   ```
   [auth/google-start] OAuth redirectTo: https://rothco-firstbranch.up.railway.app/auth/callback?redirect=...
   ```
   If you see `localhost` there, the env vars are wrong or missing.

### app-globals 404 and script errors

The `import("../../scripts/app-globals")` script is bundled by Astro/Vite. In production, that chunk can 404 or be empty, which leads to:

- Missing `showNotice`, `initInputWithIcon`, and other `window.*` helpers
- “Cannot use import statement outside a module” when other scripts assume the right execution context
- Cascading failures (forms, dropdowns, toasts, etc.)

**Mitigations:**

1. **Ensure Railway deploys static assets** – `dist/client/_astro/*.js` must be served. If chunks 404, check that the server is configured to serve files from `dist/client`.

2. **Optional: pre-bundle app-globals** – If the Astro chunk keeps failing, you can add an esbuild step (similar to `app-init.js`) to produce `public/scripts/app-globals.js` and load it with a static `<script src="/scripts/app-globals.js">` instead of the dynamic import. (app-globals has many dependencies; this needs careful bundling.)

3. **Fallbacks** – The app already has fallbacks (e.g. form init, theme toggle) that run when app-globals fails. Those reduce breakage but don’t restore all behavior.

4. **Clear caches** – After fixes, hard-refresh (Ctrl+Shift+R) or use incognito to avoid cached broken chunks.

## Quick checklist

- [ ] `RAILWAY_PUBLIC_DOMAIN` or `PUBLIC_SITE_URL` set in Railway for each deployment
- [ ] Supabase Site URL = live domain (not localhost)
- [ ] Supabase Redirect URLs include `https://<your-domain>/auth/callback`
- [ ] Google OAuth Client has Supabase callback: `https://<project>.supabase.co/auth/v1/callback`
- [ ] No `localhost` in Google Authorized redirect URIs used for production
- [ ] Redeploy after env changes
- [ ] Check Railway logs for `[auth/google-start] OAuth redirectTo:` to confirm correct URL
