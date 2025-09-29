-- =====================================================
-- VERIFY: Admin User Setup and Project Access
-- Run this in Supabase SQL editor while logged in as admin
-- =====================================================

-- 1. Check current user and their profile
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() ->> 'email' as current_email;

-- 2. Check if current user has admin profile
SELECT 
  id,
  name,
  role,
  created_at
FROM profiles 
WHERE id = auth.uid();

-- 3. Count total projects in database
SELECT COUNT(*) as total_projects_in_db FROM projects;

-- 4. Count projects current user can see (should match total if admin)
SELECT COUNT(*) as projects_user_can_see FROM projects;

-- 5. Show sample projects with their authors
SELECT 
  p.id,
  p.title,
  p.author_id,
  prof.name as author_name,
  prof.role as author_role
FROM projects p
LEFT JOIN profiles prof ON p.author_id = prof.id
ORDER BY p.created_at DESC
LIMIT 5;

-- 6. Check all users and their roles
SELECT 
  id,
  name,
  role,
  created_at
FROM profiles
ORDER BY role, name;

-- 7. Verify RLS policies are active
SELECT 
  COUNT(*) as admin_policies_count
FROM pg_policies 
WHERE tablename = 'projects' 
  AND policyname LIKE '%Admin%';

-- If admin_policies_count is 0, the policies aren't applied yet!
