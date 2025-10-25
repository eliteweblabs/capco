-- Simple Avatar Diagnostics
-- Run each query separately if needed

-- Query 1: Check avatar URLs in profiles
SELECT 
  id,
  email,
  "companyName",
  "avatarUrl",
  "createdAt"
FROM profiles 
WHERE "avatarUrl" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 10;

-- Query 2: Check if project-media bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE id = 'project-media';

-- Query 3: Check avatar files in storage
SELECT 
  name,
  bucket_id,
  created_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'project-media' 
  AND name LIKE 'avatars/%'
ORDER BY created_at DESC
LIMIT 10;

-- Query 4: Count everything
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM profiles WHERE "avatarUrl" IS NOT NULL) as profiles_with_avatars,
  (SELECT COUNT(*) FROM profiles WHERE "avatarUrl" LIKE '%googleusercontent%') as google_avatars,
  (SELECT COUNT(*) FROM profiles WHERE "avatarUrl" LIKE '%supabase.co%') as supabase_avatars,
  (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'project-media' AND name LIKE 'avatars/%') as files_in_storage;

-- Query 5: Check RLS policies for avatars
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (policyname LIKE '%avatar%' OR qual LIKE '%avatars%')
ORDER BY policyname;

