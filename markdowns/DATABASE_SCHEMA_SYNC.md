# Database Schema Sync Guide

This guide explains how to sync database schemas between different Supabase projects (dev, staging, production).

## Problem

When working with multiple Supabase projects, you may encounter errors like:
- `Failed to fetch notifications`
- `relation "notifications" does not exist`
- `column "userId" does not exist`

This happens when the database schema isn't synchronized across projects.

## Solution

We've created a sync script that automatically checks and creates missing tables/columns.

## Quick Start

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the sync script**
   - Copy the contents of `sql-queriers/sync-notifications-schema.sql`
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify success**
   - You should see success messages in the output
   - The notifications table should now exist

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Run the sync script
supabase db execute --file sql-queriers/sync-notifications-schema.sql
```

### Option 3: Using the Sync Script

We've created a helper script:

```bash
# Make it executable
chmod +x scripts/sync-database-schema.sh

# Run it
./scripts/sync-database-schema.sh
```

## What the Sync Script Does

The `sync-notifications-schema.sql` script:

1. ✅ **Checks if table exists** - Creates it if missing
2. ✅ **Adds missing columns** - Adds any columns that don't exist
3. ✅ **Creates indexes** - Ensures performance indexes exist
4. ✅ **Sets up RLS policies** - Configures Row Level Security
5. ✅ **Creates helper functions** - Adds utility functions
6. ✅ **Grants permissions** - Sets up proper access control

## Schema Files

All schema files are located in `sql-queriers/`:

- `sync-notifications-schema.sql` - **Use this one** (safe, checks before creating)
- `create-notifications-table.sql` - Original creation script
- `dev-database-migration.sql` - Full database migration

## Column Naming Convention

**Important:** Supabase automatically converts snake_case database columns to camelCase in JavaScript:

- Database: `user_id` → JavaScript: `userId`
- Database: `created_at` → JavaScript: `createdAt`
- Database: `action_url` → JavaScript: `actionUrl`

The API code uses camelCase (e.g., `userId`, `createdAt`), which Supabase automatically maps to the snake_case database columns.

## Troubleshooting

### Error: "relation notifications does not exist"

**Solution:** Run `sql-queriers/sync-notifications-schema.sql` in your Supabase SQL Editor.

### Error: "column userId does not exist"

**Solution:** This is usually a column name mismatch. The sync script will fix this by ensuring all columns exist with the correct names.

### Error: "permission denied"

**Solution:** Make sure RLS policies are set up correctly. The sync script includes RLS policy creation.

### Error: "Failed to fetch notifications"

**Possible causes:**
1. Table doesn't exist → Run sync script
2. Missing columns → Run sync script
3. RLS policies blocking access → Run sync script
4. Network/connection issue → Check Supabase project status

## Syncing Between Projects

To sync schemas between multiple projects:

1. **Run sync script on source project** (to ensure it's up to date)
2. **Export schema** (optional):
   ```bash
   supabase db dump --schema public > schema-backup.sql
   ```
3. **Run sync script on target project** (recommended)
   - Or import the schema backup if you prefer

## Best Practices

1. **Always use the sync script** (`sync-notifications-schema.sql`) instead of the create script
   - It's idempotent (safe to run multiple times)
   - It checks before creating/modifying

2. **Test in dev first** before syncing to production

3. **Keep schema files in version control** (already done in `sql-queriers/`)

4. **Document schema changes** in migration files

## Related Files

- `sql-queriers/sync-notifications-schema.sql` - Main sync script
- `sql-queriers/create-notifications-table.sql` - Original creation script
- `scripts/sync-database-schema.sh` - Helper shell script
- `src/pages/api/notifications/get.ts` - API endpoint (uses camelCase)
- `markdowns/NOTIFICATIONS_SYSTEM.md` - Full documentation

## Need Help?

If you're still having issues:

1. Check the Supabase dashboard logs
2. Verify your project is active and accessible
3. Check that RLS policies are correctly configured
4. Ensure you're authenticated when testing the API
