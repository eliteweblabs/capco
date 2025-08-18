-- =====================================================
-- FIX: Remove Infinite Recursion in RLS Policies
-- This fixes the "infinite recursion detected" error
-- =====================================================

-- STEP 1: Disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "profiles_all_own" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

-- Drop project policies that reference profiles (causing recursion)
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Admins can insert any projects" ON projects;
DROP POLICY IF EXISTS "Admins can update any projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete any projects" ON projects;

-- STEP 3: Create NON-RECURSIVE profiles policies first
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Simple profile policies (no recursion)
CREATE POLICY "profiles_own_access" ON profiles
FOR ALL USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- STEP 4: Create a special admin bypass policy using role directly from auth
-- This avoids recursion by not checking the profiles table
CREATE POLICY "profiles_admin_access" ON profiles
FOR ALL USING (
  -- Check if user email is admin (replace with your admin email)
  auth.jwt() ->> 'email' IN ('admin@capcofire.com', 'your-admin-email@domain.com')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('admin@capcofire.com', 'your-admin-email@domain.com')
);

-- STEP 5: Create simplified project policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can access their own projects
CREATE POLICY "projects_own_access" ON projects
FOR ALL USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Admins can access all projects (using email check to avoid recursion)
CREATE POLICY "projects_admin_access" ON projects
FOR ALL USING (
  auth.jwt() ->> 'email' IN ('admin@capcofire.com', 'your-admin-email@domain.com')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('admin@capcofire.com', 'your-admin-email@domain.com')
);

-- STEP 6: Create simplified file policies
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Users can access files for their own projects
CREATE POLICY "files_own_access" ON files
FOR ALL USING (
  auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM projects WHERE id = files.project_id AND author_id = auth.uid())
)
WITH CHECK (
  auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM projects WHERE id = files.project_id AND author_id = auth.uid())
);

-- Admins can access all files
CREATE POLICY "files_admin_access" ON files
FOR ALL USING (
  auth.jwt() ->> 'email' IN ('admin@capcofire.com', 'your-admin-email@domain.com')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('admin@capcofire.com', 'your-admin-email@domain.com')
);

-- STEP 7: Update admin email addresses
-- IMPORTANT: Replace these with your actual admin email addresses
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'), 
  '{role}', 
  '"Admin"'
)
WHERE email IN ('admin@capcofire.com', 'your-admin-email@domain.com');

-- STEP 8: Verify the fix
SELECT 'Policies created successfully' as status;

-- List all current policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'projects', 'files')
ORDER BY tablename, policyname;
