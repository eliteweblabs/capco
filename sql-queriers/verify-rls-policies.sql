-- =====================================================
-- VERIFY: Check if all required RLS policies exist
-- Run this in Supabase SQL editor to verify your setup
-- =====================================================

-- 1. Check if RLS is enabled on all tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE tablename IN ('profiles', 'projects', 'files', 'invoices', 'invoice_line_items')
  AND schemaname = 'public'
ORDER BY tablename;

-- 2. List all existing policies
SELECT 
  schemaname,
  tablename, 
  policyname, 
  permissive,
  cmd as "Operation",
  qual as "Using_Condition"
FROM pg_policies 
WHERE tablename IN ('profiles', 'projects', 'files', 'invoices', 'invoice_line_items')
ORDER BY tablename, policyname;

-- 3. Check if profiles table has the minimum required policies
SELECT 
  COUNT(*) as "Profiles_Policies_Count",
  CASE 
    WHEN COUNT(*) >= 4 THEN 'OK - Has sufficient policies'
    ELSE 'MISSING - Needs more policies'
  END as "Status"
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Test profile access (should return your profile if RLS is working)
SELECT 
  id,
  name,
  role,
  'Profile accessible - RLS working' as status
FROM profiles 
WHERE id = auth.uid()
LIMIT 1;
