# Railway: CMS / database settings for live

The live site (e.g. https://capco-firstbranch.up.railway.app) uses **Supabase** for CMS and global settings. The server needs the **service role key** so it can read/write from the database.

## Required variable (often missing)

| Variable            | Description | Where to get it |
|---------------------|-------------|------------------|
| **SUPABASE_SECRET** | Supabase **service_role** key (server-only) | Supabase Dashboard → Project Settings → API → `service_role` (secret) |

- **Do not** use the anon key here. The server uses `SUPABASE_SECRET` to create the admin client in `src/lib/supabase-admin.ts`.
- Without `SUPABASE_SECRET`, `supabaseAdmin` is `null`, so:
  - CMS APIs return "Database not configured"
  - Global company data (name, logo, colors, etc.) falls back to env only
  - CMS pages and global settings from the DB are not available

## What you already have (from your Variables screenshot)

- `PUBLIC_SUPABASE_URL` ✅
- `PUBLIC_SUPABASE_ANON_KEY` ✅
- `PUBLIC_SUPABASE_PUBLISHABLE` ✅

## Add the variable in Railway

1. Open [Railway](https://railway.app) → your project (e.g. **Rothco Built**) → **Variables**.
2. Click **+ New Variable**.
3. Name: `SUPABASE_SECRET`
4. Value: paste the **service_role** key from Supabase (Project Settings → API).
5. Save / redeploy so the new variable is picked up.

After adding `SUPABASE_SECRET` and redeploying, the live app will get CMS and database-driven settings correctly.
