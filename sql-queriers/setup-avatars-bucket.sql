-- Setup Avatars Storage Bucket
-- This script creates the avatars storage bucket for user profile pictures

-- ==============================================
-- 1. CREATE AVATARS STORAGE BUCKET
-- ==============================================

-- Create the avatars bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true, -- Public bucket so avatars can be accessed directly
  5242880, -- 5MB file size limit
  ARRAY[
    -- Images
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==============================================
-- 2. CREATE STORAGE POLICIES FOR AVATARS BUCKET
-- ==============================================

-- Policy for viewing avatars (public read access)
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Avatars are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Policy for uploading avatars (authenticated users only)
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated'
  );

-- Policy for updating avatars (users can update their own avatars)
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    -- Allow if the file path contains the user's ID
    (name LIKE 'avatars/' || auth.uid()::text || '.%' OR name LIKE 'avatars/' || auth.uid()::text || '/%')
  );

-- Policy for deleting avatars (users can delete their own avatars)
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    -- Allow if the file path contains the user's ID
    (name LIKE 'avatars/' || auth.uid()::text || '.%' OR name LIKE 'avatars/' || auth.uid()::text || '/%')
  );

-- ==============================================
-- 3. VERIFY SETUP
-- ==============================================

-- Check if the bucket was created successfully
SELECT 
  'Storage Bucket' as component, 
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') 
       THEN '✅ Created' 
       ELSE '❌ Missing' 
  END as status;

-- Show bucket details
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'avatars';

-- Check storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%avatar%'
ORDER BY policyname;
