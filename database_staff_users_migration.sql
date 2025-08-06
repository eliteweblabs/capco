-- Migration to add Staff role and demo staff users
-- Run this in your Supabase SQL editor

-- First, update the profiles table to support 'Staff' role
-- Note: This assumes your role column accepts text values

-- Create demo staff users (you'll need to manually create these in Supabase Auth first)
-- Then run this SQL to create their profiles

-- Staff User 1: John Smith
INSERT INTO profiles (id, name, phone, role, created) 
VALUES (
    gen_random_uuid(), 
    'John Smith', 
    5551234567, 
    'Staff', 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Staff User 2: Sarah Johnson  
INSERT INTO profiles (id, name, phone, role, created) 
VALUES (
    gen_random_uuid(), 
    'Sarah Johnson', 
    5559876543, 
    'Staff', 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Staff User 3: Mike Davis
INSERT INTO profiles (id, name, phone, role, created) 
VALUES (
    gen_random_uuid(), 
    'Mike Davis', 
    5555551234, 
    'Staff', 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Staff User 4: Lisa Chen
INSERT INTO profiles (id, name, phone, role, created) 
VALUES (
    gen_random_uuid(), 
    'Lisa Chen', 
    5554567890, 
    'Staff', 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Staff User 5: Robert Wilson
INSERT INTO profiles (id, name, phone, role, created) 
VALUES (
    gen_random_uuid(), 
    'Robert Wilson', 
    5553334567, 
    'Staff', 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add an assigned_to_id column to projects table if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS assigned_to_id UUID REFERENCES profiles(id);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to_id ON projects(assigned_to_id);

-- Update RLS policies to allow admins to see all projects and staff assignments
-- (You may need to adjust these based on your existing RLS policies)

-- Allow admins and staff to view all projects
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
CREATE POLICY "Admins and Staff can view all projects" ON projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Admin', 'Staff')
        )
        OR author_id = auth.uid()
    );

-- Allow admins to assign projects to staff
DROP POLICY IF EXISTS "Admins can update all projects" ON projects;
CREATE POLICY "Admins can update all projects" ON projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Admin'
        )
        OR author_id = auth.uid()
    );

-- Create a view for easier staff queries (optional)
CREATE OR REPLACE VIEW staff_members AS
SELECT id, name, phone, created
FROM profiles 
WHERE role = 'Staff'
ORDER BY name;

-- Grant access to the view
GRANT SELECT ON staff_members TO authenticated;