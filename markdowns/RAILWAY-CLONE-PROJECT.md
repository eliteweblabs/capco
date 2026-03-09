# How to Clone a Railway Project (Same Repo, New Site)

Railway has no "clone project" button. To spin up a new site from the same GitHub repo:

## Steps

### 1. Create a new project

1. Open [railway.app](https://railway.app) → **Dashboard**
2. Click **New Project**
3. Choose **Deploy from GitHub repo**
4. Pick the **same repo** as your existing site (e.g. `rothcobuilt`)
5. Pick the branch (usually `main`)
6. Railway creates a new project and starts a deploy

### 2. Copy variables from the existing project

1. Open the **existing** Railway project → **Variables**
2. Copy all variables you need
3. Open the **new** project → **Variables**
4. Paste and edit:
   - **RAILWAY_PROJECT_NAME** – new client name
   - **RAILWAY_PUBLIC_DOMAIN** – new domain (Railway assigns one; you can add a custom domain later)
   - **PUBLIC_SUPABASE_URL** – new Supabase project URL
   - **PUBLIC_SUPABASE_PUBLISHABLE** – new Supabase anon key
   - **SUPABASE_SECRET** – new Supabase service role key
   - Plus branding (GLOBAL_COLOR_*, logos, etc.)

### 3. Generate a domain

1. New project → **Settings** → **Networking**
2. Click **Generate domain** (or add a custom domain)

### 4. Deploy

The first deploy usually runs automatically. If not, trigger a deploy from the **Deployments** tab.

---

## What’s duplicated vs. what isn’t

| Duplicated automatically      | You must do manually                    |
|------------------------------|----------------------------------------|
| Code from GitHub             | Environment variables                  |
| Build/deploy setup            | New Supabase project + keys            |
|                              | Domain (Generate Domain or custom)     |
|                              | Branding (name, colors, logo)          |

---

## Database

The new project needs its **own** Supabase project. Use the Clone & Deploy flow:

1. Create a new Supabase project at supabase.com
2. Run `./scripts/clone-site-and-db.sh` to copy the DB (or use Clone & Deploy in the admin)
3. Add the new Supabase URL and keys to the new Railway project’s variables

---

## Summary

**“Cloning” = New Project + Same Repo + New env vars + New Supabase.**  
Railway doesn’t duplicate projects; you create a new one and point it at the same GitHub repo.
