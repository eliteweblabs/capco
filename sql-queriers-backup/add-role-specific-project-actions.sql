-- Add Role-Specific Project Action Columns
-- This script adds client_project_action and admin_project_action columns to project_statuses table

-- ==============================================
-- 1. ADD NEW COLUMNS
-- ==============================================

-- Add client_project_action column
ALTER TABLE project_statuses 
ADD COLUMN IF NOT EXISTS client_project_action TEXT;

-- Add admin_project_action column  
ALTER TABLE project_statuses 
ADD COLUMN IF NOT EXISTS admin_project_action TEXT;

-- ==============================================
-- 2. ADD COMMENTS
-- ==============================================

COMMENT ON COLUMN project_statuses.client_project_action IS 'Project action message shown to clients when project reaches this status';
COMMENT ON COLUMN project_statuses.admin_project_action IS 'Project action message shown to admins/staff when project reaches this status';

-- ==============================================
-- 3. MIGRATE EXISTING DATA (OPTIONAL)
-- ==============================================

-- If you want to copy existing project_action values to both new columns:
-- UPDATE project_statuses 
-- SET 
--   client_project_action = project_action,
--   admin_project_action = project_action
-- WHERE project_action IS NOT NULL AND project_action != '';

-- ==============================================
-- 4. VERIFICATION
-- ==============================================

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_statuses' 
AND column_name IN ('client_project_action', 'admin_project_action')
ORDER BY column_name;

-- Show current project_statuses structure
SELECT 
    status_code,
    admin_status_name,
    client_status_name,
    project_action,
    client_project_action,
    admin_project_action
FROM project_statuses 
ORDER BY status_code
LIMIT 5;
