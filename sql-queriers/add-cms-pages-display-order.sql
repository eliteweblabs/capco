-- Add displayOrder column to cmsPages table for drag-and-drop ordering
-- This controls the order pages appear in navigation

ALTER TABLE cmsPages 
ADD COLUMN IF NOT EXISTS displayOrder INTEGER DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_cmsPages_displayOrder ON cmsPages(displayOrder);

-- Set initial displayOrder based on created_at for existing pages
UPDATE cmsPages 
SET displayOrder = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY createdAt) as row_number
  FROM cmsPages
) AS subquery
WHERE cmsPages.id = subquery.id;

-- Comment
COMMENT ON COLUMN cmsPages.displayOrder IS 'Display order for navigation (lower numbers appear first). Controlled via drag-and-drop in admin CMS page.';
