-- =====================================================
-- MIGRATE EXISTING USERS: Create profiles for users without them
-- Run this after creating the auth trigger to handle existing users
-- =====================================================

-- Find users who don't have profiles
SELECT 
  u.id,
  u.email,
  u.created_at as user_created_at,
  'Missing profile' as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at;

-- Create profiles for users who don't have them
INSERT INTO profiles (
  id,
  email,
  role,
  company_name,
  first_name,
  last_name,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.email,
  'Client' as role,
  COALESCE(u.raw_user_meta_data->>'company_name', '') as company_name,
  COALESCE(u.raw_user_meta_data->>'first_name', '') as first_name,
  COALESCE(u.raw_user_meta_data->>'last_name', '') as last_name,
  u.created_at,
  NOW() as updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Verify the migration
SELECT 
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(*) - COUNT(p.id) as users_without_profiles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;

-- Show success message
SELECT 'Migration completed! All existing users now have profiles.' as status;
