-- Add foreign key relationships for files table
BEGIN;

-- Disable RLS temporarily to avoid conflicts
ALTER TABLE files DISABLE ROW LEVEL SECURITY;

-- First, check if all projectIds exist in projects table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM files f
    LEFT JOIN projects p ON f."projectId"::integer = p.id
    WHERE p.id IS NULL AND f."projectId" IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Some files reference non-existent projects. Please fix data inconsistencies first.';
  END IF;
END $$;

-- First, drop existing policies that depend on projectId
DROP POLICY IF EXISTS "Clients can view own files" ON files;
DROP POLICY IF EXISTS "Users can view files they have access to" ON files;
DROP POLICY IF EXISTS "Users can upload files to their projects" ON files;
DROP POLICY IF EXISTS "Users can update their own files" ON files;
DROP POLICY IF EXISTS "Users can delete their own files" ON files;

-- Now we can safely alter the column type
ALTER TABLE files 
  ALTER COLUMN "projectId" TYPE integer USING "projectId"::integer;

-- Add foreign key constraint for projects relationship
ALTER TABLE files
  ADD CONSTRAINT fk_files_projects
  FOREIGN KEY ("projectId")
  REFERENCES projects(id)
  ON DELETE CASCADE;

-- Ensure authorId is UUID type
ALTER TABLE files
  ALTER COLUMN "authorId" TYPE uuid USING "authorId"::uuid;

-- Add foreign key constraint for profiles relationship
ALTER TABLE files
  ADD CONSTRAINT fk_files_profiles
  FOREIGN KEY ("authorId")
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_files_projectid ON files("projectId");
CREATE INDEX IF NOT EXISTS idx_files_authorid ON files("authorId");

-- Add RLS policies to ensure proper access control
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Policy for viewing files
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

-- Policy for inserting files
CREATE POLICY "Users can upload files to their projects" ON files
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

-- Policy for updating files
CREATE POLICY "Users can update their own files" ON files
  FOR UPDATE USING (
    -- Admin/Staff can update any file
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'Staff')
    OR
    -- Users can update their own files
    "authorId" = auth.uid()
  );

-- Policy for deleting files
CREATE POLICY "Users can delete their own files" ON files
  FOR DELETE USING (
    -- Admin/Staff can delete any file
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'Staff')
    OR
    -- Users can delete their own files if project status allows
    ("authorId" = auth.uid() AND
     (SELECT status FROM projects WHERE id = "projectId") <= 10)
  );

-- Re-enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Verify the changes
DO $$
BEGIN
  -- Check if foreign keys were created
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_files_projects'
  ) THEN
    RAISE EXCEPTION 'Foreign key constraint was not created successfully';
  END IF;

  -- Check if policies were created
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'files' 
    AND policyname = 'Users can view files they have access to'
  ) THEN
    RAISE EXCEPTION 'Policies were not created successfully';
  END IF;
END $$;

COMMIT;
