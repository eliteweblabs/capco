-- =====================================================
-- FIX PROFILES INFINITE RECURSION
-- Run this in Supabase SQL Editor
-- =====================================================

-- STEP 1: Drop ALL existing policies on profiles to eliminate recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_own_access" ON profiles;
DROP POLICY IF EXISTS "profiles_email_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_all_own" ON profiles;

-- STEP 2: Create a SECURITY DEFINER function to check admin status
-- This function bypasses RLS, so it won't cause recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('Admin', 'Staff')
  );
$$;

-- STEP 3: Create a single non-recursive policy for profiles
-- Users can access their own profile, OR if they're an admin (checked via function)
CREATE POLICY "profiles_access" ON profiles
FOR ALL USING (
  auth.uid() = id OR public.is_admin()
);

-- STEP 4: Verify the fix
SELECT 'Profiles recursion fixed!' as status;

-- Show all policies on profiles
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
