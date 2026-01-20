-- ============================================
-- CMS Pages Table Name Fix - Diagnostic & Repair
-- ============================================
-- Run this to diagnose and fix the table naming issue

-- STEP 1: Check what tables exist (diagnostic)
-- ============================================
SELECT 
  'Checking for CMS pages tables...' as step,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as table_size
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND (
    table_name = 'cmsPages' OR 
    table_name = 'cmspages' OR 
    table_name = 'cmsPages'
  )
ORDER BY table_name;

-- STEP 2: Check row counts in each possible table
-- ============================================
-- Try cmsPages (original name)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cmsPages') THEN
    RAISE NOTICE 'Table cmsPages exists with % rows', (SELECT COUNT(*) FROM cmsPages);
  END IF;
END $$;

-- Try cmspages (lowercase)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cmspages') THEN
    RAISE NOTICE 'Table cmspages exists with % rows', (SELECT COUNT(*) FROM cmspages);
  END IF;
END $$;

-- Try "cmsPages" (quoted camelCase)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cmsPages') THEN
    RAISE NOTICE 'Table "cmsPages" exists with % rows', (SELECT COUNT(*) FROM "cmsPages");
  END IF;
END $$;

-- STEP 3: Fix - Rename to standard snake_case (cmsPages)
-- ============================================
-- UNCOMMENT THE ONE THAT MATCHES YOUR SITUATION:

-- Option A: If you have cmspages (lowercase), rename it
-- ALTER TABLE cmspages RENAME TO cmsPages;

-- Option B: If you have "cmsPages" (quoted camelCase), rename it
-- ALTER TABLE "cmsPages" RENAME TO cmsPages;

-- Option C: If you have both tables, merge them (run this carefully!)
-- INSERT INTO cmsPages SELECT * FROM cmspages ON CONFLICT DO NOTHING;
-- DROP TABLE cmspages;

-- STEP 4: Verify the fix worked
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cmsPages') THEN
    RAISE NOTICE '✅ SUCCESS! Table cmsPages now has % rows', (SELECT COUNT(*) FROM cmsPages);
    RAISE NOTICE '✅ Next step: Update your code to use "cmsPages" instead of "cmsPages"';
  ELSE
    RAISE NOTICE '❌ ERROR: cmsPages table still does not exist!';
  END IF;
END $$;

-- STEP 5: Show sample data to verify content is intact
-- ============================================
-- UNCOMMENT after fixing:
-- SELECT id, slug, title, created_at, updated_at 
-- FROM cmsPages 
-- ORDER BY created_at DESC 
-- LIMIT 5;
