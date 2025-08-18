-- =====================================================
-- EMERGENCY FIX: Completely disable RLS temporarily for testing
-- This will allow you to test admin access immediately
-- =====================================================

-- STEP 1: Disable RLS on all tables to bypass recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies completely
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'projects', 'files', 'invoices', 'invoice_line_items')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- STEP 3: Verify all policies are gone
SELECT 
    tablename, 
    COUNT(*) as remaining_policies
FROM pg_policies 
WHERE tablename IN ('profiles', 'projects', 'files', 'invoices', 'invoice_line_items')
GROUP BY tablename;

-- STEP 4: Check that RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE tablename IN ('profiles', 'projects', 'files', 'invoices', 'invoice_line_items')
  AND schemaname = 'public'
ORDER BY tablename;

SELECT 'RLS completely disabled - admin should now see all projects' as status;
