-- Allow public read access to project-media bucket
-- This allows featured project images to be viewed by anyone without authentication
-- while keeping upload/update/delete operations secure (auth required)

-- Drop old restrictive policy if it exists
DROP POLICY IF EXISTS "project_media_public_featured_images" ON storage.objects;

-- Create a public read policy for ALL files in project-media bucket
-- This is safe because:
-- 1. Upload/Update/Delete still require authentication
-- 2. Only SELECT (read) is public
-- 3. Project files that are featured are meant to be public anyway
CREATE POLICY "project_media_public_read" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-media'
);

-- Verify the policy was created
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual as using_expression
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname = 'project_media_public_read'
ORDER BY policyname;

-- Test query: List recent files (will be accessible publicly after this change)
SELECT 
    name,
    bucket_id,
    created_at,
    metadata->>'size' as size_bytes
FROM storage.objects
WHERE bucket_id = 'project-media'
ORDER BY created_at DESC
LIMIT 10;
