-- Simple RLS policies for project-media bucket
-- This allows any authenticated user to upload/download files

-- Drop all existing policies for project-media
DROP POLICY IF EXISTS "project_media_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "project_media_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "project_media_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "project_media_delete_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to project-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated downloads from project-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to project-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from project-media" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Create very simple policies that only check authentication
CREATE POLICY "project_media_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-media' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "project_media_download" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-media' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "project_media_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-media' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "project_media_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-media' AND
  auth.role() = 'authenticated'
);

-- Verify policies were created
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
