# Config File Naming and Client-Specific Config

**Independent site settings** live in `config-[company-name].json` (e.g. `config-rothco-built.json`, `config-capco-design-group.json`). This replaces the single `config.json` for per-deployment customization.

## Config file resolution

1. **Env / URL** – `SITE_CONFIG`, `SITE_CONFIG_JSON`, `SITE_CONFIG_1/2/...`, or `SITE_CONFIG_URL` (if set).
2. **File (when no env config)** – In order (primary = `config-[company-name].json`):
   - `config-${globalCompanyName}.json` (from DB `companyName`, slugified)
   - `config-${RAILWAY_PROJECT_NAME}.json` (slugified)
   - `config.json` (fallback for local dev)
   - Searched in both `public/data/` and `dist/client/data/`
3. **Fallback** – `site-config.json` in project root (local dev).

Company/project names are slugified: lowercased, non-alphanumeric → `-`, e.g. `"Rothco Built"` → `config-rothco-built.json`, `"CAPCO Design Group"` → `config-capco-design-group.json`.

## Per-client setup

- For Rothco: **`public/data/config-rothco-built-llc.json`**
- For Capco: **`public/data/config-capco-design-group.json`**
- Run `node scripts/copy-config-to-company.mjs` to generate both from `config.json`, or pass a slug to create one
- Put all client-specific keys in the company file: `projectListColumns`, `asideNav`, `forms`, `contactForm`, `registerForm`, `loginForm`, `formButtonDefaults`, etc.
- Local dev without `RAILWAY_PROJECT_NAME` / DB company name falls back to `config.json`

## What is client-specific (in config JSON)

- **projectListColumns** – Project dashboard table columns (no more TS per-client files).
- **forms** – Form configs keyed by id (e.g. `nfpa25-wet-pipe-itm`).
- **registerForm**, **loginForm**, **contactForm**, **reviewForm**, **mepForm** – Legacy form keys (or move into `forms`).
- **asideNav** – Sidebar navigation.
- **formButtonDefaults**, **projectForm**, **features**, **navigation**, **site**, **branding**, etc.

## Project list table

- **Generic code** – `src/lib/project-list-table-config.ts` only reads `projectListColumns` from the loaded config.
- **No company-specific TS** – Old files `project-list-table-config-capco-design-group.ts` and `project-list-table-config-rothco-built.ts` are deprecated; columns come from config only.
