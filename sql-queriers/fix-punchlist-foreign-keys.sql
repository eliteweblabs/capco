-- Fix Punchlist Foreign Key Relationships
-- This script ensures the punchlist table has proper foreign key constraints

-- ==============================================
-- 1. CHECK CURRENT STATE
-- ==============================================

-- Check if punchlist table exists and has the right columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'punchlist' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing foreign key constraints on punchlist table
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
  AND tc.table_schema = 'public';

-- ==============================================
-- 2. ADD MISSING FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Add foreign key constraint for authorId -> profiles(id)
-- First check if the constraint already exists
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
    
    RAISE NOTICE 'Added punchlist_authorId_fkey constraint';
  ELSE
    RAISE NOTICE 'punchlist_authorId_fkey constraint already exists';
  END IF;
END $$;

-- Add foreign key constraint for projectId -> projects(id) if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'punchlist_projectId_fkey' 
      AND table_name = 'punchlist'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.punchlist 
    ADD CONSTRAINT punchlist_projectId_fkey 
    FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added punchlist_projectId_fkey constraint';
  ELSE
    RAISE NOTICE 'punchlist_projectId_fkey constraint already exists';
  END IF;
END $$;

-- Add foreign key constraint for parentId -> punchlist(id) if missing (self-reference)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'punchlist_parentId_fkey' 
      AND table_name = 'punchlist'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.punchlist 
    ADD CONSTRAINT punchlist_parentId_fkey 
    FOREIGN KEY ("parentId") REFERENCES public.punchlist(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added punchlist_parentId_fkey constraint';
  ELSE
    RAISE NOTICE 'punchlist_parentId_fkey constraint already exists';
  END IF;
END $$;

-- ==============================================
-- 3. VERIFY CONSTRAINTS
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
  RAISE NOTICE '✅ Punchlist foreign key constraints have been verified/added!';
  RAISE NOTICE '🔗 punchlist.authorId -> profiles.id (punchlist_authorId_fkey)';
  RAISE NOTICE '🔗 punchlist.projectId -> projects.id (punchlist_projectId_fkey)';
  RAISE NOTICE '🔗 punchlist.parentId -> punchlist.id (punchlist_parentId_fkey)';
END $$;
