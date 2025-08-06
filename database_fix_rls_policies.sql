-- Fix RLS policies to allow admins to view all profiles
-- Run this in your Supabase SQL editor

-- First, let's see what RLS policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop existing policies that might be blocking access
DROP POLICY IF EXISTS "Users can view their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create a policy that allows admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Admin'
        )
    );

-- Create a policy that allows users to view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Create a policy that allows staff to view all profiles
CREATE POLICY "Staff can view all profiles" ON profiles
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Admin', 'Staff')
        )
    );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Test the policies by checking what the current user can see
SELECT id, name, phone, role, created 
FROM profiles 
ORDER BY role, name; 