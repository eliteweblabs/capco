-- Fix CMS Page Slugs
-- Remove leading and trailing slashes from existing page slugs
-- Run this in Supabase SQL Editor

-- Show pages with problematic slugs (before fix)
SELECT 
  slug,
  TRIM(BOTH '/' FROM slug) as sanitized_slug,
  title
FROM "cmsPages"
WHERE slug LIKE '/%' OR slug LIKE '%/';

-- Update slugs to remove leading/trailing slashes
UPDATE "cmsPages"
SET slug = TRIM(BOTH '/' FROM slug)
WHERE slug LIKE '/%' OR slug LIKE '%/';

-- Verify fix
SELECT 
  slug,
  title,
  'Fixed ✓' as status
FROM "cmsPages"
WHERE slug NOT LIKE '/%' AND slug NOT LIKE '%/'
ORDER BY slug;
