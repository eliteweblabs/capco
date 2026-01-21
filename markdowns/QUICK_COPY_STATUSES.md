# Quick Guide: Copy Project Statuses from Production

## Problem
The `projectStatuses` table in your development database is empty, causing the status API to return empty results.

## Solution: Export from Production → Import to Development

### Step 1: Export from Production Database

1. **Go to Production Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/[your-production-project]
   - Click "SQL Editor" → "New query"

2. **Run this export query** (copies from `sql-queriers/export-production-data.sql`):

```sql
SELECT 
  'INSERT INTO project_statuses (status_code, status, admin_status_name, client_status_name, admin_status_slug, client_status_slug, status_color, admin_visible, client_visible, admin_status_tab, client_status_tab, admin_status_action, client_status_action, modal_admin, modal_client, modal_auto_redirect_admin, modal_auto_redirect_client, admin_email_subject, admin_email_content, client_email_subject, client_email_content, button_text, button_link, email_to_roles, est_time) VALUES ' ||
  string_agg(
    format(
      '(%s, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L)',
      status_code,
      status,
      admin_status_name,
      client_status_name,
      admin_status_slug,
      client_status_slug,
      status_color,
      admin_visible,
      client_visible,
      admin_status_tab,
      client_status_tab,
      admin_status_action,
      client_status_action,
      modal_admin,
      modal_client,
      modal_auto_redirect_admin,
      modal_auto_redirect_client,
      admin_email_subject,
      admin_email_content,
      client_email_subject,
      client_email_content,
      button_text,
      button_link,
      email_to_roles::text,
      est_time
    ),
    E',\n'
    ORDER BY status_code
  ) || ' ON CONFLICT (status_code) DO UPDATE SET ' ||
  'status = EXCLUDED.status, ' ||
  'admin_status_name = EXCLUDED.admin_status_name, ' ||
  'client_status_name = EXCLUDED.client_status_name, ' ||
  'admin_status_slug = EXCLUDED.admin_status_slug, ' ||
  'client_status_slug = EXCLUDED.client_status_slug, ' ||
  'status_color = EXCLUDED.status_color, ' ||
  'admin_visible = EXCLUDED.admin_visible, ' ||
  'client_visible = EXCLUDED.client_visible, ' ||
  'admin_status_tab = EXCLUDED.admin_status_tab, ' ||
  'client_status_tab = EXCLUDED.client_status_tab, ' ||
  'admin_status_action = EXCLUDED.admin_status_action, ' ||
  'client_status_action = EXCLUDED.client_status_action, ' ||
  'modal_admin = EXCLUDED.modal_admin, ' ||
  'modal_client = EXCLUDED.modal_client, ' ||
  'modal_auto_redirect_admin = EXCLUDED.modal_auto_redirect_admin, ' ||
  'modal_auto_redirect_client = EXCLUDED.modal_auto_redirect_client, ' ||
  'admin_email_subject = EXCLUDED.admin_email_subject, ' ||
  'admin_email_content = EXCLUDED.admin_email_content, ' ||
  'client_email_subject = EXCLUDED.client_email_subject, ' ||
  'client_email_content = EXCLUDED.client_email_content, ' ||
  'button_text = EXCLUDED.button_text, ' ||
  'button_link = EXCLUDED.button_link, ' ||
  'email_to_roles = EXCLUDED.email_to_roles::jsonb, ' ||
  'est_time = EXCLUDED.est_time;' AS export_sql
FROM project_statuses
WHERE status_code IS NOT NULL;
```

3. **Copy the result** - It will be a long INSERT statement starting with `INSERT INTO project_statuses...`

### Step 2: Import to Development Database

1. **Go to Development Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/[your-dev-project]
   - Click "SQL Editor" → "New query"

2. **Paste the INSERT statement** you copied from production

3. **Click "Run"**

4. **Verify success** - You should see a message like "Success. No rows returned" or similar

### Step 3: Verify the Import

Run this in your development database:

```sql
-- Check count
SELECT COUNT(*) as status_count FROM project_statuses;

-- List all statuses
SELECT status_code, status, admin_status_name, client_status_name
FROM project_statuses
ORDER BY status_code;
```

You should see 20+ statuses (status_code 10, 20, 30, etc.)

### Step 4: Test the API

After importing, refresh your project page. The status API should now return all statuses instead of an empty object.

## Alternative: Use MCP Supabase Tools

If you have MCP Supabase configured, you can also use:

1. Query production database to get statuses
2. Use `apply_migration` to insert them into development

## Troubleshooting

**If you get column name errors:**
- Make sure the table uses snake_case column names (`status_code`, not `statusCode`)
- Check if your database uses camelCase - adjust the INSERT statement accordingly

**If INSERT fails:**
- Check that the table exists: `SELECT * FROM project_statuses LIMIT 1;`
- Verify column names match: `\d project_statuses` (in psql) or check table structure in Supabase dashboard
