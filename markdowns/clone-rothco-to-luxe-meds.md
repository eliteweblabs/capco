# Clone Rothco → Luxe Meds (luxemeds.com)

Step-by-step guide to duplicate the Rothco deployment as Luxe Meds.

## Prerequisites

- Supabase account
- Railway account
- GitHub repo access (same repo as Rothco)
- Rothco Supabase project ref: `fhqglhcjlkusrykqnoel`

## 1. Supabase: Create New Project & Clone DB

### 1a. Create new Supabase project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. **New Project** → Name: `luxe-meds` (or similar)
3. Set password, region; create project
4. Note: **Project URL**, **anon key**, **service_role key** (Settings → API)

### 1b. Export Rothco database

From your machine (with `pg_dump` or Supabase connection string):

```bash
# Get Rothco DB URL from Supabase Dashboard → Settings → Database
pg_dump "postgresql://postgres:[PASSWORD]@db.fhqglhcjlkusrykqnoel.supabase.co:5432/postgres" \
  --no-owner --no-acl \
  -f rothco-backup.sql
```

Or use **Supabase Dashboard → Database → Backups** if PITR/backups are enabled.

### 1c. Restore into Luxe Meds project

```bash
# Get Luxe Meds DB URL from new project
psql "postgresql://postgres:[PASSWORD]@db.[LUXE_MEDS_PROJECT_REF].supabase.co:5432/postgres" \
  -f rothco-backup.sql
```

### 1d. Update company name in DB

Run in Supabase SQL Editor for the **Luxe Meds** project:

```sql
-- Set company name for Luxe Meds
INSERT INTO "globalSettings" (key, value) VALUES ('companyName', 'Luxe Meds')
ON CONFLICT (key) DO UPDATE SET value = 'Luxe Meds';

-- Optionally update other branding (website, email, etc.)
-- UPDATE "globalSettings" SET value = 'https://luxemeds.com' WHERE key = 'website';
-- UPDATE "globalSettings" SET value = 'noreply@luxemeds.com' WHERE key = 'email';
```

### 1e. Supabase Auth (optional)

- **Authentication → URL Configuration**: set Site URL to `https://luxemeds.com` (or Railway URL initially)
- **Redirect URLs**: add `https://luxemeds.com/auth/callback` (and Railway URL if testing)

---

## 2. Railway: Create New Project

### 2a. Create project

1. [Railway Dashboard](https://railway.app/dashboard) → **New Project**
2. **Deploy from GitHub repo** → select same repo as Rothco (`rothcobuilt` or your repo name)
3. Use same branch (e.g. `main` or `firstbranch`)
4. Name the project: **`luxe-meds`** (this drives `config-luxe-meds.json` loading)

### 2b. Set environment variables

Copy from Rothco and replace with Luxe Meds values:

| Variable | Luxe Meds Value |
|----------|-----------------|
| `RAILWAY_PROJECT_NAME` | `luxe-meds` |
| `RAILWAY_PUBLIC_DOMAIN` | `luxe-meds.up.railway.app` (or custom domain) |
| `PUBLIC_SUPABASE_URL` | `https://[LUXE_MEDS_REF].supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | from Luxe Meds Supabase |
| `SUPABASE_SECRET` | service_role key from Luxe Meds |
| `SUPABASE_ACCESS_TOKEN` | (optional, for migrations) |
| `FROM_EMAIL` | `noreply@luxemeds.com` |
| `FROM_NAME` | `Luxe Meds` |

**Keep separate for Luxe Meds** (don’t reuse Rothco):

- Stripe keys (create new Stripe account or use separate keys)
- VAPI keys (if using voice; create new assistant)
- Resend/DKIM (use `luxemeds.com` domain)
- Any other service-specific keys

### 2c. Add custom domain

1. Railway project → **Settings** → **Domains**
2. Add `luxemeds.com` and `www.luxemeds.com`
3. Configure DNS (CNAME to Railway) per Railway instructions

---

## 3. Repo: Config File

The repo already includes:

- **`public/data/config-luxe-meds.json`** – cloned from Rothco

Config loading order:

1. `SITE_CONFIG` / `SITE_CONFIG_JSON` env (if set)
2. `config-${RAILWAY_PROJECT_NAME}.json` → `config-luxe-meds.json` when `RAILWAY_PROJECT_NAME=luxe-meds`

No code changes needed if `RAILWAY_PROJECT_NAME=luxe-meds` is set.

---

## 4. Post-Deploy Checklist

- [ ] Supabase: `globalSettings.companyName` = `Luxe Meds`
- [ ] Supabase Auth: Site URL and redirect URLs set
- [ ] Railway: All env vars set (Supabase, Stripe, Resend, etc.)
- [ ] Railway: Custom domain `luxemeds.com` added and DNS configured
- [ ] Run `./scripts/check-site-loading.sh https://luxemeds.com` (or Railway URL)
- [ ] Verify `/`, `/contact`, `/auth/login` return 200
- [ ] Check DevTools console for errors

---

## 5. Luxe Meds–Specific Notes

Per `multi-site-deployment.md`, Luxe Meds is intended for:

- E-commerce, Square payments, social media
- No projects (fire protection workflow)

After cloning from Rothco, you may want to:

- Hide or remove project-related nav (e.g. via `asideNav` in config)
- Enable shop/ecommerce routes
- Configure Square keys
- Adjust forms and CMS content for Luxe Meds branding

---

## Quick Reference

| Item | Rothco | Luxe Meds |
|------|--------|-----------|
| Config file | `config-rothco-built-llc.json` | `config-luxe-meds.json` |
| RAILWAY_PROJECT_NAME | `Rothco Built, LLC` | `luxe-meds` |
| Supabase ref | `fhqglhcjlkusrykqnoel` | (new project) |
| Domain | rothco-built.com | luxemeds.com |
