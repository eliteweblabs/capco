-- =====================================================
-- CREATE AUTH USER TRIGGER: Automatically create profiles
-- This replaces the need for ensureUserProfile patch function
-- Handles: Email signup, Magic link, Google OAuth, etc.
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _firstName text;
  _lastName text;
  _companyName text;
  _avatarUrl text;
BEGIN
  -- Extract first name (try multiple metadata fields for different auth providers)
  _firstName := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'firstName', ''),
    NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'given_name', ''),  -- Google OAuth
    ''
  );
  
  -- Extract last name
  _lastName := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'lastName', ''),
    NULLIF(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'family_name', ''),  -- Google OAuth
    ''
  );
  
  -- Extract company name (fallback to full name or email)
  _companyName := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'companyName', ''),
    NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),  -- Google OAuth full name
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    split_part(NEW.email, '@', 1)  -- Fallback to email username
  );
  
  -- Extract avatar URL (try multiple fields)
  _avatarUrl := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'avatarUrl', ''),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'picture', ''),  -- Google OAuth
    NULL
  );

  -- Insert new profile
  INSERT INTO public.profiles (
    id, 
    email,
    role, 
    "companyName",
    "firstName",
    "lastName",
    "avatarUrl",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id, 
    NEW.email,
    'Client',  -- Default role for new users
    _companyName,
    _firstName,
    _lastName,
    _avatarUrl,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Don't error if profile already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Test the trigger (optional - remove after testing)
SELECT 'Auth user trigger created successfully!' as status;

-- Verify the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
