# Railway Deployment Audit – Local vs Production Parity

**Date:** February 20, 2026  
**Purpose:** Identify code that could behave differently on Railway vs local development

## Summary

Most internal API URL resolution is already fixed (per [railway-deployment-econnrefused-fix.md](./railway-deployment-econnrefused-fix.md)). Remaining risks are mainly env vars, localhost fallbacks when request context or DB settings are missing, and build-time vs runtime env handling.

---

## 1. Environment Variables – Required for Railway

### Must be set in Railway dashboard

| Variable | Purpose | Used in | Risk if missing |
|----------|---------|---------|------------------|
| `PUBLIC_URL` | OAuth redirect URIs (Gmail, Google) | `src/pages/api/auth/gmail/callback.ts`, `src/lib/gmail.ts`, `authorize.ts` | Gmail/Google OAuth will redirect to `http://localhost:4321` → **OAuth fails** |
| `RAILWAY_PUBLIC_DOMAIN` | Site URL, Astro `site`, base URL fallbacks | `astro.config.mjs`, `vite.define`, multiple API routes | Wrong sitemap/canonical URLs, some fallbacks |
| `PUBLIC_RAILWAY_STATIC_URL` | Optional override for VAPI webhook base URL | `src/pages/api/vapi/webhook.ts` | Falls back to `request` or other sources, usually OK |
| `SITE_CONFIG_JSON` / `SITE_CONFIG` | Navigation, features, form config | `src/lib/content.ts` | Falls back to `site-config.json` if present in image |

### Build-time (Dockerfile ARGs)

The Dockerfile passes many vars as build args. Ensure these are configured in Railway as **build-time variables** (or equivalent) so they are available when `npm run build:railway` runs:

- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE`, `SUPABASE_SECRET`
- `RAILWAY_PUBLIC_DOMAIN`
- API keys: `ANTHROPIC_API_KEY`, `VAPI_API_KEY`, `EMAIL_API_KEY`, etc.
- Company branding: `GLOBAL_COLOR_PRIMARY`, `GLOBAL_COLOR_SECRETARY`, logos, etc.

---

## 2. Localhost Fallbacks – Code to Improve

### High priority

| File | Line | Issue | Impact |
|------|------|-------|--------|
| `src/pages/api/auth/gmail/callback.ts` | 41 | `import.meta.env.PUBLIC_URL \|\| "http://localhost:4321"` | **Gmail OAuth fails** – set `PUBLIC_URL` in Railway |
| `src/pages/api/auth/gmail/authorize.ts` | 22 | Same fallback | Same |
| `src/lib/gmail.ts` | 62 | Same fallback | Same |

**Action:** Set `PUBLIC_URL=https://your-railway-domain.com` in Railway.

### Medium priority (when request or DB data is missing)

| File | Line | Issue | Impact |
|------|------|-------|--------|
| `src/lib/placeholder-utils.ts` | 127 | `baseUrl = "http://localhost:4321"` when no `request` and no `globalCompanyWebsite` | Links in punchlist/discussion templates may point to localhost |
| `src/lib/content.ts` | 179 | `url: companyData?.globalCompanyWebsite \|\| "http://localhost:4321"` | Site config URL defaults to localhost |
| `src/pages/api/webhook/_callee.ts` | 366 | `request ? getApiBaseUrl(request) : "http://localhost:4321"` | Only when `findOrCreateUser` is called without request – current callers pass `request` |

**Status:** Fixed – `placeholder-utils.ts` and `content.ts` now use `RAILWAY_PUBLIC_DOMAIN` / `PUBLIC_URL` as fallbacks. `_callee.ts` findOrCreateUser also updated.

### Low priority (error paths only)

| File | Line | Issue | Impact |
|------|------|-------|--------|
| `src/pages/api/vapi/status.ts` | 62 | `siteUrl: "http://localhost:4321"` in catch block | Only used in error response, misleading but not functional |

---

## 3. `applyProjectTemplates` – No Request Context

- **File:** `src/lib/apply-project-templates.ts`
- **Caller:** `src/pages/api/projects/upsert.ts` (has `request`)
- **Behavior:** `replacePlaceholders(template.message, placeholderData)` is called without `request`.

If templates contain `{{projectLink}}` or similar URLs and `globalCompanyWebsite` is not set in admin settings, links will use localhost.

**Recommendation:** Either:

1. Pass `request` into `applyProjectTemplates` and through to `replacePlaceholders`, or  
2. Add `process.env.RAILWAY_PUBLIC_DOMAIN` / `PUBLIC_URL` fallback in `placeholder-utils.ts` when `request` is undefined.

---

## 4. `import.meta.env` vs `process.env`

- **Build-time:** `import.meta.env` values come from Vite at build time via `vite.define` in `astro.config.mjs`. If Railway does not provide these during the Docker build, they may be empty.
- **Runtime:** `process.env` is used at runtime, e.g. in `src/pages/api/agent/chat.ts`, `supabase-admin.ts`, and webhook logic.

The config uses `loadEnv()` and `vite.define` so the build step reads `.env` and `process.env`. In Docker, the Dockerfile sets `ENV` from `ARG`s; those must be passed as build args.

---

## 5. Verify These Are Correct

### Check list for Railway deployment

1. **`PUBLIC_URL`** (optional) – Can be set to your production base URL. If unset, `RAILWAY_PUBLIC_DOMAIN` is used.
2. **`RAILWAY_PUBLIC_DOMAIN`** – Injected by Railway; used for website URL, OAuth, placeholders. No admin “website” setting needed.
3. **`SITE_CONFIG_JSON`** – If you rely on env-based config, ensure it’s set in Railway (and within size limits).
4. **Supabase** – Same Supabase project/instance for local and Railway; env vars match (URL, anon key, service role key).

---

## 6. Known Working / Already Fixed

- `getApiBaseUrl(request)` – Callers pass `request` where needed (per ECONNREFUSED fix).
- VAPI webhook – Uses `getApiBaseUrl(request)` or `PUBLIC_RAILWAY_STATIC_URL` fallbacks.
- Email webhook – Passes `request` into `findOrCreateUser` and `createProjectFromEmail`.
- Node adapter – Runs in standalone mode; listens on `PORT` from Railway.

---

## Recommended Code Changes (Optional but Helpful)

1. **`src/lib/placeholder-utils.ts`** (lines ~124–128):

   Add env fallback before localhost:

   ```ts
   if (!baseUrl) {
     baseUrl =
       process.env.RAILWAY_PUBLIC_DOMAIN
         ? (process.env.RAILWAY_PUBLIC_DOMAIN.startsWith("http")
             ? process.env.RAILWAY_PUBLIC_DOMAIN
             : `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`)
         : process.env.PUBLIC_URL
           ? process.env.PUBLIC_URL
           : "http://localhost:4321";
   }
   ```

2. **`src/lib/content.ts`** (around line 179):

   Add env fallback:

   ```ts
   url: companyData?.globalCompanyWebsite ||
     process.env.RAILWAY_PUBLIC_DOMAIN
       ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
       : process.env.PUBLIC_URL ||
         "http://localhost:4321",
   ```

   (Handle `RAILWAY_PUBLIC_DOMAIN` with/without protocol as needed.)

3. **Dockerfile / Railway variables** – Add `PUBLIC_URL` as a build ARG if Gmail callback must work without runtime injection, or rely on Railway providing it at runtime if the adapter supports it.
