-- =====================================================
-- DIAGNOSE AVATAR ISSUES
-- This checks what avatar URLs are stored and if they're accessible
-- =====================================================

-- ==============================================
-- 1. CHECK WHAT AVATAR URLs ARE IN THE DATABASE
-- ==============================================

SELECT 
  '1️⃣ Current Avatar URLs in Database' as check_section;

SELECT 
  id,
  email,
  "companyName",
  "avatarUrl",
  CASE 
    WHEN "avatarUrl" IS NULL THEN '❌ No avatar'
    WHEN "avatarUrl" LIKE '%googleusercontent%' THEN '⚠️ Still using Google URL (needs migration)'
    WHEN "avatarUrl" LIKE '%supabase.co/storage/v1/object/public/project-media/avatars/%' THEN '✅ Using Supabase Storage'
    ELSE '⚠️ Unknown avatar source'
  END as avatar_status,
  "createdAt"
FROM profiles 
ORDER BY "createdAt" DESC
LIMIT 20;

-- ==============================================
-- 2. CHECK STORAGE BUCKET AND FILES
-- ==============================================

SELECT 
  '2️⃣ Storage Bucket Configuration' as check_section;

-- Check if project-media bucket exists and its settings
SELECT 
  id,
  name,
  CASE WHEN public THEN '🌐 Public' ELSE '🔒 Private (uses RLS)' END as public_status,
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE id = 'project-media';

SELECT 
  '3️⃣ Avatar Files in Storage' as check_section;

-- Check if any avatar files exist in storage
SELECT 
  name as file_path,
  bucket_id,
  created_at,
  updated_at,
  CASE 
    WHEN metadata->>'size' IS NOT NULL 
    THEN (metadata->>'size')::bigint || ' bytes'
    ELSE 'Unknown size'
  END as file_size
FROM storage.objects 
WHERE bucket_id = 'project-media' 
  AND name LIKE 'avatars/%'
ORDER BY created_at DESC
LIMIT 20;

-- ==============================================
-- 4. CHECK RLS POLICIES FOR AVATAR ACCESS
-- ==============================================

SELECT 
  '4️⃣ RLS Policies for Avatars' as check_section;

-- Check what policies exist for avatar access
SELECT 
  policyname,
  cmd as permission,
  CASE 
    WHEN roles::text LIKE '%public%' OR qual IS NULL THEN '🌐 Public access'
    WHEN qual LIKE '%authenticated%' THEN '🔒 Authenticated only'
    ELSE '🔐 Custom access'
  END as access_type,
  CASE 
    WHEN qual LIKE '%avatars%' THEN '✅ Avatar-specific'
    ELSE '⚠️ General policy'
  END as scope
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (
    policyname LIKE '%avatar%' 
    OR qual LIKE '%avatars%'
    OR policyname LIKE '%project%media%'
  )
ORDER BY policyname;

-- ==============================================
-- 5. SUMMARY AND RECOMMENDATIONS
-- ==============================================

SELECT 
  '5️⃣ Summary' as check_section;

-- Count profiles by avatar status
SELECT 
  COUNT(*) as total_profiles,
  COUNT("avatarUrl") as profiles_with_avatar_url,
  COUNT(CASE WHEN "avatarUrl" LIKE '%googleusercontent%' THEN 1 END) as google_avatars,
  COUNT(CASE WHEN "avatarUrl" LIKE '%supabase.co%' THEN 1 END) as supabase_avatars,
  COUNT(*) - COUNT("avatarUrl") as no_avatar
FROM profiles;

-- Count files in storage
SELECT 
  COUNT(*) as avatar_files_in_storage
FROM storage.objects 
WHERE bucket_id = 'project-media' 
  AND name LIKE 'avatars/%';

-- ==============================================
-- 6. ACTION ITEMS
-- ==============================================

SELECT 
  '6️⃣ Action Items' as check_section;

-- If we have Google URLs but no files in storage, we need to trigger migration
DO $$
DECLARE
  google_count INTEGER;
  storage_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO google_count FROM profiles WHERE "avatarUrl" LIKE '%googleusercontent%';
  SELECT COUNT(*) INTO storage_count FROM storage.objects WHERE bucket_id = 'project-media' AND name LIKE 'avatars/%';
  
  IF google_count > 0 AND storage_count = 0 THEN
    RAISE NOTICE '⚠️ ACTION REQUIRED: You have % profiles with Google avatars but no files in storage.', google_count;
    RAISE NOTICE '➡️ Users need to log in again to trigger avatar migration.';
    RAISE NOTICE '➡️ Or run a manual migration script to download all Google avatars.';
  ELSIF google_count = 0 AND storage_count > 0 THEN
    RAISE NOTICE '✅ Good! All avatars are stored in Supabase Storage.';
  ELSIF google_count > 0 AND storage_count > 0 THEN
    RAISE NOTICE '⚠️ Mixed state: Some avatars migrated, some still on Google.';
    RAISE NOTICE '➡️ Users with Google URLs need to log in again.';
  ELSE
    RAISE NOTICE 'ℹ️ No avatars found in database or storage.';
  END IF;
END $$;

