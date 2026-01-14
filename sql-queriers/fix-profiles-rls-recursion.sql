-- =====================================================
-- FIX: Infinite recursion in profiles RLS policies
-- The "Admins can view all profiles" policy was querying
-- the profiles table from within a profiles policy = infinite loop
-- =====================================================

-- Drop all existing profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_access" ON profiles;
DROP POLICY IF EXISTS "profiles_own_access" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "service_role_all" ON profiles;

-- Create simple, non-recursive policies

-- 1. Users can SELECT their own profile (no recursion - just checks auth.uid())
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 2. Users can INSERT their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 3. Users can UPDATE their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- 4. Service role (admin client) can do everything - bypasses RLS anyway but explicit is good
-- Note: service_role bypasses RLS by default, but this is for clarity

-- For Admin users to view all profiles, we use a different approach:
-- Check the JWT claims instead of querying the profiles table
-- This requires setting app_metadata.role when creating users

-- Alternative: Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'Staff')
  );
$$;

-- 5. Admins can SELECT all profiles (uses function to avoid recursion)
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin_or_staff());

-- 6. Admins can UPDATE all profiles
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin_or_staff());

-- Verify policies
SELECT 
  policyname,
  cmd,
  permissive,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
