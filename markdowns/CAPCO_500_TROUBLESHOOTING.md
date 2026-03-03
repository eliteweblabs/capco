# CAPCO Internal Server Error (500) Troubleshooting

## Root Cause (Fixed)

**CAPCO 500 was caused by:** `loginForm is missing from site config`

When no site config is loaded (no `SITE_CONFIG` env, no `config-*.json`, no `site-config.json`), the app used "minimal defaults" that did **not** include `loginForm`, `registerForm`, or `contactForm`. Every page that renders `App.astro` (which uses `getLoginFormConfig` for the layout) then threw and returned 500.

**Fix:** Added minimal `loginForm`, `registerForm`, `contactForm`, `mepForm`, and `reviewForm` to the default config in `src/lib/content.ts`. Deploy the latest code to CAPCO to resolve.

---

## Quick Checks

### 1. Identify the Failing URL

The homepage (https://capcofire.com) and core routes often return 200. The 500 may occur on:
- Specific pages (e.g. `/project/[id]`, `/admin/settings`, `/mep-form`)
- API routes (e.g. `/api/global/company-data`, `/api/discussions/get`)
- Actions (form submit, file upload, etc.)

**What to capture:** The exact URL, whether it happens immediately on load or after an action (click/submit).

### 2. Check Railway Logs

The repo is linked to **Rothco** by default. To see CAPCO logs, link to the CAPCO project first:

```bash
# In a terminal with TTY (interactive)
railway link
# Select: Thomas Senecal's Projects → CAPCO Design Group

# Then link the web service (name may vary)
railway service
# Select the main Astro/web service

# View recent logs
railway logs --lines 200
```

**Or via Railway Dashboard:**
1. Go to [railway.app](https://railway.app)
2. Open **CAPCO Design Group** project
3. Select the main web service
4. Deployments → View logs
5. Search for: `❌`, `Error`, `500`, `Supabase`, `company_settings`, `activity_log`

### 3. Common 500 Causes for CAPCO

| Cause | Symptom in logs | Fix |
|-------|-----------------|-----|
| **Missing `company_settings` table** | `relation "company_settings" does not exist` | API now handles gracefully; returns fallback from `globalSettings` |
| **Missing `activity_log` table** | `relation "activity_log" does not exist` | API now handles gracefully; `system` section omitted |
| **Supabase env vars** | `[---SUPABASE-ADMIN] Supabase admin client not configured` | Set `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE`, `SUPABASE_SECRET` in Railway |
| **Schema mismatch** | `column "createdAt" does not exist` | CAPCO DB may use snake_case; compare schemas (see COMPARE_SCHEMAS_NOW.md) |
| **globalCompanyData throws** | Used in middleware for `/mep-form` | Check `globalSettings` table exists; `supabaseAdmin` configured |

### 4. Verify Environment Variables

In Railway (CAPCO project → Variables):

- `PUBLIC_SUPABASE_URL` – Supabase project URL
- `PUBLIC_SUPABASE_PUBLISHABLE` – Publishable/anonymous key
- `SUPABASE_SECRET` – Service role key (for admin operations)
- `RAILWAY_PUBLIC_DOMAIN` or `PUBLIC_SITE_URL` – For OAuth redirects

### 5. Schema Differences (Rothco vs CAPCO)

Rothco and CAPCO may have different table/column names. Run schema comparison:

```bash
node scripts/compare-and-generate-migration.cjs
```

Ensure `site-config-capco-design-group.json` and `site-config-rothco-built.json` exist with `schemaTables` and `schemaColumns`.

---

## Recent Hardening (company-data API)

`/api/global/company-data` has been made more resilient:

- `company_settings` – Wrapped in try/catch; missing table returns fallback from `globalCompanyData()`
- `activity_log` – Wrapped in try/catch; missing table omits `system` section
- `projects` and `profiles` – Wrapped in try/catch; schema errors no longer crash the route

After deploying these changes, redeploy CAPCO and re-check the failing URL.
