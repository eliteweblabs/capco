# Fix: Project Templates Table Missing

## Issue

The `/project/settings` page was showing error: `{"error":"Failed to fetch templates"}`

## Root Cause

The database table `projectItemTemplates` did not exist in the Supabase database. The API endpoint `/api/project-templates/get` was trying to query a non-existent table.

Terminal error showed:

```
[project-templates] Error fetching templates: {
  code: 'PGRST205',
  details: null,
  hint: "Perhaps you meant the table 'public.documentTemplates'",
  message: "Could not find the table 'public.projectItemTemplates' in the schema cache"
}
```

## Solution

Created the `projectItemTemplates` table in Supabase using the MCP Supabase tool with the following SQL:

1. Created table with schema:
   - `id` (SERIAL PRIMARY KEY)
   - `type` (VARCHAR - 'punchlist' or 'discussion')
   - `title` (VARCHAR)
   - `message` (TEXT)
   - `internal` (BOOLEAN)
   - `markCompleted` (BOOLEAN)
   - `orderIndex` (INTEGER)
   - `enabled` (BOOLEAN)
   - `companyName` (VARCHAR)
   - `createdBy` (UUID)
   - `createdAt` (TIMESTAMP)
   - `updatedAt` (TIMESTAMP)
   - UNIQUE constraint on (type, title, companyName)

2. Created indexes for performance:
   - `idx_project_item_templates_type`
   - `idx_project_item_templates_enabled`
   - `idx_project_item_templates_order`

3. Enabled Row Level Security (RLS) with policies:
   - Admins can manage all templates
   - Everyone can read enabled templates

4. Created trigger for auto-updating `updatedAt` timestamp

5. Inserted default templates:
   - 11 punchlist templates (CAD files, hydrant tests, design steps, etc.)
   - 4 discussion templates (welcome message, internal notes, etc.)

6. Granted permissions to authenticated and service_role users

## Files Involved

- `/src/pages/project/settings.astro` - Admin UI for managing templates
- `/src/pages/api/project-templates/get.ts` - API to fetch templates
- `/src/pages/api/project-templates/upsert.ts` - API to create/update templates
- `/src/pages/api/project-templates/delete.ts` - API to delete templates
- `/sql-queriers/create-project-item-templates-table.sql` - Source SQL script

## Verification

Queried the database after creation and confirmed 15 templates were successfully inserted (11 punchlist + 4 discussion items).

## Next Steps

- Test the `/project/settings` page to ensure it loads templates correctly
- Verify that template CRUD operations work (create, edit, delete)
- Consider adding this migration to the Supabase migrations folder for future deployments
