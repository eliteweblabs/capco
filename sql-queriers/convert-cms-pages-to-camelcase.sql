-- Migration: Convert cmsPages table columns from snake_case to camelCase
-- This migration renames all columns to use camelCase naming convention
-- for consistency with JavaScript/TypeScript code

-- Rename columns from snake_case to camelCase
ALTER TABLE "cmsPages" 
  RENAME COLUMN "client_id" TO "clientId";

ALTER TABLE "cmsPages" 
  RENAME COLUMN "is_active" TO "isActive";

ALTER TABLE "cmsPages" 
  RENAME COLUMN "created_at" TO "createdAt";

ALTER TABLE "cmsPages" 
  RENAME COLUMN "updated_at" TO "updatedAt";

ALTER TABLE "cmsPages" 
  RENAME COLUMN "include_in_navigation" TO "includeInNavigation";

ALTER TABLE "cmsPages" 
  RENAME COLUMN "nav_roles" TO "navRoles";

ALTER TABLE "cmsPages" 
  RENAME COLUMN "nav_page_type" TO "navPageType";

ALTER TABLE "cmsPages" 
  RENAME COLUMN "nav_button_style" TO "navButtonStyle";

ALTER TABLE "cmsPages" 
  RENAME COLUMN "nav_desktop_only" TO "navDesktopOnly";

ALTER TABLE "cmsPages" 
  RENAME COLUMN "nav_hide_when_auth" TO "navHideWhenAuth";

-- Note: displayOrder might already exist as camelCase or need to be renamed
-- Check if display_order exists and rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cmsPages' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE "cmsPages" RENAME COLUMN "display_order" TO "displayOrder";
  END IF;
END $$;

-- Update indexes to match new column names
DROP INDEX IF EXISTS "idx_cmsPages_display_order";
CREATE INDEX IF NOT EXISTS "idx_cmsPages_displayOrder" ON "cmsPages"("displayOrder");

DROP INDEX IF EXISTS "idx_cmsPages_client_id";
CREATE INDEX IF NOT EXISTS "idx_cmsPages_clientId" ON "cmsPages"("clientId");

DROP INDEX IF EXISTS "idx_cmsPages_is_active";
CREATE INDEX IF NOT EXISTS "idx_cmsPages_isActive" ON "cmsPages"("isActive");

-- Update unique constraint if it exists
ALTER TABLE "cmsPages" DROP CONSTRAINT IF EXISTS "cmsPages_slug_client_id_key";
ALTER TABLE "cmsPages" ADD CONSTRAINT "cmsPages_slug_clientId_key" UNIQUE (slug, "clientId");

-- Update comments
COMMENT ON COLUMN "cmsPages"."clientId" IS 'Client identifier for multi-tenant support (null = global)';
COMMENT ON COLUMN "cmsPages"."isActive" IS 'Whether the page is active and should be displayed';
COMMENT ON COLUMN "cmsPages"."createdAt" IS 'Timestamp when the page was created';
COMMENT ON COLUMN "cmsPages"."updatedAt" IS 'Timestamp when the page was last updated';
COMMENT ON COLUMN "cmsPages"."includeInNavigation" IS 'Whether to show this page in the navigation menu';
COMMENT ON COLUMN "cmsPages"."navRoles" IS 'User roles that can see this page in navigation';
COMMENT ON COLUMN "cmsPages"."navPageType" IS 'Page type: frontend or backend';
COMMENT ON COLUMN "cmsPages"."navButtonStyle" IS 'Button style for navigation link (optional)';
COMMENT ON COLUMN "cmsPages"."navDesktopOnly" IS 'Show only on desktop navigation';
COMMENT ON COLUMN "cmsPages"."navHideWhenAuth" IS 'Hide when user is authenticated';
COMMENT ON COLUMN "cmsPages"."displayOrder" IS 'Display order for navigation (lower numbers appear first)';

-- Verification query
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cmsPages'
ORDER BY ordinal_position;
