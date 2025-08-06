-- Create staff users for testing staff assignment functionality
-- Run this in your Supabase SQL editor

-- First, let's see what profiles currently exist
SELECT id, name, phone, role, created FROM profiles ORDER BY created DESC;

-- Create staff users (you'll need to create these users in Supabase Auth first)
-- Then run this SQL to create their profiles

-- Staff User 1: John Smith
INSERT INTO profiles (id, name, phone, role, created) 
VALUES (
    gen_random_uuid(), 
    'John Smith', 
    '5551234567', 
    'Staff', 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Staff User 2: Sarah Johnson  
INSERT INTO profiles (id, name, phone, role, created) 
VALUES (
    gen_random_uuid(), 
    'Sarah Johnson', 
    '5559876543', 
    'Staff', 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Staff User 3: Mike Davis
INSERT INTO profiles (id, name, phone, role, created) 
VALUES (
    gen_random_uuid(), 
    'Mike Davis', 
    '5555551234', 
    'Staff', 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Staff User 4: Lisa Chen
INSERT INTO profiles (id, name, phone, role, created) 
VALUES (
    gen_random_uuid(), 
    'Lisa Chen', 
    '5554567890', 
    'Staff', 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Staff User 5: Robert Wilson
INSERT INTO profiles (id, name, phone, role, created) 
VALUES (
    gen_random_uuid(), 
    'Robert Wilson', 
    '5553334567', 
    'Staff', 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verify the staff users were created
SELECT id, name, phone, role, created 
FROM profiles 
WHERE role = 'Staff' 
ORDER BY name ASC;

-- Show all profiles to confirm
SELECT id, name, phone, role, created 
FROM profiles 
ORDER BY role, name; 