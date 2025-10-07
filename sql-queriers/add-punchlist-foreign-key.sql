-- Add Punchlist Foreign Key Constraint
-- This script adds the missing foreign key constraint now that data is clean

-- ==============================================
-- 1. VERIFY CURRENT STATE
-- ==============================================

-- Check that all punchlist records have valid user references
SELECT 
  p.id,
  p."authorId",
  p.message,
  pr."firstName",
  pr."lastName",
  pr.role
FROM punchlist p
LEFT JOIN profiles pr ON p."authorId" = pr.id
WHERE pr.id IS NULL; -- This should return no rows if all references are valid

-- ==============================================
-- 2. ADD FOREIGN KEY CONSTRAINT
-- ==============================================

-- Add foreign key constraint for authorId -> profiles(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'punchlist_authorId_fkey' 
      AND table_name = 'punchlist'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.punchlist 
    ADD CONSTRAINT punchlist_authorId_fkey 
    FOREIGN KEY ("authorId") REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Added punchlist_authorId_fkey constraint successfully!';
  ELSE
    RAISE NOTICE 'punchlist_authorId_fkey constraint already exists';
  END IF;
END $$;

-- ==============================================
-- 3. VERIFY CONSTRAINT WAS ADDED
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
-- 4. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Punchlist foreign key constraint added successfully!';
  RAISE NOTICE '🔗 punchlist.authorId -> profiles.id relationship established';
  RAISE NOTICE '📝 Punchlist items should now load properly!';
END $$;
