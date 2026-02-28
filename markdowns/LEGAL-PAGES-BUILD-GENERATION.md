# Legal Pages (Privacy / Terms / Cookies) – Build-Time Generation

## Overview

Privacy, Terms, and Cookies pages are **hardcoded** and **auto-generated on build** where applicable:

| Page   | Source                         | Route   |
|--------|--------------------------------|---------|
| Privacy | [PolicyGen](https://policygen.xyz) (generated at build) | `/privacy` |
| Terms   | PolicyGen (generated at build) | `/terms`   |
| Cookies | Hardcoded `CookiePreferences.astro` | `/cookies` |

## PolicyGen

[PolicyGen](https://policygen.xyz) is an npm package that generates GDPR/CCPA-compliant privacy policies and terms of service from a JSON config.

### Flow

1. **`scripts/prepare-policygen.mjs`** – Injects entity data (company name, address, website) from env or SITE_CONFIG into `policygen.json`.
2. **`npx policygen generate`** – Generates `src/pages/privacy.astro` and `src/pages/terms.astro`.
3. Build/dev runs as usual; Astro compiles the generated pages.

### Configuration

- **`policygen.json`** – Main config. Edit to change privacy/terms content (platforms, data types, compliance options).
- **Entity data** comes from:
  - `POLICYGEN_ENTITY_NAME`, `POLICYGEN_ENTITY_ADDRESS`, `POLICYGEN_PRIVACY_EMAIL`
  - `RAILWAY_PROJECT_NAME`, `GLOBAL_COMPANY_ADDRESS`, `GLOBAL_COMPANY_EMAIL`
  - `SITE_CONFIG` / `SITE_CONFIG_JSON` / `site-config.json` (site.name, site.address, site.email)

### Build Integration

- `npm run build:legal-pages` – Runs before Astro build (and in `dev`).
- Generated files: `src/pages/privacy.astro`, `src/pages/terms.astro`.

### CMS Override

`getPageContent()` for `privacy` and `terms` still checks `cmsPages` first. If you add privacy/terms CMS entries, they would normally win. But **static routes** (`src/pages/privacy.astro`, `src/pages/terms.astro`) take precedence over the catch-all `[...slug].astro`, so the generated pages are what users see. The CMS is not used for these routes.

## Cookies Page

`/cookies` is a **hardcoded** page that renders `CookiePreferences.astro` – no PolicyGen, no CMS. Users manage essential/analytics/functional/marketing cookies there.

## Adding Custom Questions / CMS Integration

PolicyGen does **not** read from the CMS. To customize:

1. **Edit `policygen.json`** – Adjust privacy/terms sections (platforms, payment processors, cookie consent provider, etc.).
2. **Env vars** – Set `POLICYGEN_ENTITY_NAME`, `GLOBAL_COMPANY_ADDRESS`, etc. for deploy-specific data.
3. **SITE_CONFIG** – Site-wide config (including `site.name`, `site.address`) is used by `prepare-policygen.mjs`.

For CMS-driven legal content (e.g. custom paragraphs), you would need to either:

- Manually edit the generated `.astro` files after generation (not ideal, they get overwritten), or
- Fork PolicyGen / use a different generator that accepts CMS input, or
- Keep using CMS for privacy/terms by **removing** the static `privacy.astro` and `terms.astro` and letting `[...slug]` serve CMS content for `/privacy` and `/terms`.

Currently, the build generates static legal pages for consistency and compliance defaults.
