-- Add include_in_navigation column to cms_pages table
-- This allows CMS pages to be included in the primary navigation menu

ALTER TABLE cms_pages 
ADD COLUMN IF NOT EXISTS include_in_navigation BOOLEAN DEFAULT false;

-- Add index for faster queries when filtering navigation pages
CREATE INDEX IF NOT EXISTS idx_cms_pages_navigation 
ON cms_pages(include_in_navigation) 
WHERE include_in_navigation = true;

-- Add comment
COMMENT ON COLUMN cms_pages.include_in_navigation IS 'If true, this page will appear in the primary navigation menu';
