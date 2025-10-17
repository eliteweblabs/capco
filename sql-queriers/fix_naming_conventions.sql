-- Migration to fix naming conventions
--
-- Note: This script only fixes our application-specific tables.
-- Cal.com integration tables are intentionally left in snake_case:
--   - bookings (e.g., user_id, event_type_id)
--   - event_types (e.g., time_zone, week_start)
--   - schedules (e.g., user_id, time_zone)
--   - team_members (e.g., team_id, user_id)
--   - teams (e.g., hide_branding, parent_id)
--   - users (e.g., email_verified, time_zone)
--   - webhooks (e.g., user_id, event_triggers)
BEGIN;

-- 1. First backup any tables we're going to modify
-- Create backup of files table
CREATE TABLE IF NOT EXISTS files_backup_20251016 AS SELECT * FROM files;

-- 2. Temporarily disable RLS
ALTER TABLE files DISABLE ROW LEVEL SECURITY;

-- 3. Fix foreign key constraints in files table
DO $$
BEGIN
  -- First, drop existing constraints that might interfere
  RAISE NOTICE 'Dropping existing constraints...';
  
  ALTER TABLE files 
    DROP CONSTRAINT IF EXISTS files_checkedoutby_fkey,
    DROP CONSTRAINT IF EXISTS files_assignedto_fkey,
    DROP CONSTRAINT IF EXISTS files_checkedOutBy_fkey,
    DROP CONSTRAINT IF EXISTS files_assignedTo_fkey,
    DROP CONSTRAINT IF EXISTS files_projectId_fkey,
    DROP CONSTRAINT IF EXISTS files_authorId_fkey;

  -- Add foreign key constraints with camelCase names
  RAISE NOTICE 'Adding foreign key constraints...';
  
  -- Project relationship
  ALTER TABLE files
    ADD CONSTRAINT files_projectId_fkey 
    FOREIGN KEY ("projectId") 
    REFERENCES projects(id)
    ON DELETE CASCADE;

  -- Author relationship
  ALTER TABLE files
    ADD CONSTRAINT files_authorId_fkey 
    FOREIGN KEY ("authorId") 
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

  -- CheckedOut relationship
  ALTER TABLE files
    ADD CONSTRAINT files_checkedOutBy_fkey 
    FOREIGN KEY ("checkedOutBy") 
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

  -- AssignedTo relationship
  ALTER TABLE files
    ADD CONSTRAINT files_assignedTo_fkey 
    FOREIGN KEY ("assignedTo") 
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

  RAISE NOTICE 'Foreign key constraints added successfully';
END $$;

-- 4. Update RLS policies
DO $$
BEGIN
    -- Drop existing policies
    RAISE NOTICE 'Dropping existing policies...';
    DROP POLICY IF EXISTS "Users can view files they have access to" ON files;
    DROP POLICY IF EXISTS "Users can insert files for their projects" ON files;
    DROP POLICY IF EXISTS "Users can update their own files" ON files;
    DROP POLICY IF EXISTS "Users can delete their own files" ON files;

    -- Recreate policies with camelCase columns
    RAISE NOTICE 'Creating new policies...';
    
    -- View policy
    CREATE POLICY "Users can view files they have access to" ON files
        FOR SELECT USING (
            -- Admin/Staff can see all files
            (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'Staff')
            OR
            -- Users can see files from their own projects
            "projectId" IN (
                SELECT id FROM projects 
                WHERE "authorId" = auth.uid()
                OR "assignedToId" = auth.uid()
            )
        );

    -- Insert policy
    CREATE POLICY "Users can insert files for their projects" ON files
        FOR INSERT WITH CHECK (
            -- Admin/Staff can upload anywhere
            (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'Staff')
            OR
            -- Users can upload to their own projects
            "projectId" IN (
                SELECT id FROM projects 
                WHERE "authorId" = auth.uid()
                OR "assignedToId" = auth.uid()
            )
        );

    -- Update policy
    CREATE POLICY "Users can update their own files" ON files
        FOR UPDATE USING (
            -- Admin/Staff can update any file
            (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'Staff')
            OR
            -- Users can update their own files
            "authorId" = auth.uid()
        );

    -- Delete policy
    CREATE POLICY "Users can delete their own files" ON files
        FOR DELETE USING (
            -- Admin/Staff can delete any file
            (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'Staff')
            OR
            -- Users can delete their own files if project status allows
            ("authorId" = auth.uid() AND
             (SELECT status FROM projects WHERE id = "projectId") <= 10)
        );

    RAISE NOTICE 'Successfully recreated RLS policies';
END $$;

-- 5. Re-enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 6. Verify the changes
DO $$
DECLARE
  missing_constraints text[];
  existing_constraints text[];
BEGIN
  -- Check if all camelCase columns exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'files' 
    AND column_name IN ('checkedOutBy', 'checkedOutAt', 'assignedTo', 'assignedAt', 'checkoutNotes')
  ) THEN
    RAISE EXCEPTION 'Some camelCase columns are missing';
  END IF;

  -- Get list of existing constraints
  SELECT array_agg(constraint_name::text)
  INTO existing_constraints
  FROM information_schema.table_constraints 
  WHERE table_name = 'files' 
  AND constraint_type = 'FOREIGN KEY';

  -- Check each required constraint
  SELECT array_agg(c)
  INTO missing_constraints
  FROM (
    VALUES 
      ('files_projectId_fkey'),
      ('files_authorId_fkey'),
      ('files_checkedOutBy_fkey'),
      ('files_assignedTo_fkey')
  ) AS t(c)
  WHERE c NOT IN (
    SELECT constraint_name::text
    FROM information_schema.table_constraints 
    WHERE table_name = 'files' 
    AND constraint_type = 'FOREIGN KEY'
  );

  -- If any constraints are missing, show detailed error
  IF missing_constraints IS NOT NULL THEN
    RAISE EXCEPTION 'Foreign key constraints are missing. Missing: %. Existing: %', 
      missing_constraints,
      existing_constraints;
  END IF;

  -- Check if RLS policies exist
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'files' 
    AND policyname IN (
      'Users can view files they have access to',
      'Users can insert files for their projects',
      'Users can update their own files',
      'Users can delete their own files'
    )
  ) THEN
    RAISE EXCEPTION 'RLS policies are missing';
  END IF;
END $$;

-- If we get here, all checks passed
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
END $$;

-- Rollback script (if needed, copy everything between the --- lines):
-- -----------------------------------------------------------------------
-- BEGIN;
--
-- -- Restore files table from backup
-- DROP TABLE IF EXISTS files;
-- CREATE TABLE files AS SELECT * FROM files_backup_20251016;
--
-- -- Cleanup backup tables
-- DROP TABLE IF EXISTS files_backup_20251016;
--
-- COMMIT;
-- -----------------------------------------------------------------------

COMMIT;