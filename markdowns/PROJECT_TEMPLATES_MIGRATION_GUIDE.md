# Project Templates Migration Guide

This guide explains how to migrate from SQL triggers to CMS-managed project templates for punchlist and discussion items.

## Overview

Previously, punchlist and discussion items were automatically created via SQL triggers when new projects were created. This system has been replaced with a CMS-based approach that allows you to manage these templates through a user interface at `/project/settings`.

## Benefits

- ✅ **Easy Management**: Edit templates through the UI instead of SQL
- ✅ **No Deployments**: Changes take effect immediately without database migrations
- ✅ **Flexible**: Enable/disable templates, reorder items, customize per client
- ✅ **Version Control**: Track who created/modified templates
- ✅ **Placeholders**: Full support for dynamic content like {{PROJECT_TITLE}}, {{CLIENT_NAME}}, etc.

## Migration Steps

### 1. Run SQL Scripts (In Order)

Execute these SQL scripts in your Supabase SQL editor:

#### Step 1: Create the Templates Table
```bash
sql-queriers/create-project-item-templates-table.sql
```

This creates the `project_item_templates` table and migrates your existing default templates.

#### Step 2: Disable the Old Triggers
```bash
sql-queriers/disable-auto-create-triggers.sql
```

This removes the SQL triggers that auto-created items. The functions remain for backward compatibility but are marked as deprecated.

### 2. Verify Migration

After running the scripts, verify:

```sql
-- Check that templates were created
SELECT type, title, enabled, order_index 
FROM project_item_templates 
ORDER BY type, order_index;

-- Check that triggers are disabled
SELECT 
  schemaname,
  tablename, 
  tgname as trigger_name,
  tgenabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'projects'
  AND t.tgname IN ('trigger_auto_create_punchlist', 'trigger_assign_default_discussion');
```

The second query should return no rows.

### 3. Access the Project Settings Page

Navigate to `/project/settings` (Admin only) to manage templates.

## Using the Project Settings Page

### Features

- **Two Tabs**: Separate management for Punchlist and Discussion templates
- **CRUD Operations**: Create, Read, Update, Delete templates
- **Drag and Drop**: Reorder templates (via order field)
- **Preview**: See how templates will appear with placeholders
- **Enable/Disable**: Turn templates on/off without deleting

### Template Properties

Each template has:

| Property | Description | Applies To |
|----------|-------------|------------|
| **Title** | Short descriptive name | Both |
| **Message** | The actual content (supports HTML & placeholders) | Both |
| **Type** | Either 'punchlist' or 'discussion' | Both |
| **Order** | Determines the sequence when applied | Both |
| **Internal** | Only visible to admin/staff | Discussion |
| **Mark Completed** | Item starts as completed | Both |
| **Enabled** | Whether to include when creating projects | Both |

### Available Placeholders

Templates support these placeholders:

#### Project Placeholders
- `{{PROJECT_ID}}` - Project ID
- `{{PROJECT_TITLE}}` - Project title
- `{{PROJECT_ADDRESS}}` - Project address
- `{{PROJECT_DESCRIPTION}}` - Project description
- `{{PROJECT_SQ_FT}}` - Square footage
- `{{PROJECT_NEW_CONSTRUCTION}}` - "Yes" or "No"

#### Client Placeholders
- `{{CLIENT_NAME}}` - Client's full name or company name
- `{{CLIENT_EMAIL}}` - Client's email
- `{{CLIENT_FIRST_NAME}}` - Client's first name
- `{{CLIENT_LAST_NAME}}` - Client's last name
- `{{COMPANY_NAME}}` - Client's company name

#### Link Placeholders
- `{{RAILWAY_PUBLIC_DOMAIN}}` - Your app's base URL
- `{{PROJECT_LINK?status=documents}}` - Auto-generated button link to specific tab

#### Staff Placeholders
- `{{ASSIGNED_STAFF_NAME}}` - Assigned staff member's name
- `{{ASSIGNED_STAFF_EMAIL}}` - Assigned staff's email

#### Global Placeholders
- `{{GLOBAL_COMPANY_NAME}}` - Your company name
- `{{GLOBAL_COMPANY_EMAIL}}` - Your company email
- `{{GLOBAL_COMPANY_PHONE}}` - Your company phone

## How It Works

### When a New Project is Created

1. User creates a project via `/project/new` or the API (`POST /api/projects/upsert`)
2. Project is inserted into the database
3. `applyProjectTemplates()` function is called
4. **Safeguard Check**: Function checks if project already has punchlist/discussion items
   - If items exist → Skip template application (prevents duplicates)
   - If no items → Continue
5. Function fetches all **enabled** templates from `project_item_templates`
6. For each template:
   - Placeholders are replaced with actual project data
   - Item is inserted into `punchlist` or `discussion` table
7. Project creation completes

### When Updating an Existing Project

Templates are **NOT** applied when updating projects via `PUT /api/projects/upsert`. The template application logic is only in the `POST` endpoint for creating new projects.

### Code Flow

```
/api/projects/upsert (POST)
  └─> Insert project
  └─> applyProjectTemplates(projectId, project)
      └─> Fetch enabled templates
      └─> For each template:
          └─> replacePlaceholders(message, projectData)
          └─> Insert into punchlist/discussion
  └─> Return project
```

## Default Templates

### Punchlist (11 items)

1. Receive CAD files from client
2. Obtain fire hydrant flow test data
3. Conduct design kickoff and review scope
4. Coordinate with fire alarm designer
5. Complete fire sprinkler layout design
6. Perform hydraulic calculations
7. Optimize pipe sizing for efficiency
8. Add notes and leader callouts
9. Add details and general notes
10. Finalize design and apply titleblock
11. Print drawings to PDF for submittal

### Discussion (4 items)

1. **Welcome Message** (Client-visible)
2. **Internal: New Project Created** (Staff-only)
3. **Internal: Project Kickoff Checklist** (Staff-only)
4. **Client: Next Steps** (Client-visible)

## API Endpoints

### GET /api/project-templates/get

Fetch templates.

**Query Parameters:**
- `type` (optional): Filter by 'punchlist' or 'discussion'
- `includeDisabled` (optional): Include disabled templates (default: false)

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": 1,
      "type": "punchlist",
      "title": "Receive CAD files",
      "message": "Receive CAD files from client...",
      "internal": false,
      "markCompleted": false,
      "orderIndex": 1,
      "enabled": true,
      "companyName": "CAPCo Fire",
      "createdAt": "2024-01-20T10:00:00Z"
    }
  ]
}
```

### POST /api/project-templates/upsert

Create or update a template. Requires Admin role.

**Body:**
```json
{
  "id": null,  // or template ID to update
  "type": "punchlist",
  "title": "New Template",
  "message": "Template message with {{PLACEHOLDERS}}",
  "internal": false,
  "markCompleted": false,
  "orderIndex": 1,
  "enabled": true,
  "companyName": "CAPCo Fire"
}
```

### POST /api/project-templates/delete

Delete a template. Requires Admin role.

**Body:**
```json
{
  "id": 1
}
```

## Customization Examples

### Example 1: Client-Specific Welcome Message

```javascript
{
  "type": "discussion",
  "title": "Welcome Message - Premium Client",
  "message": "Welcome {{CLIENT_FIRST_NAME}}! As a premium client, you'll have dedicated support for {{PROJECT_TITLE}}. Your project manager will contact you within 24 hours.",
  "internal": false,
  "markCompleted": false,
  "orderIndex": 1,
  "enabled": true
}
```

### Example 2: Internal Checklist

```javascript
{
  "type": "punchlist",
  "title": "Pre-Submittal Review",
  "message": "Complete internal review checklist:\n✓ Hydraulic calculations verified\n✓ Code compliance checked\n✓ Client specifications met\n✓ QA/QC sign-off obtained",
  "internal": true,
  "markCompleted": false,
  "orderIndex": 5,
  "enabled": true
}
```

## Troubleshooting

### Templates Not Being Applied

1. **Check templates are enabled**: Go to `/project/settings` and verify enabled status
2. **Check database**: Query `project_item_templates` table
3. **Check logs**: Look for `[apply-project-templates]` in server logs
4. **Verify RLS**: Ensure RLS policies allow template access

### Placeholders Not Replaced

1. **Check project data**: Ensure project has required fields (title, address, etc.)
2. **Check placeholder syntax**: Must be exactly `{{PLACEHOLDER_NAME}}`
3. **Check console**: Look for placeholder processing logs

### Permission Issues

The `/project/settings` page requires Admin role. If you see a redirect to dashboard:

```sql
-- Check user role
SELECT id, email, role FROM profiles WHERE email = 'your@email.com';

-- Update to Admin if needed
UPDATE profiles SET role = 'Admin' WHERE email = 'your@email.com';
```

## Rollback Plan

If you need to re-enable the old SQL triggers:

```sql
-- Re-enable punchlist trigger
CREATE TRIGGER trigger_auto_create_punchlist
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_punchlist_items();

-- Re-enable discussion trigger
CREATE TRIGGER trigger_assign_default_discussion
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_discussion_to_project();
```

## Next Steps

1. ✅ Run the SQL migrations
2. ✅ Test creating a new project
3. ✅ Customize templates via `/project/settings`
4. ✅ Train your team on the new system
5. ✅ Remove old SQL trigger files from version control (optional)

## Support

If you encounter issues:

1. Check server logs for errors
2. Verify SQL migrations completed successfully
3. Test with a simple template first
4. Check RLS policies on `project_item_templates` table
