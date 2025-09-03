-- =====================================================
-- CREATE/UPDATE: Admin User Setup
-- Use this if you need to create or update admin users
-- =====================================================

-- Option 1: Update existing user to Admin role
-- Replace 'your-email@example.com' with the actual admin email
UPDATE profiles 
SET role = 'Admin'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com'
);

-- Option 2: If profile doesn't exist, create it
-- Replace these values with actual admin details
INSERT INTO profiles (id, name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
  'Admin User',
  'Admin'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'Admin',
  name = COALESCE(EXCLUDED.name, profiles.name);

-- Option 3: Create admin user via Supabase Auth (if user doesn't exist)
-- This would need to be done in your application or Supabase dashboard

-- Verify the admin user was created/updated
SELECT 
  u.email,
  p.name,
  p.role,
  'Admin user ready' as status
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.role = 'Admin';
