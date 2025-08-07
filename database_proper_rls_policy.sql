-- Create proper RLS policy for profiles table
-- Run this in your Supabase SQL editor

-- First, let's see what we can currently see
SELECT id, name, phone, role, created 
FROM profiles 
ORDER BY role, name;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows authenticated users to view profiles
-- This is safe because we control who can authenticate
CREATE POLICY "Allow authenticated users to view profiles" ON profiles
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Create a policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- Create a policy for admins to update any profile
CREATE POLICY "Admins can update any profile" ON profiles
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Admin'
        )
    );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Test that we can still see all profiles
SELECT id, name, phone, role, created 
FROM profiles 
ORDER BY role, name; 