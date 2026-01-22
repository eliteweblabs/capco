# Fix: CMS Page Ordering Error

## Problem
Error when trying to reorder pages in the CMS admin:
```
Error updating page order: Error: Some pages failed to update
```

## Root Cause
The `displayOrder` column doesn't exist in the `cmsPages` table. This column is required for the drag-and-drop page ordering feature.

## Solution

### Step 1: Run the Migration
Execute the following SQL migration in your Supabase database:

```bash
# Using Supabase CLI
supabase db execute sql-queriers/add-cms-pages-display-order.sql
```

Or run it manually through the Supabase dashboard SQL editor.

### Step 2: Verify the Column Exists
Check that the column was added:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'cmsPages' AND column_name = 'displayOrder';
```

You should see:
- column_name: `displayOrder`
- data_type: `integer`
- column_default: `0`

### Step 3: Verify Initial Values
Check that existing pages have displayOrder values:

```sql
SELECT id, slug, "displayOrder" 
FROM "cmsPages" 
ORDER BY "displayOrder";
```

All pages should have numeric values (not NULL).

## What Changed

### 1. Improved Error Messages (`src/pages/api/cms/pages.ts`)
- Now detects when the `displayOrder` column is missing
- Returns helpful error message with migration instructions
- Provides better error details for debugging

### 2. Better Frontend Error Handling (`src/pages/admin/cms.astro`)
- Shows detailed error messages including hints
- Doesn't reload page if migration is needed (so user can see the error)
- Extends error display time to 5 seconds for better visibility

### 3. Converted All Column Names to camelCase
- All `cmsPages` table columns now use camelCase naming convention
- Updated throughout the codebase: API routes, frontend, utilities
- More consistent with JavaScript/TypeScript conventions

## Column Name Changes

The following columns have been renamed from snake_case to camelCase:

- `client_id` → `clientId`
- `is_active` → `isActive`
- `created_at` → `createdAt`
- `updated_at` → `updatedAt`
- `include_in_navigation` → `includeInNavigation`
- `nav_roles` → `navRoles`
- `nav_page_type` → `navPageType`
- `nav_button_style` → `navButtonStyle`
- `nav_desktop_only` → `navDesktopOnly`
- `nav_hide_when_auth` → `navHideWhenAuth`
- `display_order` → `displayOrder`

## Testing

After running the migration:

1. Go to the CMS admin page (`/admin/cms`)
2. Try dragging and dropping pages to reorder them
3. The order should save successfully
4. Refresh the page - the new order should persist

## Migration File Contents

The migration does three things:

1. **Adds the column**: `ALTER TABLE "cmsPages" ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER DEFAULT 0;`
2. **Creates an index**: For efficient ordering queries
3. **Sets initial values**: Based on `createdAt` timestamp for existing pages

This ensures a smooth transition without breaking existing data.
