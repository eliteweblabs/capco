-- Final fix for staff users
-- Run this in your Supabase SQL editor

-- First, let's see what's actually in the database
SELECT id, name, phone, role, created FROM profiles ORDER BY created DESC;

-- Check if the foreign key constraint is still active
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'profiles' AND tc.constraint_type = 'FOREIGN KEY';

-- If the constraint is still active, disable it
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Now create staff users
INSERT INTO profiles (id, name, phone, role, created) 
VALUES 
    (gen_random_uuid(), 'John Smith', '5551234567', 'Staff', NOW()),
    (gen_random_uuid(), 'Sarah Johnson', '5559876543', 'Staff', NOW()),
    (gen_random_uuid(), 'Mike Davis', '5555551234', 'Staff', NOW()),
    (gen_random_uuid(), 'Lisa Chen', '5554567890', 'Staff', NOW()),
    (gen_random_uuid(), 'Robert Wilson', '5553334567', 'Staff', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify staff users were created
SELECT id, name, phone, role, created 
FROM profiles 
WHERE role = 'Staff' 
ORDER BY name ASC;

-- Show all profiles
SELECT id, name, phone, role, created 
FROM profiles 
ORDER BY role, name; 