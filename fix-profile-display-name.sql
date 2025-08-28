-- Fix the profile creation trigger to properly use display_name from registration
-- This updates the existing trigger to prioritize display_name over other name fields

-- Drop and recreate the trigger function with enhanced name handling
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    -- Insert profile with enhanced name resolution
    INSERT INTO profiles (id, name, phone, role)
    VALUES (
      NEW.id,
      COALESCE(
        -- Prioritize display_name from registration form
        NEW.raw_user_meta_data->>'display_name',
        -- Fall back to full_name
        NEW.raw_user_meta_data->>'full_name',
        -- Fall back to constructed name from first + last
        CASE 
          WHEN NEW.raw_user_meta_data->>'first_name' IS NOT NULL 
               AND NEW.raw_user_meta_data->>'last_name' IS NOT NULL
          THEN CONCAT(
            NEW.raw_user_meta_data->>'first_name', 
            ' ', 
            NEW.raw_user_meta_data->>'last_name'
          )
          ELSE NULL
        END,
        -- Fall back to name (from OAuth)
        NEW.raw_user_meta_data->>'name',
        -- Fall back to email
        NEW.email,
        -- Final fallback
        'User'
      ),
      -- Extract phone if provided
      NEW.raw_user_meta_data->>'phone',
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Update existing profiles that might have missing names
-- This will fix profiles that were created with the old trigger
UPDATE profiles 
SET name = COALESCE(
  -- Try to get display_name from auth.users metadata
  (SELECT au.raw_user_meta_data->>'display_name' 
   FROM auth.users au 
   WHERE au.id = profiles.id),
  -- Fall back to full_name
  (SELECT au.raw_user_meta_data->>'full_name' 
   FROM auth.users au 
   WHERE au.id = profiles.id),
  -- Fall back to constructed name
  (SELECT 
     CASE 
       WHEN au.raw_user_meta_data->>'first_name' IS NOT NULL 
            AND au.raw_user_meta_data->>'last_name' IS NOT NULL
       THEN CONCAT(
         au.raw_user_meta_data->>'first_name', 
         ' ', 
         au.raw_user_meta_data->>'last_name'
       )
       ELSE NULL
     END
   FROM auth.users au 
   WHERE au.id = profiles.id),
  -- Fall back to OAuth name
  (SELECT au.raw_user_meta_data->>'name' 
   FROM auth.users au 
   WHERE au.id = profiles.id),
  -- Fall back to email
  (SELECT au.email 
   FROM auth.users au 
   WHERE au.id = profiles.id),
  -- Final fallback
  'User'
)
WHERE name IS NULL OR name = '' OR name = 'User';

-- Update phone numbers that might be missing
UPDATE profiles 
SET phone = (
  SELECT au.raw_user_meta_data->>'phone' 
  FROM auth.users au 
  WHERE au.id = profiles.id
)
WHERE phone IS NULL 
  AND EXISTS (
    SELECT 1 
    FROM auth.users au 
    WHERE au.id = profiles.id 
    AND au.raw_user_meta_data->>'phone' IS NOT NULL
  );

-- Show results
SELECT 'Profile trigger updated successfully!' as status;

-- Show a sample of updated profiles
SELECT 
  p.id,
  p.name,
  p.phone,
  au.email,
  au.raw_user_meta_data->>'display_name' as metadata_display_name,
  au.raw_user_meta_data->>'full_name' as metadata_full_name,
  au.raw_user_meta_data->>'first_name' as metadata_first_name,
  au.raw_user_meta_data->>'last_name' as metadata_last_name
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY au.created_at DESC
LIMIT 5;
