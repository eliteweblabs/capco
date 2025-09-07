-- SQL script to update project_statuses table email columns
-- This script:
-- 1. Renames email_content to client_email_content
-- 2. Duplicates the values to create admin_email_content (if it doesn't exist)

BEGIN;

-- Step 1: Add the new admin_email_content column only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_statuses' 
        AND column_name = 'admin_email_content'
    ) THEN
        ALTER TABLE project_statuses ADD COLUMN admin_email_content TEXT;
        RAISE NOTICE 'Added admin_email_content column';
    ELSE
        RAISE NOTICE 'admin_email_content column already exists';
    END IF;
END $$;

-- Step 2: Copy all existing email_content values to admin_email_content (if email_content exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_statuses' 
        AND column_name = 'email_content'
    ) THEN
        UPDATE project_statuses 
        SET admin_email_content = email_content 
        WHERE email_content IS NOT NULL;
        RAISE NOTICE 'Copied email_content values to admin_email_content';
    ELSE
        RAISE NOTICE 'email_content column does not exist, skipping copy';
    END IF;
END $$;

-- Step 3: Rename email_content to client_email_content (if email_content exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_statuses' 
        AND column_name = 'email_content'
    ) THEN
        ALTER TABLE project_statuses RENAME COLUMN email_content TO client_email_content;
        RAISE NOTICE 'Renamed email_content to client_email_content';
    ELSE
        RAISE NOTICE 'email_content column does not exist, skipping rename';
    END IF;
END $$;

-- Step 4: Verify the changes
SELECT 
    id,
    status_name,
    client_email_content,
    admin_email_content,
    CASE 
        WHEN client_email_content = admin_email_content THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as content_match
FROM project_statuses 
WHERE client_email_content IS NOT NULL OR admin_email_content IS NOT NULL
ORDER BY id;

COMMIT;

-- Optional: If you want to rollback, use this:
-- BEGIN;
-- ALTER TABLE project_statuses RENAME COLUMN client_email_content TO email_content;
-- ALTER TABLE project_statuses DROP COLUMN admin_email_content;
-- COMMIT;
