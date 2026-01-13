-- Add display_order column to cms_pages table for drag-and-drop ordering
-- This controls the order pages appear in navigation

ALTER TABLE cms_pages 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_cms_pages_display_order ON cms_pages(display_order);

-- Set initial display_order based on created_at for existing pages
UPDATE cms_pages 
SET display_order = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
  FROM cms_pages
) AS subquery
WHERE cms_pages.id = subquery.id;

-- Comment
COMMENT ON COLUMN cms_pages.display_order IS 'Display order for navigation (lower numbers appear first). Controlled via drag-and-drop in admin CMS page.';
