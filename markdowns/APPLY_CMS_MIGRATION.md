# Apply CMS Pages Migration

## Quick Setup

The `cmsPages` table needs to be created in your Supabase database. Here are two ways to do it:

## Option 1: Via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project (the one matching your `PUBLIC_SUPABASE_URL`)

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run the Migration**
   - Copy the entire contents of `sql-queriers/create-cms-pages-table.sql`
   - Paste it into the SQL Editor
   - Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)

4. **Verify Table Created**
   - Go to **Table Editor** in the left sidebar
   - You should see `cmsPages` table listed
   - Click on it to verify the columns are correct

## Option 2: Via Supabase CLI (If Installed)

If you have the Supabase CLI installed:

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref qudlxlryegnainztkrtk

# Run the migration
supabase db push --file sql-queriers/create-cms-pages-table.sql
```

## What This Migration Creates

- ✅ `cmsPages` table with all necessary columns
- ✅ Unique constraint on `(slug, client_id)` for multi-client support
- ✅ Indexes for fast lookups
- ✅ Row Level Security (RLS) enabled
- ✅ Read policy for active pages
- ✅ Auto-update trigger for `updated_at` timestamp

## After Running the Migration

1. **Test the CMS**
   - Go to `/admin/cms` in your app
   - Try creating a new page
   - It should work now! ✅

2. **Verify in Database**
   - Check Supabase Table Editor
   - You should see your new page in the `cmsPages` table

## Troubleshooting

If you get an error about permissions:
- Make sure you're using the **service role key** (`SUPABASE_SECRET` or `SUPABASE_ADMIN_KEY`) in your API routes
- The service role key bypasses RLS, which is needed for admin operations

If the table already exists:
- The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run again
- If you need to recreate it, drop it first: `DROP TABLE IF EXISTS cmsPages CASCADE;`
