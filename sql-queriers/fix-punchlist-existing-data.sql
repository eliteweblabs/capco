-- Fix Punchlist Existing Data Issues
-- This script handles existing punchlist records that reference invalid users

-- ==============================================
-- 1. CHECK CURRENT STATE
-- ==============================================

-- Check what punchlist records exist and what users they reference
SELECT 
  p.id,
  p."authorId",
  p.message,
  p."createdAt",
  pr."firstName",
  pr."lastName",
  pr.role
FROM punchlist p
LEFT JOIN profiles pr ON p."authorId" = pr.id
ORDER BY p."createdAt" DESC
LIMIT 10;

-- Check if the hardcoded user exists
SELECT 
  id, 
  "firstName", 
  "lastName", 
  "companyName", 
  role,
  email
FROM profiles 
WHERE id = 'd0bc127f-d816-4aeb-ac48-6ba4b0718491';

-- Also check for the old hardcoded user ID that might still exist in punchlist records
SELECT 
  "authorId",
  COUNT(*) as record_count
FROM punchlist 
WHERE "authorId" IN ('bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'd0bc127f-d816-4aeb-ac48-6ba4b0718491')
GROUP BY "authorId";

-- ==============================================
-- 2. FIND A VALID ADMIN USER TO USE
-- ==============================================

-- Get the first Admin user we can use as a replacement
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
-- 3. OPTION A: UPDATE EXISTING RECORDS TO USE VALID USER
-- ==============================================

DO $$
DECLARE
  valid_admin_id UUID;
  records_updated INTEGER;
BEGIN
  -- Find a valid Admin user
  SELECT id INTO valid_admin_id 
  FROM profiles 
  WHERE role = 'Admin' 
  ORDER BY "createdAt" ASC 
  LIMIT 1;
  
  IF valid_admin_id IS NOT NULL THEN
    -- Update all punchlist records that reference invalid users (both old and new IDs)
    UPDATE punchlist 
    SET "authorId" = valid_admin_id
    WHERE "authorId" IN ('bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'd0bc127f-d816-4aeb-ac48-6ba4b0718491');
    
    GET DIAGNOSTICS records_updated = ROW_COUNT;
    
    RAISE NOTICE 'Updated % punchlist records to use valid admin user: %', records_updated, valid_admin_id;
  ELSE
    RAISE NOTICE 'No Admin users found - will need to create one or delete invalid records';
  END IF;
END $$;

-- ==============================================
-- 4. OPTION B: DELETE INVALID RECORDS (if no valid admin found)
-- ==============================================

DO $$
DECLARE
  valid_admin_id UUID;
  records_deleted INTEGER;
BEGIN
  -- Check if we have a valid admin
  SELECT id INTO valid_admin_id 
  FROM profiles 
  WHERE role = 'Admin' 
  ORDER BY "createdAt" ASC 
  LIMIT 1;
  
  IF valid_admin_id IS NULL THEN
    -- No valid admin found, delete records with invalid user references
    DELETE FROM punchlist 
    WHERE "authorId" IN ('bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'd0bc127f-d816-4aeb-ac48-6ba4b0718491');
    
    GET DIAGNOSTICS records_deleted = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % punchlist records with invalid user references', records_deleted;
  END IF;
END $$;

-- ==============================================
-- 5. CREATE THE MISSING USER (if needed for future records)
-- ==============================================

-- Only create the user if it doesn't exist and we want to keep the hardcoded ID
DO $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if the hardcoded user exists
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = 'd0bc127f-d816-4aeb-ac48-6ba4b0718491'
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    -- Create the missing user
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
    
    RAISE NOTICE 'Created missing admin user for future punchlist records';
  ELSE
    RAISE NOTICE 'The hardcoded user already exists';
  END IF;
END $$;

-- ==============================================
-- 6. NOW ADD THE FOREIGN KEY CONSTRAINT
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
-- 7. VERIFY THE FIX
-- ==============================================

-- Check that all punchlist records now have valid user references
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
-- 8. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Punchlist data and foreign key constraints fixed!';
  RAISE NOTICE '🔗 All punchlist records now reference valid users';
  RAISE NOTICE '📝 Foreign key constraint added successfully';
END $$;
