-- =====================================================
-- CREATE AUTH USER TRIGGER: Automatically create profiles
-- This replaces the need for ensureUserProfile patch function
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile with email and default role
  INSERT INTO public.profiles (
    id, 
    email,
    role, 
    company_name,
    first_name,
    last_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    'Client', -- Default role for new users
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''), -- Extract from OAuth metadata if available
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''), -- Extract from OAuth metadata if available
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''), -- Extract from OAuth metadata if available
    NOW(),
    NOW()
  );
  
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
-- This will show if the trigger is working
SELECT 'Auth user trigger created successfully!' as status;

-- Verify the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
