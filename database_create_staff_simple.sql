-- Create staff users for testing (bypassing auth.users requirement)
-- Run this in your Supabase SQL editor

-- First, let's see what profiles currently exist
SELECT id, name, phone, role, created FROM profiles ORDER BY created DESC;

-- Temporarily disable the foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Create staff profiles (these won't have corresponding auth.users entries)
INSERT INTO profiles (id, name, phone, role, created) 
VALUES 
    (gen_random_uuid(), 'John Smith', '5551234567', 'Staff', NOW()),
    (gen_random_uuid(), 'Sarah Johnson', '5559876543', 'Staff', NOW()),
    (gen_random_uuid(), 'Mike Davis', '5555551234', 'Staff', NOW()),
    (gen_random_uuid(), 'Lisa Chen', '5554567890', 'Staff', NOW()),
    (gen_random_uuid(), 'Robert Wilson', '5553334567', 'Staff', NOW())
ON CONFLICT (id) DO NOTHING;

-- Re-enable the foreign key constraint (optional - for production)
-- ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);

-- Verify the staff users were created
SELECT id, name, phone, role, created 
FROM profiles 
WHERE role = 'Staff' 
ORDER BY name ASC;

-- Show all profiles to confirm
SELECT id, name, phone, role, created 
FROM profiles 
ORDER BY role, name; 