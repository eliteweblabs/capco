-- =====================================================
-- CREATE MISSING PROFILES FOR EXISTING AUTH USERS
-- Run this to create profile rows for users who exist in
-- auth.users but don't have a corresponding public.profiles row
-- =====================================================
--
-- NOTE: New rows copy auth.users.created_at into profiles."createdAt".
-- Do NOT verify with "createdAt in the last minute" — that will show 0
-- for normal backfills. Use RETURNING below or the orphan count query.
-- =====================================================

-- How many auth users still have no profile?
SELECT
  'Users without profiles:' AS info,
  COUNT(*) AS count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Create profiles for existing auth users who don't have one
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
SELECT
  u.id,
  COALESCE(u.email, ''),
  'Client',
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'companyName', ''),
    NULLIF(u.raw_user_meta_data ->> 'company_name', ''),
    NULLIF(u.raw_user_meta_data ->> 'name', ''),
    NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
    split_part(COALESCE(u.email, ''), '@', 1)
  ) AS "companyName",
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'firstName', ''),
    NULLIF(u.raw_user_meta_data ->> 'first_name', ''),
    NULLIF(u.raw_user_meta_data ->> 'given_name', ''),
    ''
  ) AS "firstName",
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'lastName', ''),
    NULLIF(u.raw_user_meta_data ->> 'last_name', ''),
    NULLIF(u.raw_user_meta_data ->> 'family_name', ''),
    ''
  ) AS "lastName",
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'avatarUrl', ''),
    NULLIF(u.raw_user_meta_data ->> 'avatar_url', ''),
    NULLIF(u.raw_user_meta_data ->> 'picture', ''),
    NULL
  ) AS "avatarUrl",
  COALESCE(u.created_at, NOW()) AS "createdAt",
  NOW() AS "updatedAt"
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
RETURNING id, email, "companyName", "createdAt", "updatedAt";

-- Should be 0 if backfill covered everyone
SELECT
  'Users still without profiles:' AS info,
  COUNT(*) AS count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
