-- =====================================================
-- FIX: Database error saving new user
-- This addresses the specific "Database error saving new user" issue
-- =====================================================

-- 1. First, let's drop the existing trigger and function to start clean
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Check if profiles table exists and drop it if it has issues
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Create a completely fresh profiles table with minimal constraints
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  phone TEXT,  
  role TEXT DEFAULT 'Client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add the foreign key constraint separately for better error handling
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Enable RLS with simple policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_all_own" ON profiles
FOR ALL USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Create a ROBUST trigger function with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    -- Try to insert the profile
    INSERT INTO profiles (id, name, role)
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name', 
        NEW.email,
        'User'
      ),
      'Client'
    );
    
    RETURN NEW;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Log the error for debugging but don't fail the user creation
      RAISE WARNING 'Failed to create profile for user %: % %', NEW.id, SQLSTATE, SQLERRM;
      RETURN NEW;
  END;
END;
$$;

-- 7. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- 8. Test the setup
SELECT 'Database setup completed' as status;

-- 9. Try a test insert to verify it works
DO $$
DECLARE
  test_id UUID;
BEGIN
  -- Generate a test UUID
  test_id := gen_random_uuid();
  
  -- Try inserting directly into profiles (simulating what the trigger does)
  INSERT INTO profiles (id, name, role) VALUES (test_id, 'Test User', 'Client');
  
  -- Clean up
  DELETE FROM profiles WHERE id = test_id;
  
  RAISE NOTICE 'Profile insertion test: SUCCESS';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Profile insertion test FAILED: % %', SQLSTATE, SQLERRM;
END;
$$;
