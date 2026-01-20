-- Add include_in_navigation column to cmsPages table
-- This allows CMS pages to be included in the primary navigation menu

ALTER TABLE cmsPages 
ADD COLUMN IF NOT EXISTS include_in_navigation BOOLEAN DEFAULT false;

-- Add index for faster queries when filtering navigation pages
CREATE INDEX IF NOT EXISTS idx_cmsPages_navigation 
ON cmsPages(include_in_navigation) 
WHERE include_in_navigation = true;

-- Add comment
COMMENT ON COLUMN cmsPages.include_in_navigation IS 'If true, this page will appear in the primary navigation menu';
