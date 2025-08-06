-- Check existing users and create staff profiles
-- Run this in your Supabase SQL editor

-- First, let's see what profiles currently exist
SELECT id, name, phone, role, created FROM profiles ORDER BY created DESC;

-- Let's also check what users exist in auth.users (if accessible)
-- Note: This might not work due to RLS, but worth trying
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Option 1: Update existing user to Staff role
-- Replace 'YOUR_USER_ID' with your actual user ID from the profiles table
UPDATE profiles 
SET role = 'Staff' 
WHERE id = (SELECT id FROM profiles LIMIT 1);

-- Option 2: Create a staff profile using an existing user ID
-- First, get the current user's ID
SELECT id, name, role FROM profiles WHERE role = 'Admin' LIMIT 1;

-- Then create a staff profile using that ID (for testing)
-- INSERT INTO profiles (id, name, phone, role, created) 
-- VALUES (
--     'YOUR_EXISTING_USER_ID', -- Replace with actual user ID
--     'Test Staff User', 
--     '5550000000', 
--     'Staff', 
--     NOW()
-- ) ON CONFLICT (id) DO UPDATE SET role = 'Staff';

-- Option 3: Create multiple staff profiles using the same user ID (for testing)
-- This is just for testing the UI - in production you'd have real staff users
INSERT INTO profiles (id, name, phone, role, created) 
VALUES 
    (gen_random_uuid(), 'John Smith', '5551234567', 'Staff', NOW()),
    (gen_random_uuid(), 'Sarah Johnson', '5559876543', 'Staff', NOW()),
    (gen_random_uuid(), 'Mike Davis', '5555551234', 'Staff', NOW()),
    (gen_random_uuid(), 'Lisa Chen', '5554567890', 'Staff', NOW()),
    (gen_random_uuid(), 'Robert Wilson', '5553334567', 'Staff', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify the staff users were created
SELECT id, name, phone, role, created 
FROM profiles 
WHERE role = 'Staff' 
ORDER BY name ASC;

-- Show all profiles to confirm
SELECT id, name, phone, role, created 
FROM profiles 
ORDER BY role, name; 