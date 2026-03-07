# Site URLs for MCP / Post-Deploy Checks

**Canonical list of live URLs** for each deployment. Use these when running MCP Railway site checks or verifying deployments—do **not** assume or guess URLs.

## Live Site URLs

| Site | Live URL | Notes |
|------|----------|-------|
| CAPCO Design Group | <!-- TODO: add correct URL --> | Fire protection |
| Rothco Built, LLC | <!-- TODO: add correct URL --> | Fire protection |
| Luxe Meds | https://luxemeds.com | E-commerce |

## Incorrect / Do Not Use

- `rothcobuilt.com` – wrong
- `rothcollc.com` – wrong
- `capcodesign.com` – wrong (or may vary by env)

## Usage

- **MCP site checks:** When verifying capco, rothco, luxemeds after deploy, fetch the URLs from this table.
- **Scripts:** `scripts/check-site-loading.sh` can take a base URL; use these for production checks.
- **Railway:** Each project has its own `RAILWAY_PUBLIC_DOMAIN`; custom domains may differ—update this doc when known.

## Updating

When you add a custom domain or change a live URL, update this file so agents and scripts use the correct values.
