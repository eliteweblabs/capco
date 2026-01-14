-- =====================================================
-- CREATE MISSING PROFILES FOR EXISTING AUTH USERS
-- Run this to create profile rows for users who exist in
-- auth.users but don't have a corresponding profiles row
-- =====================================================

-- First, let's see how many users are missing profiles
SELECT 
  'Users without profiles:' as info,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Create profiles for existing auth users who don't have one
INSERT INTO profiles (
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
SELECT 
  u.id,
  u.email,
  'Client',  -- Default role
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'companyName', ''),
    NULLIF(u.raw_user_meta_data->>'company_name', ''),
    NULLIF(u.raw_user_meta_data->>'name', ''),  -- Google OAuth full name
    NULLIF(u.raw_user_meta_data->>'full_name', ''),
    split_part(u.email, '@', 1)  -- Fallback to email username
  ) as "companyName",
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'firstName', ''),
    NULLIF(u.raw_user_meta_data->>'first_name', ''),
    NULLIF(u.raw_user_meta_data->>'given_name', ''),  -- Google OAuth
    ''
  ) as "firstName",
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'lastName', ''),
    NULLIF(u.raw_user_meta_data->>'last_name', ''),
    NULLIF(u.raw_user_meta_data->>'family_name', ''),  -- Google OAuth
    ''
  ) as "lastName",
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'avatarUrl', ''),
    NULLIF(u.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(u.raw_user_meta_data->>'picture', ''),  -- Google OAuth
    NULL
  ) as "avatarUrl",
  COALESCE(u.created_at, NOW()) as "createdAt",
  NOW() as "updatedAt"
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Show what was created
SELECT 
  'Profiles created:' as info,
  COUNT(*) as count
FROM profiles
WHERE "createdAt" >= NOW() - INTERVAL '1 minute';

-- List the newly created profiles
SELECT 
  id,
  email,
  "companyName",
  "firstName",
  "lastName",
  "avatarUrl",
  "createdAt"
FROM profiles
WHERE "createdAt" >= NOW() - INTERVAL '1 minute'
ORDER BY "createdAt" DESC;
