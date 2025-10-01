# Production Database Export Guide

## Overview

This guide helps you export critical configuration data from your production database and import it into your development database.

## ⚠️ IMPORTANT - What Gets Exported

### ✅ SAFE TO EXPORT (Configuration/Reference Data):

- `project_statuses` - All status definitions (10-220)
- `line_items_catalog` - Catalog of line items for invoices
- `subject_catalog` - Subject templates
- `global_options` - App configuration settings
- `pdf_templates` - PDF generation templates
- `pdf_components` - PDF component library

### ❌ DO NOT EXPORT (Sensitive/User Data):

- `auth.users` - User authentication data
- `profiles` - User personal information
- `projects` - Client project data
- `files` - Document files and metadata
- `invoices` - Financial records
- `payments` - Payment information
- `direct_messages` - User communications
- `notifications` - User notifications

## Step-by-Step Export Process

### Step 1: Export from Production

1. **Go to your PRODUCTION Supabase project**
   - URL: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the export script**
   - Open the file: `export-production-data.sql`
   - Copy each SELECT query one at a time
   - Paste into SQL Editor
   - Click "Run"
   - **IMPORTANT**: Copy the entire result (it will be a long INSERT statement)
   - Save it to a text file

4. **Repeat for each section**:
   - Project Statuses (MOST CRITICAL)
   - Line Items Catalog
   - Subject Catalog
   - Global Options
   - PDF Templates
   - PDF Components

### Step 2: Import to Development

1. **Go to your DEVELOPMENT Supabase project**
   - URL: https://supabase.com/dashboard/project/injgmunynstyterczuxg

2. **Open SQL Editor**

3. **Run the import**
   - Paste the INSERT statement you copied from production
   - Click "Run"
   - Verify success message

4. **Repeat for all exported data**

### Step 3: Verify the Import

Run this query in your DEV database to verify:

```sql
-- Check project_statuses count
SELECT COUNT(*) as status_count FROM project_statuses;

-- Verify status 10 exists
SELECT status_code, status, admin_status_name, client_status_name
FROM project_statuses
WHERE status_code = 10;

-- Check all available statuses
SELECT status_code, status, admin_status_name
FROM project_statuses
ORDER BY status_code;
```

Expected result: You should see status_code 10 and many others (10, 20, 30, etc.)

## Quick Test - Export Just Project Statuses

If you only need to fix the immediate issue, just export `project_statuses`:

```sql
-- Run this in PRODUCTION
SELECT
  'INSERT INTO project_statuses (status_code, status, admin_status_name, client_status_name, status_color, admin_visible, client_visible) VALUES ' ||
  string_agg(
    format('(%s, %L, %L, %L, %L, %L, %L)',
      status_code, status, admin_status_name, client_status_name,
      status_color, admin_visible, client_visible
    ),
    E',\n'
    ORDER BY status_code
  ) || ' ON CONFLICT (status_code) DO UPDATE SET status = EXCLUDED.status, admin_status_name = EXCLUDED.admin_status_name, client_status_name = EXCLUDED.client_status_name, status_color = EXCLUDED.status_color;'
FROM project_statuses;
```

Then run the result in DEV database.

## Alternative: Manual Status 10 Creation

If the export is too complex, you can manually add just status 10:

```sql
INSERT INTO project_statuses (
  status_code,
  status,
  admin_status_name,
  client_status_name,
  status_color,
  admin_visible,
  client_visible,
  modal_admin,
  modal_client
) VALUES (
  10,
  'Project Created',
  'Project Created',
  'Project Created',
  '#3b82f6',
  true,
  true,
  'Your project has been created successfully!',
  'Your project has been created successfully!'
) ON CONFLICT (status_code) DO UPDATE SET
  status = EXCLUDED.status,
  admin_status_name = EXCLUDED.admin_status_name,
  client_status_name = EXCLUDED.client_status_name;
```

## Troubleshooting

### Error: "column does not exist"

- Your dev database schema might be missing columns that production has
- Run the full `dev-database-migration.sql` first
- Then try the import again

### Error: "duplicate key value"

- Use `ON CONFLICT DO UPDATE` or `ON CONFLICT DO NOTHING` clauses
- This allows re-running the import safely

### Export result is empty

- Make sure you're connected to the PRODUCTION database
- Check that the table has data: `SELECT COUNT(*) FROM project_statuses;`

## Next Steps

After importing, test your ProjectForm again:

1. Create a new project
2. It should update to status 10
3. The notification should appear with proper modal data
4. Check console logs for "📊 [UPDATE-STATUS] Extracted statusData for status 10"
