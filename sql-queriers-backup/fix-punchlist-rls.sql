-- Fix Punchlist RLS Issues
-- This script fixes the Row Level Security policies to allow proper creation of default punchlist items

-- ==============================================
-- 1. UPDATE THE AUTO-CREATE FUNCTION TO USE PROJECT AUTHOR
-- ==============================================

-- Function to create default punchlist items for new projects
-- Updated to use the project author instead of a hardcoded admin user
CREATE OR REPLACE FUNCTION create_default_punchlist_items(project_id_param INTEGER)
RETURNS void AS $$
DECLARE
    project_author_id UUID;
    author_company_name TEXT;
BEGIN
    -- Get the project author's ID and company name
    SELECT author_id INTO project_author_id 
    FROM projects 
    WHERE id = project_id_param;
    
    -- Get the author's company name from profiles
    SELECT COALESCE(company_name, first_name || ' ' || last_name, 'Unknown User') 
    INTO author_company_name
    FROM profiles 
    WHERE id = project_author_id;
    
    -- If we couldn't find the author, exit
    IF project_author_id IS NULL THEN
        RAISE NOTICE 'Could not find author for project %', project_id_param;
        RETURN;
    END IF;
    
    -- Insert default punchlist items using the project author
    INSERT INTO punchlist (project_id, author_id, message, internal, mark_completed, company_name)
    VALUES 
    (project_id_param, project_author_id, 'Final walkthrough completed', false, false, author_company_name),
    (project_id_param, project_author_id, 'All systems tested and operational', false, false, author_company_name),
    (project_id_param, project_author_id, 'Documentation and certificates provided', false, false, author_company_name),
    (project_id_param, project_author_id, 'Client training completed', false, false, author_company_name),
    (project_id_param, project_author_id, 'Final invoice processed', false, false, author_company_name);
    
    RAISE NOTICE 'Created default punchlist items for project % with author %', project_id_param, project_author_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 2. ADD A SPECIAL POLICY FOR SYSTEM OPERATIONS
-- ==============================================

-- Add a policy that allows bypassing RLS for system operations
-- This allows the trigger to insert default items regardless of the current user context
DROP POLICY IF EXISTS "System can create default punchlist items" ON punchlist;

CREATE POLICY "System can create default punchlist items"
ON punchlist
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is admin/staff
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('Admin', 'Staff')
  )
  OR
  -- Allow if user owns the project and is creating items for themselves
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = punchlist.project_id 
    AND projects.author_id = auth.uid()
    AND punchlist.author_id = auth.uid()
  )
);

-- ==============================================
-- 3. UPDATE THE TRIGGER FUNCTION TO RUN WITH SECURITY DEFINER
-- ==============================================

-- Update the trigger function to run with elevated privileges
CREATE OR REPLACE FUNCTION auto_create_punchlist_items()
RETURNS TRIGGER 
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
    -- Call the function to create default punchlist items
    PERFORM create_default_punchlist_items(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 4. CREATE DEFAULT ITEMS FOR EXISTING PROJECTS (FIXED)
-- ==============================================

-- Temporarily disable RLS to create default items for existing projects
ALTER TABLE punchlist DISABLE ROW LEVEL SECURITY;

-- Add default punchlist items to existing projects that don't have any
DO $$
DECLARE
    project_record RECORD;
BEGIN
    FOR project_record IN 
        SELECT p.id 
        FROM projects p 
        LEFT JOIN punchlist pl ON pl.project_id = p.id 
        WHERE pl.id IS NULL
    LOOP
        PERFORM create_default_punchlist_items(project_record.id);
    END LOOP;
    
    RAISE NOTICE 'Added default punchlist items to existing projects';
END $$;

-- Re-enable RLS
ALTER TABLE punchlist ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 5. VERIFICATION
-- ==============================================

-- Check how many punchlist items we have now
SELECT 
    COUNT(*) as total_punchlist_items,
    COUNT(DISTINCT project_id) as projects_with_punchlist
FROM punchlist;

-- Show sample punchlist items
SELECT 
    p.id as project_id,
    p.title as project_title,
    pl.message,
    pl.author_id,
    pl.company_name
FROM punchlist pl
JOIN projects p ON p.id = pl.project_id
ORDER BY pl.project_id, pl.id
LIMIT 10;
