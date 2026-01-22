# CMS Pages Column Name Migration

## Summary

All `cmsPages` table columns have been converted from snake_case to camelCase throughout the codebase for consistency with JavaScript/TypeScript naming conventions.

## What Was Changed

### 1. Database Schema (SQL Migration Required)
Created migration file: `sql-queriers/convert-cms-pages-to-camelcase.sql`

Column name changes:
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
- `display_order` → `displayOrder` (if exists)

### 2. Code Files Updated

#### API Routes
- ✅ `src/pages/api/cms/pages.ts` - Main CMS pages API
- ✅ `src/pages/api/cms/import-markdown.ts` - Single markdown import
- ✅ `src/pages/api/cms/import-all-markdown.ts` - Bulk markdown import
- ✅ `src/pages/api/utils/navigation.ts` - Navigation generation

#### Frontend Components
- ✅ `src/pages/admin/cms.astro` - CMS admin interface

#### Libraries
- ✅ `src/lib/content.ts` - Content loading utility

#### Documentation
- ✅ `FIX_CMS_PAGE_ORDERING.md` - Updated with camelCase references

## Required Steps

### Step 1: Run Database Migration

You **MUST** run the database migration before deploying the code changes:

```bash
# Using Supabase CLI (recommended)
supabase db execute sql-queriers/convert-cms-pages-to-camelcase.sql

# OR manually in Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of sql-queriers/convert-cms-pages-to-camelcase.sql
# 3. Execute the SQL
```

### Step 2: Verify Migration

Check that all columns were renamed successfully:

```sql
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cmsPages'
ORDER BY ordinal_position;
```

Expected columns (camelCase):
- id
- slug
- title
- description
- content
- frontmatter
- template
- clientId
- isActive
- createdAt
- updatedAt
- includeInNavigation
- navRoles
- navPageType
- navButtonStyle
- navDesktopOnly
- navHideWhenAuth
- displayOrder

### Step 3: Test the Application

After migration, test these features:

1. **CMS Admin** (`/admin/cms`)
   - Create new page ✅
   - Edit existing page ✅
   - Delete page ✅
   - Drag and drop to reorder pages ✅
   - Import markdown file ✅

2. **Navigation**
   - Check frontend navigation displays correctly ✅
   - Check backend navigation displays correctly ✅
   - Verify role-based visibility ✅

3. **Content Loading**
   - Visit CMS pages and verify content loads ✅
   - Check page templates work ✅

## Rollback

If you need to rollback (revert to snake_case), run this SQL:

```sql
-- Rollback: Convert cmsPages columns back to snake_case
ALTER TABLE "cmsPages" RENAME COLUMN "clientId" TO "client_id";
ALTER TABLE "cmsPages" RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE "cmsPages" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "cmsPages" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "cmsPages" RENAME COLUMN "includeInNavigation" TO "include_in_navigation";
ALTER TABLE "cmsPages" RENAME COLUMN "navRoles" TO "nav_roles";
ALTER TABLE "cmsPages" RENAME COLUMN "navPageType" TO "nav_page_type";
ALTER TABLE "cmsPages" RENAME COLUMN "navButtonStyle" TO "nav_button_style";
ALTER TABLE "cmsPages" RENAME COLUMN "navDesktopOnly" TO "nav_desktop_only";
ALTER TABLE "cmsPages" RENAME COLUMN "navHideWhenAuth" TO "nav_hide_when_auth";
ALTER TABLE "cmsPages" RENAME COLUMN "displayOrder" TO "display_order";

-- Rollback indexes
DROP INDEX IF EXISTS "idx_cmsPages_displayOrder";
CREATE INDEX IF NOT EXISTS "idx_cmsPages_display_order" ON "cmsPages"("display_order");

DROP INDEX IF EXISTS "idx_cmsPages_clientId";
CREATE INDEX IF NOT EXISTS "idx_cmsPages_client_id" ON "cmsPages"("client_id");

DROP INDEX IF EXISTS "idx_cmsPages_isActive";
CREATE INDEX IF NOT EXISTS "idx_cmsPages_is_active" ON "cmsPages"("is_active");

-- Rollback constraint
ALTER TABLE "cmsPages" DROP CONSTRAINT IF EXISTS "cmsPages_slug_clientId_key";
ALTER TABLE "cmsPages" ADD CONSTRAINT "cmsPages_slug_client_id_key" UNIQUE (slug, "client_id");
```

Then revert the code changes by checking out the previous git commit.

## Benefits

1. **Consistency** - Matches JavaScript/TypeScript naming conventions
2. **Readability** - More natural to read in JS/TS code
3. **No String Quotes** - Can access properties without bracket notation
4. **IDE Support** - Better autocomplete and IntelliSense
5. **Type Safety** - Easier to work with TypeScript types

## Notes

- All changes are backward compatible via the migration
- No data is lost during the migration
- The migration includes safety checks (IF EXISTS, IF NOT EXISTS)
- Unique constraints and indexes are updated to match new names
- Comments are updated for clarity
