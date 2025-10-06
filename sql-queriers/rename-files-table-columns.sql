-- =====================================================
-- RENAME FILES TABLE COLUMNS TO CAMELCASE
-- =====================================================
-- This script renames all snake_case columns in the files table to camelCase
-- =====================================================

-- Rename files table columns from snake_case to camelCase
ALTER TABLE files RENAME COLUMN project_id TO "projectId";
ALTER TABLE files RENAME COLUMN author_id TO "authorId";
ALTER TABLE files RENAME COLUMN file_name TO "fileName";
ALTER TABLE files RENAME COLUMN file_path TO "filePath";
ALTER TABLE files RENAME COLUMN file_type TO "fileType";
ALTER TABLE files RENAME COLUMN file_size TO "fileSize";
ALTER TABLE files RENAME COLUMN uploaded_at TO "uploadedAt";
ALTER TABLE files RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE files RENAME COLUMN assigned_to TO "assignedTo";
ALTER TABLE files RENAME COLUMN assigned_at TO "assignedAt";
ALTER TABLE files RENAME COLUMN checked_out_by TO "checkedOutBy";
ALTER TABLE files RENAME COLUMN checked_out_at TO "checkedOutAt";
ALTER TABLE files RENAME COLUMN checkout_notes TO "checkoutNotes";
ALTER TABLE files RENAME COLUMN version_number TO "versionNumber";
ALTER TABLE files RENAME COLUMN previous_version_id TO "previousVersionId";
ALTER TABLE files RENAME COLUMN is_current_version TO "isCurrentVersion";
ALTER TABLE files RENAME COLUMN is_private TO "isPrivate";
ALTER TABLE files RENAME COLUMN bucket_name TO "bucketName";
ALTER TABLE files RENAME COLUMN target_location TO "targetLocation";
ALTER TABLE files RENAME COLUMN target_id TO "targetId";

-- Update the foreign key constraints to use the new column names
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_project_id_fkey;
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_assigned_to_fkey;
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_checked_out_by_fkey;

-- Recreate the foreign key constraints with the new column names
ALTER TABLE files ADD CONSTRAINT files_projectId_fkey FOREIGN KEY ("projectId") REFERENCES public.projects(id);
ALTER TABLE files ADD CONSTRAINT files_assignedTo_fkey FOREIGN KEY ("assignedTo") REFERENCES auth.users(id);
ALTER TABLE files ADD CONSTRAINT files_checkedOutBy_fkey FOREIGN KEY ("checkedOutBy") REFERENCES auth.users(id);

-- Update any indexes that might reference the old column names
DROP INDEX IF EXISTS idx_files_project_id;
DROP INDEX IF EXISTS idx_files_author_id;
DROP INDEX IF EXISTS idx_files_uploaded_at;

-- Recreate the indexes with the new column names
CREATE INDEX IF NOT EXISTS idx_files_projectId ON files("projectId");
CREATE INDEX IF NOT EXISTS idx_files_authorId ON files("authorId");
CREATE INDEX IF NOT EXISTS idx_files_uploadedAt ON files("uploadedAt");

-- Success message
SELECT 'Files table columns renamed to camelCase successfully!' as status;
