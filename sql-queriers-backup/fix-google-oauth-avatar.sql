-- =====================================================
-- FIX GOOGLE OAUTH AVATAR: Capture avatar_url from Google OAuth
-- This updates the auth trigger to include avatar_url from Google OAuth metadata
-- =====================================================

-- Update the function to handle new user creation with avatar_url from OAuth metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile with email, default role, and avatar_url from OAuth metadata
  INSERT INTO public.profiles (
    id, 
    email,
    role, 
    company_name,
    first_name,
    last_name,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    'Client', -- Default role for new users
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), NEW.email), -- Fall back to email if company_name is empty
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''), -- Extract from OAuth metadata if available
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''), -- Extract from OAuth metadata if available
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',  -- Google OAuth avatar_url
      NEW.raw_user_meta_data->>'picture',      -- Alternative Google OAuth field
      NULL
    ), -- Extract avatar_url from OAuth metadata
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles that have Google OAuth data but missing avatar_url
UPDATE profiles 
SET avatar_url = COALESCE(
  (SELECT raw_user_meta_data->>'avatar_url' FROM auth.users WHERE auth.users.id = profiles.id),
  (SELECT raw_user_meta_data->>'picture' FROM auth.users WHERE auth.users.id = profiles.id),
  avatar_url
)
WHERE avatar_url IS NULL 
AND id IN (
  SELECT id FROM auth.users 
  WHERE (raw_user_meta_data->>'avatar_url' IS NOT NULL AND raw_user_meta_data->>'avatar_url' != '')
     OR (raw_user_meta_data->>'picture' IS NOT NULL AND raw_user_meta_data->>'picture' != '')
);

-- Also update profiles table to ensure avatar_url column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index for better performance on avatar_url queries
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url) WHERE avatar_url IS NOT NULL;

-- Show updated profiles with avatar URLs
SELECT 
  id,
  email,
  company_name,
  first_name,
  last_name,
  avatar_url,
  created_at
FROM profiles 
WHERE avatar_url IS NOT NULL 
AND avatar_url != ''
ORDER BY created_at DESC
LIMIT 10;

-- Show summary of profiles with/without avatars
SELECT 
  COUNT(*) as total_profiles,
  COUNT(avatar_url) as profiles_with_avatars,
  COUNT(*) - COUNT(avatar_url) as profiles_without_avatars
FROM profiles;

-- Test the trigger (optional - remove after testing)
SELECT 'Google OAuth avatar trigger updated successfully!' as status;
