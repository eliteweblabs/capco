-- Ensure the featured image trigger is complete with all necessary fields
-- This fixes any incomplete triggers that only store 4 fields (id, fileName, filePath, uploadedAt)
-- The complete version includes: bucketName, fileType, fileSize, title, comments, and publicUrl

-- Drop existing incomplete triggers/functions
DROP TRIGGER IF EXISTS sync_featured_image_on_file_update ON files;
DROP TRIGGER IF EXISTS sync_featured_image_on_file_insert ON files;
DROP FUNCTION IF EXISTS sync_featured_image_data() CASCADE;

-- Create the COMPLETE function to sync featured image data
-- This runs on the PROJECTS table when featuredImageId changes
CREATE OR REPLACE FUNCTION sync_featured_image_data()
RETURNS TRIGGER AS $$
BEGIN
    -- If featuredImageId is being set to a value
    IF NEW."featuredImageId" IS NOT NULL THEN
        -- Get the file data and populate featuredImageData
        SELECT jsonb_build_object(
            'id', f.id,
            'fileName', f."fileName",
            'filePath', f."filePath",
            'fileType', f."fileType",
            'fileSize', f."fileSize",
            'bucketName', f."bucketName",
            'uploadedAt', f."uploadedAt",
            'title', f.title,
            'comments', f.comments,
            'publicUrl', CASE 
                WHEN f."bucketName" IS NOT NULL AND f."filePath" IS NOT NULL 
                THEN concat('https://qudlxlryegnainztkrtk.supabase.co/storage/v1/object/public/', f."bucketName", '/', f."filePath")
                ELSE NULL 
            END
        )
        INTO NEW."featuredImageData"
        FROM files f 
        WHERE f.id = NEW."featuredImageId"::integer;
        
        -- If no file found, set to null
        IF NEW."featuredImageData" IS NULL THEN
            NEW."featuredImageData" = NULL;
        END IF;
        
    -- If featuredImageId is being set to NULL, clear the data
    ELSIF NEW."featuredImageId" IS NULL THEN
        NEW."featuredImageData" = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync when featuredImageId changes (PROJECTS table)
DROP TRIGGER IF EXISTS trigger_sync_featured_image_data ON projects;
CREATE TRIGGER trigger_sync_featured_image_data
    BEFORE UPDATE OF "featuredImageId" ON projects
    FOR EACH ROW
    WHEN (OLD."featuredImageId" IS DISTINCT FROM NEW."featuredImageId")
    EXECUTE FUNCTION sync_featured_image_data();

-- Also create trigger for INSERT operations (in case featuredImageId is set during insert)
DROP TRIGGER IF EXISTS trigger_sync_featured_image_data_insert ON projects;
CREATE TRIGGER trigger_sync_featured_image_data_insert
    BEFORE INSERT ON projects
    FOR EACH ROW
    WHEN (NEW."featuredImageId" IS NOT NULL)
    EXECUTE FUNCTION sync_featured_image_data();

-- Backfill existing projects with featuredImageId set but incomplete/missing featuredImageData
UPDATE projects 
SET "featuredImageData" = (
    SELECT jsonb_build_object(
        'id', f.id,
        'fileName', f."fileName",
        'filePath', f."filePath",
        'fileType', f."fileType",
        'fileSize', f."fileSize",
        'bucketName', f."bucketName",
        'uploadedAt', f."uploadedAt",
        'title', f.title,
        'comments', f.comments,
        'publicUrl', CASE 
            WHEN f."bucketName" IS NOT NULL AND f."filePath" IS NOT NULL 
            THEN concat('https://qudlxlryegnainztkrtk.supabase.co/storage/v1/object/public/', f."bucketName", '/', f."filePath")
            ELSE NULL 
        END
    )
    FROM files f 
    WHERE f.id = projects."featuredImageId"::integer
)
WHERE "featuredImageId" IS NOT NULL 
AND (
    "featuredImageData" IS NULL 
    OR NOT ("featuredImageData" ? 'bucketName')  -- Check if bucketName key exists
);

-- Create index on featuredImageId for better performance
CREATE INDEX IF NOT EXISTS idx_projects_featured_image_id ON projects("featuredImageId");

-- Optional: Create a function to manually refresh featured image data for a specific project
CREATE OR REPLACE FUNCTION refresh_project_featured_image_data(project_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    UPDATE projects 
    SET "featuredImageData" = (
        SELECT jsonb_build_object(
            'id', f.id,
            'fileName', f."fileName",
            'filePath', f."filePath",
            'fileType', f."fileType",
            'fileSize', f."fileSize",
            'bucketName', f."bucketName",
            'uploadedAt', f."uploadedAt",
            'title', f.title,
            'comments', f.comments,
            'publicUrl', CASE 
                WHEN f."bucketName" IS NOT NULL AND f."filePath" IS NOT NULL 
                THEN concat('https://qudlxlryegnainztkrtk.supabase.co/storage/v1/object/public/', f."bucketName", '/', f."filePath")
                ELSE NULL 
            END
        )
        FROM files f 
        WHERE f.id = projects."featuredImageId"::integer
    )
    WHERE projects.id = project_id;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT refresh_project_featured_image_data(123);

COMMENT ON FUNCTION sync_featured_image_data() IS 'Automatically syncs featured image data when featuredImageId changes - includes all file metadata and publicUrl';
COMMENT ON FUNCTION refresh_project_featured_image_data(INTEGER) IS 'Manually refreshes featured image data for a specific project';
COMMENT ON COLUMN projects."featuredImageData" IS 'Denormalized featured image data with publicUrl for performance - automatically synced from files table';
