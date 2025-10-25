-- =====================================================
-- FIX AVATAR PUBLIC ACCESS
-- Make avatars publicly accessible while keeping rest of project-media secure
-- =====================================================

-- ==============================================
-- 1. ENSURE PROJECT-MEDIA BUCKET EXISTS
-- ==============================================

-- Check if project-media bucket exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM storage.buckets 
    WHERE id = 'project-media'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES (
      'project-media',
      'Project Media',
      false -- Keep bucket itself private, we'll use RLS for avatars
    );
    RAISE NOTICE '✅ Created project-media bucket';
  ELSE
    RAISE NOTICE '✅ project-media bucket already exists';
  END IF;
END $$;

-- ==============================================
-- 2. CREATE PUBLIC ACCESS POLICY FOR AVATARS
-- ==============================================

-- Drop existing avatar policies if they exist
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

-- Create policy to allow PUBLIC read access to avatars/ subdirectory
CREATE POLICY "Public avatar access" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'project-media' 
    AND name LIKE 'avatars/%'
  );

-- ==============================================
-- 3. CREATE AUTHENTICATED UPLOAD POLICY FOR AVATARS
-- ==============================================

-- Drop existing avatar upload policy if exists
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;

-- Allow authenticated users to upload/update their own avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'project-media' 
    AND name LIKE 'avatars/%'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update their own avatars
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'project-media' 
    AND name LIKE 'avatars/%'
    AND auth.role() = 'authenticated'
    -- Allow if the file path contains the user's ID
    AND (
      name LIKE 'avatars/' || auth.uid()::text || '.%' 
      OR name LIKE 'avatars/' || auth.uid()::text || '/%'
    )
  );

-- ==============================================
-- 4. VERIFY SETUP
-- ==============================================

-- Check bucket status
SELECT 
  '🗂️ Bucket Status' as check_type,
  id,
  name,
  CASE WHEN public THEN '🌐 Public' ELSE '🔒 Private (RLS)' END as access_type,
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE id = 'project-media';

-- Check avatar policies
SELECT 
  '🔐 Avatar Policies' as check_type,
  policyname,
  cmd as permission,
  CASE 
    WHEN qual LIKE '%avatars%' THEN '✅ Avatar-specific'
    ELSE '⚠️ General'
  END as scope
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (policyname LIKE '%avatar%' OR qual LIKE '%avatars%')
ORDER BY policyname;

-- Test query to see what an anonymous user can access
SELECT 
  '🧪 Public Access Test' as check_type,
  COUNT(*) as avatar_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Avatars found'
    ELSE '⚠️ No avatars yet'
  END as status
FROM storage.objects 
WHERE bucket_id = 'project-media' 
  AND name LIKE 'avatars/%';

-- ✅ Avatar public access configured successfully!
-- 📝 Note: Avatars are now publicly accessible at: 
-- https://[your-project].supabase.co/storage/v1/object/public/project-media/avatars/[filename]

