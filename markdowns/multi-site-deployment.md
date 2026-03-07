# Multi-Site Deployment

This repository deploys **multiple sites** from a single codebase when synced to GitHub.

## Current Sites

| Site | Domain | Notes |
|------|--------|-------|
| CAPCO Design Group | RAILWAY_PUBLIC_DOMAIN | Fire protection |
| Rothco Built, LLC | rothco-built.com | Fire protection |
| Luxe Meds | luxemeds.com | E-commerce, Square, social media; no projects |

**More sites will be added.** Each has its own Railway project and Supabase instance.

### Config Files

| Site | Config File | RAILWAY_PROJECT_NAME |
|------|-------------|----------------------|
| CAPCO | `config-capco-design-group.json` | (varies) |
| Rothco | `config-rothco-built-llc.json` | `Rothco Built, LLC` |
| Luxe Meds | `config-luxe-meds.json` | `luxe-meds` |

See `markdowns/clone-rothco-to-luxe-meds.md` for cloning Rothco → Luxe Meds.

## How It Works

- **One repo** → multiple Railway projects (one per company)
- **Per-site config** via `SITE_CONFIG` env or `config-[company-slug].json`
- **Shared code** – all sites run the same build; differences come from config and env

## Adding a New Site

1. Create Railway project for the new company
2. Link to same GitHub repo (or same branch)
3. Set env vars: Supabase URL/keys, `RAILWAY_PROJECT_NAME`, `SITE_CONFIG` (or provide `config-[slug].json`)
4. Add custom domain if needed
5. Add to post-deploy verification list
