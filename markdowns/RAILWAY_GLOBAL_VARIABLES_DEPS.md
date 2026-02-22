# Local Dependencies on Railway Global Variables

All places in the repo that read or reference Railway-related environment variables (e.g. `RAILWAY_PROJECT_NAME`, `RAILWAY_PUBLIC_DOMAIN`).

---

## Variables used

| Variable | Meaning | Set by Railway? |
|----------|---------|------------------|
| **RAILWAY_PROJECT_NAME** | Company / project name; used as `clientId` for CMS, nav, branding | Yes (defaults to project name) |
| **RAILWAY_PUBLIC_DOMAIN** | Public URL (e.g. `https://yourapp.railway.app`) | Yes (from deployment) |
| **PUBLIC_RAILWAY_STATIC_URL** | Optional override for static/base URL (used in webhook) | No (you set it) |

---

## Source code (`src/`)

### RAILWAY_PROJECT_NAME

| File | Usage |
|------|--------|
| `src/pages/api/global/global-company-data.ts` | Fallback for `globalCompanyName` when DB key `companyName` is missing |
| `src/pages/api/utils/navigation.ts` | `clientId` for filtering nav/features by client |
| `src/pages/api/cms/pages.ts` | `clientId` for CMS page queries (GET/POST/PATCH/DELETE) |
| `src/pages/api/cms/import-markdown.ts` | `clientId` when importing markdown into CMS |
| `src/pages/api/cms/import-all-markdown.ts` | `clientId` when bulk importing markdown |
| `src/pages/api/vapi/cal-integration.ts` | Company name in booking confirmation email body |
| `src/lib/content.ts` | Default company name in site config; `clientId` for CMS page lookup |
| `src/lib/project-list-table-config.ts` | Fallback company name in project list table |
| `src/env.d.ts` | Type declaration: `ImportMetaEnv.RAILWAY_PROJECT_NAME` |

### RAILWAY_PUBLIC_DOMAIN

| File | Usage |
|------|--------|
| `src/pages/api/vapi/webhook.ts` | Base URL for webhook callbacks (with `PUBLIC_RAILWAY_STATIC_URL` fallback) – many occurrences |
| `src/pages/admin/design/placeholders.astro` | Placeholder docs: `{{RAILWAY_PUBLIC_DOMAIN}}` |
| `src/pages/project/settings.astro` | Shown in template placeholder help |

### Placeholders (replaced at runtime, not env reads)

These files use **literal placeholders** `{{RAILWAY_PROJECT_NAME}}` / `{{RAILWAY_PUBLIC_DOMAIN}}` that are replaced by shared placeholder logic (e.g. `placeholder-utils.ts`, email/PDF rendering):

- `src/lib/placeholder-utils.ts` – replaces `{{RAILWAY_PROJECT_NAME}}` and `{{RAILWAY_PUBLIC_DOMAIN}}` in strings
- `src/pages/admin/design/placeholders.astro` – documents placeholders
- `src/templates/email/template.html` – `{{RAILWAY_PROJECT_NAME}}`, `{{RAILWAY_PUBLIC_DOMAIN}}`
- `src/templates-email/_auth-templates.html` – `{{RAILWAY_PROJECT_NAME}}`
- `src/templates/pdf/legal.html` – `{{RAILWAY_PROJECT_NAME}}`
- `src/templates/pdf/demo.html` – `{{RAILWAY_PROJECT_NAME}}`
- `src/templates/pdf/components/footer-contact-info.html` – `{{RAILWAY_PROJECT_NAME}}`
- `src/templates/pdf/components/header-company-logo.html` – commented `{{RAILWAY_PROJECT_NAME}}`
- `src/pages/api/pdf/data.backup.ts` – placeholder map includes `RAILWAY_PROJECT_NAME`

---

## Build / config

| File | Variable(s) | Usage |
|------|-------------|--------|
| **astro.config.mjs** | `RAILWAY_PUBLIC_DOMAIN`, `RAILWAY_PROJECT_NAME` | `site` URL; Vite `define` so client bundle can read them |
| **config/railway/railway-template.json** | (defines vars for UI) | `RAILWAY_PROJECT_NAME` in `environment` with description/default |
| **config/railway/railway-plausible.json** | `${{RAILWAY_PUBLIC_DOMAIN}}` | In `BASE_URL` value |
| **config/railway/railway-calcom.json** | `${{RAILWAY_PUBLIC_DOMAIN}}` | NEXTAUTH_URL, NEXT_PUBLIC_WEBAPP_URL, NEXT_PUBLIC_WEBSITE_URL |

---

## Scripts (`scripts/`)

Scripts that read `RAILWAY_PROJECT_NAME` or `RAILWAY_PUBLIC_DOMAIN` (or reference them in docs):

- `apply-templates-to-project.js` – `RAILWAY_PUBLIC_DOMAIN` for template substitution
- `create-project-tool.js` – public domain for webhook URL (uses `RAILWAY_PUBLIC_DOMAIN` or `PUBLIC_DOMAIN`)
- `create-remember-tool.js` – same
- `create-knowledge-loader-tool.js` – same
- `create-booking-tool.js` – hardcoded fallback domain
- `update-getaccountinfo-tool.js` – hardcoded domain
- `test-vapi-booking.js` – `RAILWAY_PUBLIC_DOMAIN` for API base URL
- `test-internal-appointments.js` – (check for domain usage)
- `vapi-capco-config.js` – `RAILWAY_PROJECT_NAME` for company name; webhook URL from domain
- `vapi-firepumptesting-config.js` – `RAILWAY_PUBLIC_DOMAIN` / `WEBHOOK_DOMAIN`
- `vapi-barbers-edge-config.js` – company name / webhook domain
- `process-manifest.js` – company name (from config / env)
- `setup-env-complete.sh` – sets `RAILWAY_PUBLIC_DOMAIN` example
- `setup-new-client.sh` – sets `RAILWAY_PROJECT_NAME`
- `setup-client.sh` – sets `RAILWAY_PROJECT_NAME`
- `deploy-client.sh` – syncs vars including `RAILWAY_PROJECT_NAME` to Railway
- `update-all-clients.sh` – reads `RAILWAY_PROJECT_NAME` from client configs
- `start-production.sh` – echoes `RAILWAY_PUBLIC_DOMAIN` in debug

(Other scripts in `scripts/` may reference these in comments or one-off usage; the list above covers the main dependencies.)

---

## Summary

- **RAILWAY_PROJECT_NAME**: Company name + `clientId` for CMS/navigation/branding. Must match DB company name for correct client content (see `markdowns/CMS_DATABASE_BREAKING_LAYOUT.md`).
- **RAILWAY_PUBLIC_DOMAIN**: Public site URL; used in Astro `site`, webhook callbacks, VAPI/config scripts, and templates (as placeholder).
- **PUBLIC_RAILWAY_STATIC_URL**: Optional override for base URL in `src/pages/api/vapi/webhook.ts` only.

All of these are “Railway global variables” in the sense that they are typically set in the Railway project (or service) Variables; `RAILWAY_PROJECT_NAME` and `RAILWAY_PUBLIC_DOMAIN` are often auto-set by Railway.
