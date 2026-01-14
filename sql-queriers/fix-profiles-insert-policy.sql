-- =====================================================
-- FIX: Add INSERT policy for profiles table
-- This allows users to create their own profile row
-- =====================================================

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create the INSERT policy
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Verify the policy exists
SELECT 
  policyname, 
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
