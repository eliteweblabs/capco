-- Fix RLS policies with simple approach
-- Run this in your Supabase SQL editor

-- First, let's see what RLS policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Temporarily disable RLS to test
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Test what we can see now
SELECT id, name, phone, role, created 
FROM profiles 
ORDER BY role, name;

-- If that works, we can re-enable RLS with a simple policy
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all authenticated users to view profiles" ON profiles
--     FOR SELECT 
--     USING (auth.role() = 'authenticated'); 