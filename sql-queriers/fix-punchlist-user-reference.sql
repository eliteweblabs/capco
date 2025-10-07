-- Fix Punchlist User Reference Issue
-- This script handles the missing user reference in punchlist functions

-- ==============================================
-- 1. CHECK CURRENT STATE
-- ==============================================

-- Check if the hardcoded user exists in profiles
SELECT 
  id, 
  "firstName", 
  "lastName", 
  "companyName", 
  role,
  email
FROM profiles 
WHERE id = 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17';

-- List all existing users to see what we have
SELECT 
  id, 
  "firstName", 
  "lastName", 
  "companyName", 
  role,
  email
FROM profiles 
ORDER BY "createdAt" DESC
LIMIT 10;

-- ==============================================
-- 2. FIND OR CREATE ADMIN USER
-- ==============================================

-- Check if we have any Admin users
SELECT 
  id, 
  "firstName", 
  "lastName", 
  "companyName", 
  role,
  email
FROM profiles 
WHERE role = 'Admin'
ORDER BY "createdAt" ASC
LIMIT 1;

-- ==============================================
-- 3. OPTION A: CREATE THE MISSING USER
-- ==============================================

-- Only run this if the user doesn't exist
DO $$
DECLARE
  user_exists BOOLEAN;
  admin_user_id UUID;
BEGIN
  -- Check if the hardcoded user exists
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17'
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    -- Try to find an existing Admin user first
    SELECT id INTO admin_user_id 
    FROM profiles 
    WHERE role = 'Admin' 
    ORDER BY "createdAt" ASC 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
      RAISE NOTICE 'Found existing Admin user: %', admin_user_id;
      RAISE NOTICE 'You should update the punchlist functions to use this user ID instead of the hardcoded one';
    ELSE
      -- Create a default admin user
      INSERT INTO profiles (
        id,
        email,
        "firstName",
        "lastName", 
        "companyName",
        role,
        "createdAt",
        "updatedAt"
      ) VALUES (
        'bdaaa7d3-469d-4b1b-90d1-978e1be47a17',
        'admin@capcofire.com',
        'CAPCo',
        'Admin',
        'CAPCo Fire Protection Systems',
        'Admin',
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created default admin user for punchlist functions';
    END IF;
  ELSE
    RAISE NOTICE 'The hardcoded user already exists in profiles';
  END IF;
END $$;

-- ==============================================
-- 4. VERIFY THE FIX
-- ==============================================

-- Check if the user now exists
SELECT 
  id, 
  "firstName", 
  "lastName", 
  "companyName", 
  role,
  email
FROM profiles 
WHERE id = 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17';

-- ==============================================
-- 5. NOW ADD THE FOREIGN KEY CONSTRAINT
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
-- 6. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Punchlist foreign key issue resolved!';
  RAISE NOTICE '🔗 punchlist.authorId -> profiles.id relationship established';
  RAISE NOTICE '📝 You may want to update punchlist functions to use a real admin user ID';
END $$;
