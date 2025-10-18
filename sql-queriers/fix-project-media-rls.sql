-- Fix RLS policies for project-media bucket
-- This script ensures proper RLS policies are in place for project-media uploads

-- First, drop any existing conflicting policies
DROP POLICY IF EXISTS "project_media_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "project_media_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "project_media_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "project_media_delete_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to project-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated downloads from project-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to project-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from project-media" ON storage.objects;

-- Create simple, permissive policies for project-media bucket
CREATE POLICY "project_media_insert_authenticated" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-media' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "project_media_select_authenticated" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-media' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "project_media_update_authenticated" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-media' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "project_media_delete_authenticated" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-media' AND
  auth.role() = 'authenticated'
);

-- Verify the policies were created
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%project_media%'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
    relname, 
    relrowsecurity,
    CASE WHEN relrowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_class
WHERE relname = 'objects'
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');
