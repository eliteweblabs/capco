-- Add admin_status_tab column to project_statuses table
-- This script copies all data from client_status_tab to a new admin_status_tab column

BEGIN;

-- Step 1: Add the new admin_status_tab column only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_statuses' 
        AND column_name = 'admin_status_tab'
    ) THEN
        ALTER TABLE project_statuses ADD COLUMN admin_status_tab VARCHAR(50);
        RAISE NOTICE 'Added admin_status_tab column';
    ELSE
        RAISE NOTICE 'admin_status_tab column already exists';
    END IF;
END $$;

-- Step 2: Copy all existing client_status_tab values to admin_status_tab
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_statuses' 
        AND column_name = 'client_status_tab'
    ) THEN
        UPDATE project_statuses 
        SET admin_status_tab = client_status_tab 
        WHERE client_status_tab IS NOT NULL;
        RAISE NOTICE 'Copied client_status_tab values to admin_status_tab';
    ELSE
        RAISE NOTICE 'client_status_tab column does not exist, skipping copy';
    END IF;
END $$;

-- Step 3: Add a comment to document the column
COMMENT ON COLUMN project_statuses.admin_status_tab IS 'Specifies which tab the admin should be directed to for this status (copied from client_status_tab)';

-- Step 4: Verify the changes
SELECT 
    id,
    status_code,
    status_name,
    client_status_tab,
    admin_status_tab,
    CASE 
        WHEN client_status_tab = admin_status_tab THEN '✅ Match'
        WHEN client_status_tab IS NULL AND admin_status_tab IS NULL THEN '✅ Both NULL'
        ELSE '❌ Mismatch'
    END as tab_match
FROM project_statuses 
WHERE client_status_tab IS NOT NULL OR admin_status_tab IS NOT NULL
ORDER BY status_code;

-- Step 5: Show summary of copied data
SELECT 
    COUNT(*) as total_rows,
    COUNT(client_status_tab) as client_tab_count,
    COUNT(admin_status_tab) as admin_tab_count,
    COUNT(CASE WHEN client_status_tab = admin_status_tab THEN 1 END) as matching_rows
FROM project_statuses;

COMMIT;

-- Optional: If you want to rollback, use this:
-- BEGIN;
-- ALTER TABLE project_statuses DROP COLUMN admin_status_tab;
-- COMMIT;
