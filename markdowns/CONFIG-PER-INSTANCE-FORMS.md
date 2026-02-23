# Per-Instance Site Config (Forms and More)

This repo is used for multiple websites. All forms (contact, register, login, MEP, review, etc.) and other site config come from JSON. Each instance can override via **config-[globalCompanyName].json** so forms and settings can be modified per deployment without changing shared code.

## Config file order (first existing wins)

When no env-based config is set (`SITE_CONFIG`, `SITE_CONFIG_JSON`, `SITE_CONFIG_URL`, etc.), the loader reads from **public/data/** (or **dist/client/data/** after build) in this order:

1. **config-[globalCompanyName].json** – Company name from DB (`globalSettings.companyName`) or `RAILWAY_PROJECT_NAME`, slugified (e.g. "Rothco Built, LLC" → `config-rothco-built-llc.json`).
2. **config-[RAILWAY_PROJECT_NAME].json** – Deploy target name, slugified (e.g. `config-capco-design-group.json`).
3. **config.json** – Shared/default config.

So for Rothco you can add **public/data/config-rothco-built.json** (or whatever the slug is for that company name) and put form definitions and other overrides there. Same repo, different config file per instance.

## What goes in the config

- **forms** – Contact, register, login, review, MEP, project forms, etc. Keys like `contact-form`, `register-form`, `login-form`, `mep-form`, `review-form`, and any custom form IDs.
- **formButtonDefaults** – Global button styling.
- **projectForm**, **userForm**, **asideNav**, **projectListColumns**, and other keys merged into site config.

## Naming the file

The filename is the **slug** of the company name:

- Spaces and punctuation → `-`
- Lowercase
- Examples: `Rothco Built, LLC` → `config-rothco-built-llc.json`, `Capco Design Group` → `config-capco-design-group.json`

If the DB has no company name (or "Company Name Not Set"), the company-slug file is skipped and the loader falls back to **config-[RAILWAY_PROJECT_NAME].json** then **config.json**.

## Env config still wins

If you set **SITE_CONFIG** / **SITE_CONFIG_JSON** / **SITE_CONFIG_URL**, that is used and file-based config (including config-[globalCompanyName].json) is not read.
