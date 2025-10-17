-- Check bucket and policy setup
BEGIN;

-- Check bucket configuration
SELECT id, name, public, owner, created_at, updated_at
FROM storage.buckets 
WHERE id = 'project-media';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Check if RLS is enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'objects'
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- Check if any policies are blocking access
DO $$
DECLARE
    test_user_id uuid;
    test_project_id int;
BEGIN
    -- Get a test user ID (preferably an admin)
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE id IN (
        SELECT id 
        FROM public.profiles 
        WHERE role = 'Admin'
    )
    LIMIT 1;

    -- Get a test project ID
    SELECT id INTO test_project_id 
    FROM public.projects 
    LIMIT 1;

    IF test_user_id IS NOT NULL AND test_project_id IS NOT NULL THEN
        -- Set auth.uid() to test user
        SET LOCAL "request.jwt.claim.sub" = test_user_id::text;
        
        -- Test policy evaluation
        WITH policy_test AS (
            SELECT EXISTS (
                SELECT 1
                FROM storage.objects
                WHERE bucket_id = 'project-media'
                AND name LIKE 'projects/' || test_project_id || '/%'
            ) as can_access
        )
        SELECT 
            test_user_id as "Test User ID",
            test_project_id as "Test Project ID",
            can_access as "Can Access Files"
        FROM policy_test;
    ELSE
        RAISE NOTICE 'Could not find test user or project';
    END IF;
END $$;

-- Check if any conflicting policies exist
SELECT 
    p1.policyname as policy1,
    p2.policyname as policy2,
    p1.cmd,
    p1.roles as roles1,
    p2.roles as roles2
FROM pg_policies p1
JOIN pg_policies p2 
    ON p1.tablename = p2.tablename 
    AND p1.schemaname = p2.schemaname
    AND p1.policyname < p2.policyname
WHERE p1.tablename = 'objects'
AND p1.schemaname = 'storage'
AND p1.cmd = p2.cmd;

ROLLBACK;
