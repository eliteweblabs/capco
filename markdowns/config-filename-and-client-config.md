# Config File Naming and Client-Specific Config

All client-specific configuration lives in JSON config. The app loads config by **project name** when deployed.

## Config file resolution

1. **Env / URL** – `SITE_CONFIG`, `SITE_CONFIG_JSON`, `SITE_CONFIG_1/2/...`, or `SITE_CONFIG_URL` (if set).
2. **File (when no env config)** – In order:
   - `public/data/config-${RAILWAY_PROJECT_NAME}.json` (slugified)
   - `dist/client/data/config-${RAILWAY_PROJECT_NAME}.json`
   - `public/data/config.json`
   - `dist/client/data/config.json`
3. **Fallback** – `site-config.json` in project root (local dev).

`RAILWAY_PROJECT_NAME` is slugified for the filename: lowercased, non-alphanumeric replaced with `-`, e.g. `"Rothco Built"` → `config-rothco-built.json`, `"rothcobuilt"` → `config-rothcobuilt.json`.

## Per-client setup

- For a deployment with `RAILWAY_PROJECT_NAME="Rothco Built"`, use **`public/data/config-rothco-built.json`** (or keep using `config.json` as fallback).
- Put all client-specific keys in that file: `projectListColumns`, `asideNav`, `forms`, `contactForm`, `registerForm`, `loginForm`, `formButtonDefaults`, etc.
- Shared or local dev can keep using **`config.json`** with no env set.

## What is client-specific (in config JSON)

- **projectListColumns** – Project dashboard table columns (no more TS per-client files).
- **forms** – Form configs keyed by id (e.g. `nfpa25-wet-pipe-itm`).
- **registerForm**, **loginForm**, **contactForm**, **reviewForm**, **mepForm** – Legacy form keys (or move into `forms`).
- **asideNav** – Sidebar navigation.
- **formButtonDefaults**, **projectForm**, **features**, **navigation**, **site**, **branding**, etc.

## Project list table

- **Generic code** – `src/lib/project-list-table-config.ts` only reads `projectListColumns` from the loaded config.
- **No company-specific TS** – Old files `project-list-table-config-capco-design-group.ts` and `project-list-table-config-rothco-built.ts` are deprecated; columns come from config only.
