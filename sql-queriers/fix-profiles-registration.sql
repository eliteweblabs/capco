-- =====================================================
-- FIX: Profile Registration Issues
-- This script ensures profiles table can accept new registrations
-- =====================================================

-- Step 1: Verify profiles table structure
-- Show current columns
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 2: Drop and recreate service role policies
-- The issue: supabaseAdmin (service_role) needs INSERT/SELECT permissions
-- to create profiles during registration
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can select profiles" ON profiles;

-- Create INSERT policy for service role (used by supabaseAdmin during registration)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create SELECT policy for service role (needed to return the created profile)
CREATE POLICY "Service role can select profiles"
  ON profiles FOR SELECT
  TO service_role
  USING (true);

-- Step 3: Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify all policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Completion message
SELECT 'Profile registration fix completed successfully!' as status;
