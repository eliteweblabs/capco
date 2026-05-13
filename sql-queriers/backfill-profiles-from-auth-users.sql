-- =============================================================================
-- Backfill public.profiles for auth.users that have no profile row
-- =============================================================================
-- Use when users appear in Authentication but not in User Management / profiles.
-- Common causes: trigger on_auth_user_created skipped, user imported without trigger,
-- or profile row deleted manually.
--
-- Safe: only INSERTs where LEFT JOIN finds no profiles.id; default role Client.
-- New rows use auth signup time for "createdAt" and now() for "updatedAt".
-- Use RETURNING / orphan count — not "createdAt in the last minute".

-- Preview: how many auth users are missing a profile?
SELECT
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ORDER BY u.created_at;
-- Optional (newer Supabase): add AND u.deleted_at IS NULL to skip soft-deleted auth rows.

-- Backfill (run after reviewing preview)
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
  COALESCE(u.email, '') AS email,
  'Client'::text AS role,
  COALESCE(
    NULLIF(trim(u.raw_user_meta_data ->> 'companyName'), ''),
    NULLIF(trim(u.raw_user_meta_data ->> 'company_name'), ''),
    NULLIF(trim(u.raw_user_meta_data ->> 'name'), ''),
    NULLIF(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    split_part(COALESCE(u.email, ''), '@', 1)
  ) AS "companyName",
  COALESCE(
    NULLIF(trim(u.raw_user_meta_data ->> 'firstName'), ''),
    NULLIF(trim(u.raw_user_meta_data ->> 'first_name'), ''),
    NULLIF(trim(u.raw_user_meta_data ->> 'given_name'), ''),
    ''
  ) AS "firstName",
  COALESCE(
    NULLIF(trim(u.raw_user_meta_data ->> 'lastName'), ''),
    NULLIF(trim(u.raw_user_meta_data ->> 'last_name'), ''),
    NULLIF(trim(u.raw_user_meta_data ->> 'family_name'), ''),
    ''
  ) AS "lastName",
  COALESCE(
    NULLIF(trim(u.raw_user_meta_data ->> 'avatarUrl'), ''),
    NULLIF(trim(u.raw_user_meta_data ->> 'avatar_url'), ''),
    NULLIF(trim(u.raw_user_meta_data ->> 'picture'), ''),
    NULL
  ) AS "avatarUrl",
  COALESCE(u.created_at, now()) AS "createdAt",
  now() AS "updatedAt"
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
RETURNING id, email, "companyName", "createdAt", "updatedAt";

-- Should be 0 after a successful full backfill
SELECT
  'Users still without profiles:' AS info,
  COUNT(*) AS count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

SELECT (SELECT count(*) FROM public.profiles) AS profile_rows,
       (SELECT count(*) FROM auth.users) AS auth_user_rows;
