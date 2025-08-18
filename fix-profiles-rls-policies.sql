-- =====================================================
-- CRITICAL: RLS Policies for CAPCo Fire Protection App
-- These policies are REQUIRED for the application to work
-- =====================================================

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_all_own" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

-- 1. Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- 2. Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Allow Admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role IN ('Admin', 'Staff')
  )
);

-- 4. Allow Admins to update any profile
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role IN ('Admin', 'Staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role IN ('Admin', 'Staff')
  )
);

-- 5. Allow Admins to insert profiles (for staff creation)
CREATE POLICY "Admins can insert profiles" ON profiles
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role IN ('Admin', 'Staff')
  )
);

-- 6. Allow profile creation during registration (by trigger or API)
-- This policy allows insertion when there's no existing user session (during signup)
CREATE POLICY "Allow profile creation during signup" ON profiles
FOR INSERT WITH CHECK (
  -- Allow if no current user (during trigger execution)
  auth.uid() IS NULL OR
  -- Allow if inserting own profile
  auth.uid() = id
);

-- =====================================================
-- Verify RLS is properly configured
-- =====================================================

-- Check that RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- List all policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';
