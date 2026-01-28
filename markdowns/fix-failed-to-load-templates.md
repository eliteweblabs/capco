# Fix: Failed to Load Templates Error

## Problem

The error "Failed to Load Templates" occurs because the `projectItemTemplates` table is missing from your Supabase database.

## Solution: Create the Missing Table

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor**
   - Go to: https://qudlxlryegnainztkrtk.supabase.co/project/_/sql/new

2. **Run the SQL Script**
   - Open the file: `sql-queriers/create-project-item-templates-table.sql`
   - Copy ALL the contents
   - Paste into the Supabase SQL editor
   - Click "Run" or press `Cmd+Enter`

3. **Verify Success**
   - You should see a success message
   - The table will be created with default templates
   - Refresh your app and the error should be gone

### Option 2: Using psql Command Line

If you have direct database access:

```bash
# Set your database URL
export DATABASE_URL="your-supabase-connection-string"

# Run the SQL file
psql "$DATABASE_URL" < sql-queriers/create-project-item-templates-table.sql
```

### What This Creates

The script creates:

- ✅ `projectItemTemplates` table with proper schema
- ✅ Default punchlist templates (11 items)
- ✅ Default discussion templates (4 items)
- ✅ RLS policies for security
- ✅ Proper indexes for performance
- ✅ Triggers for auto-updating timestamps

### Default Templates Included

**Punchlist Templates:**

1. Receive CAD files
2. Obtain fire hydrant flow test data
3. Conduct design kickoff
4. Coordinate with fire alarm designer
5. Complete fire sprinkler layout
6. Perform hydraulic calculations
7. Optimize pipe sizing
8. Add notes and callouts
9. Add details and notes
10. Finalize design
11. Print drawings to PDF

**Discussion Templates:**

1. Welcome Message (auto-completed)
2. Internal: New Project Created
3. Internal: Project Kickoff Checklist
4. Client: Next Steps

## After Running

Once the table is created:

1. Restart your dev server (`npm run dev`)
2. The "Failed to Load Templates" error should be gone
3. New projects will automatically get these templates
4. You can manage templates at: `/admin/project-templates`

## Troubleshooting

If you still see errors after running the SQL:

- Check the Supabase SQL editor for any error messages
- Verify your Supabase connection is working
- Make sure you have admin access to your Supabase project
- Check that the SQL script ran completely (all statements)
