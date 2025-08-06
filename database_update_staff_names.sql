-- Update existing staff user and add more staff users with proper names
-- Run this in your Supabase SQL editor

-- First, let's see the current staff user
SELECT id, name, phone, role, created FROM profiles WHERE role = 'Staff';

-- Temporarily disable the foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Update the existing staff user with a proper name and phone
UPDATE profiles 
SET name = 'John Smith', phone = '5551234567'
WHERE role = 'Staff' AND name IS NULL;

-- Add more staff users with proper names
INSERT INTO profiles (id, name, phone, role, created) 
VALUES 
    (gen_random_uuid(), 'Sarah Johnson', '5559876543', 'Staff', NOW()),
    (gen_random_uuid(), 'Mike Davis', '5555551234', 'Staff', NOW()),
    (gen_random_uuid(), 'Lisa Chen', '5554567890', 'Staff', NOW()),
    (gen_random_uuid(), 'Robert Wilson', '5553334567', 'Staff', NOW())
ON CONFLICT (id) DO NOTHING;

-- Re-enable the foreign key constraint (optional - for production)
-- ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);

-- Verify all staff users now have names
SELECT id, name, phone, role, created 
FROM profiles 
WHERE role = 'Staff' 
ORDER BY name ASC;

-- Show all profiles to confirm
SELECT id, name, phone, role, created 
FROM profiles 
ORDER BY role, name; 