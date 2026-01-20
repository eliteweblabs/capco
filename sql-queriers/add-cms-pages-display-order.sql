-- Add display_order column to cmsPages table for drag-and-drop ordering
-- This controls the order pages appear in navigation

ALTER TABLE cmsPages 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_cmsPages_display_order ON cmsPages(display_order);

-- Set initial display_order based on created_at for existing pages
UPDATE cmsPages 
SET display_order = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
  FROM cmsPages
) AS subquery
WHERE cmsPages.id = subquery.id;

-- Comment
COMMENT ON COLUMN cmsPages.display_order IS 'Display order for navigation (lower numbers appear first). Controlled via drag-and-drop in admin CMS page.';
