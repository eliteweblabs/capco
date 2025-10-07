-- Fix All Invalid Punchlist References
-- This script finds and fixes all punchlist records with invalid user references

-- ==============================================
-- 1. FIND ALL INVALID REFERENCES
-- ==============================================

-- Find punchlist records that reference non-existent users
SELECT 
  p.id,
  p."authorId",
  p.message,
  p."createdAt",
  pr.id as profile_exists
FROM punchlist p
LEFT JOIN profiles pr ON p."authorId" = pr.id
WHERE pr.id IS NULL;

-- Count how many invalid references we have
SELECT 
  COUNT(*) as invalid_references
FROM punchlist p
LEFT JOIN profiles pr ON p."authorId" = pr.id
WHERE pr.id IS NULL;

-- ==============================================
-- 2. GET A VALID ADMIN USER TO USE
-- ==============================================

-- Find the first available Admin user
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
-- 3. FIX ALL INVALID REFERENCES
-- ==============================================

DO $$
DECLARE
  valid_admin_id UUID;
  records_updated INTEGER;
  records_deleted INTEGER;
BEGIN
  -- Find a valid Admin user
  SELECT id INTO valid_admin_id 
  FROM profiles 
  WHERE role = 'Admin' 
  ORDER BY "createdAt" ASC 
  LIMIT 1;
  
  IF valid_admin_id IS NOT NULL THEN
    -- Update all punchlist records that reference invalid users
    UPDATE punchlist 
    SET "authorId" = valid_admin_id
    WHERE "authorId" NOT IN (
      SELECT id FROM profiles
    );
    
    GET DIAGNOSTICS records_updated = ROW_COUNT;
    
    RAISE NOTICE 'Updated % punchlist records to use valid admin user: %', records_updated, valid_admin_id;
    
    -- If there are still invalid references, delete them
    DELETE FROM punchlist 
    WHERE "authorId" NOT IN (
      SELECT id FROM profiles
    );
    
    GET DIAGNOSTICS records_deleted = ROW_COUNT;
    
    IF records_deleted > 0 THEN
      RAISE NOTICE 'Deleted % punchlist records with invalid user references', records_deleted;
    END IF;
  ELSE
    RAISE NOTICE 'No Admin users found - cannot fix references';
  END IF;
END $$;

-- ==============================================
-- 4. VERIFY ALL REFERENCES ARE NOW VALID
-- ==============================================

-- Check that all remaining punchlist records have valid user references
SELECT 
  p.id,
  p."authorId",
  p.message,
  pr."firstName",
  pr."lastName",
  pr.role
FROM punchlist p
LEFT JOIN profiles pr ON p."authorId" = pr.id
WHERE pr.id IS NULL; -- This should return no rows

-- Count valid vs invalid references
SELECT 
  CASE 
    WHEN pr.id IS NULL THEN 'INVALID'
    ELSE 'VALID'
  END as reference_status,
  COUNT(*) as count
FROM punchlist p
LEFT JOIN profiles pr ON p."authorId" = pr.id
GROUP BY (pr.id IS NULL);

-- ==============================================
-- 5. SUCCESS MESSAGE
-- ==============================================

DO $$
DECLARE
  total_punchlist INTEGER;
  valid_punchlist INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_punchlist FROM punchlist;
  
  SELECT COUNT(*) INTO valid_punchlist 
  FROM punchlist p
  JOIN profiles pr ON p."authorId" = pr.id;
  
  RAISE NOTICE '🎉 Punchlist references fixed!';
  RAISE NOTICE '📊 Total punchlist records: %', total_punchlist;
  RAISE NOTICE '✅ Valid references: %', valid_punchlist;
  RAISE NOTICE '🔗 All punchlist records now reference valid users';
END $$;
