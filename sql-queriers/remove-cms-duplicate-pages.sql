-- ============================================
-- Remove Duplicate CMS Pages
-- ============================================
-- This script removes duplicate pages where both a global (clientId = NULL)
-- and a client-specific version exist for the same slug.
--
-- Strategy: Keep client-specific pages, remove global duplicates
-- Run this in Supabase SQL Editor

-- STEP 1: View duplicates before deletion
-- ============================================
SELECT 
  slug,
  COUNT(*) as count,
  STRING_AGG(COALESCE(clientId, 'NULL'), ', ') as client_ids
FROM cmsPages
GROUP BY slug
HAVING COUNT(*) > 1
ORDER BY slug;

-- STEP 2: Delete global pages where client-specific versions exist
-- ============================================
-- This keeps the most specific version (client-specific) and removes globals

WITH duplicates AS (
  SELECT DISTINCT 
    p1.slug
  FROM cmsPages p1
  INNER JOIN cmsPages p2 
    ON p1.slug = p2.slug 
    AND p1.id != p2.id
  WHERE 
    -- p1 is global (no clientId)
    p1.clientId IS NULL
    -- p2 is client-specific (has clientId)
    AND p2.clientId IS NOT NULL
)
DELETE FROM cmsPages
WHERE slug IN (SELECT slug FROM duplicates)
  AND clientId IS NULL;

-- STEP 3: Verify no duplicates remain
-- ============================================
SELECT 
  slug,
  COUNT(*) as count,
  STRING_AGG(COALESCE(clientId, 'NULL'), ', ') as client_ids
FROM cmsPages
GROUP BY slug
HAVING COUNT(*) > 1
ORDER BY slug;

-- Expected: No rows returned (no duplicates)

-- STEP 4: View all pages after cleanup
-- ============================================
SELECT 
  slug,
  clientId,
  title,
  isActive,
  includeInNavigation,
  createdAt
FROM cmsPages
ORDER BY slug, clientId NULLS FIRST;
