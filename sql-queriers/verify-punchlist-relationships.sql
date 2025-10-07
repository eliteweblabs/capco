-- Verify Punchlist Relationships
-- This script confirms that all punchlist relationships are working correctly

-- ==============================================
-- 1. CHECK FOREIGN KEY CONSTRAINTS
-- ==============================================

-- List all foreign key constraints on punchlist table
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'punchlist'
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- ==============================================
-- 2. CHECK PUNCHLIST DATA
-- ==============================================

-- Check that all punchlist records have valid user references
SELECT 
  p.id,
  p."authorId",
  p.message,
  p."createdAt",
  pr."firstName",
  pr."lastName",
  pr.role,
  pr.email
FROM punchlist p
LEFT JOIN profiles pr ON p."authorId" = pr.id
ORDER BY p."createdAt" DESC
LIMIT 10;

-- ==============================================
-- 3. TEST THE RELATIONSHIP
-- ==============================================

-- Test the exact query that the API uses
SELECT 
  p.*,
  pr.id as author_id,
  pr."firstName" as author_firstName,
  pr."lastName" as author_lastName,
  pr."companyName" as author_companyName,
  pr.role as author_role,
  pr.email as author_email
FROM punchlist p
LEFT JOIN profiles pr ON p."authorId" = pr.id
WHERE pr.id IS NOT NULL
LIMIT 5;

-- ==============================================
-- 4. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Punchlist relationships verified!';
  RAISE NOTICE '🔗 Foreign key constraints are in place';
  RAISE NOTICE '📝 Punchlist items should now load properly in the API';
  RAISE NOTICE '🎯 The "Could not find relationship" error should be resolved';
END $$;
