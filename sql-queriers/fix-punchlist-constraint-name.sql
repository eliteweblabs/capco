-- Fix Punchlist Foreign Key Constraint Name
-- This script ensures the constraint name matches what the API expects

-- ==============================================
-- 1. CHECK CURRENT CONSTRAINT NAMES
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
-- 2. DROP AND RECREATE WITH CORRECT NAME
-- ==============================================

-- Drop the existing constraint
ALTER TABLE public.punchlist 
DROP CONSTRAINT IF EXISTS punchlist_authorId_fkey;

-- Drop any other variations that might exist
ALTER TABLE public.punchlist 
DROP CONSTRAINT IF EXISTS punchlist_author_id_fkey;

-- Add the constraint with the name the API expects
ALTER TABLE public.punchlist 
ADD CONSTRAINT punchlist_author_id_fkey 
FOREIGN KEY ("authorId") REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ==============================================
-- 3. VERIFY THE CONSTRAINT WAS ADDED
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
  RAISE NOTICE '✅ Punchlist foreign key constraint renamed successfully!';
  RAISE NOTICE '🔗 Constraint name: punchlist_author_id_fkey';
  RAISE NOTICE '📝 API should now be able to find the relationship';
  RAISE NOTICE '🎯 The "Could not find relationship" error should be resolved';
END $$;
