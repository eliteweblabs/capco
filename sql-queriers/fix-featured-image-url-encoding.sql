-- Fix featured image URL encoding to handle spaces and special characters in filenames
-- This updates the trigger to properly URL-encode the filePath when constructing publicUrl

-- Drop existing triggers/functions
DROP TRIGGER IF EXISTS trigger_sync_featured_image_data ON projects;
DROP TRIGGER IF EXISTS trigger_sync_featured_image_data_insert ON projects;
DROP FUNCTION IF EXISTS sync_featured_image_data() CASCADE;

-- Create the COMPLETE function to sync featured image data with proper URL encoding
CREATE OR REPLACE FUNCTION sync_featured_image_data()
RETURNS TRIGGER AS $$
DECLARE
    encoded_path TEXT;
BEGIN
    -- If featuredImageId is being set to a value
    IF NEW."featuredImageId" IS NOT NULL THEN
        -- Get the file data and populate featuredImageData
        -- Use a subquery to properly encode the path components
        SELECT 
            jsonb_build_object(
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
                    -- URL encode each path component (bucketName and filePath)
                    -- Split filePath on '/' and encode each part
                    THEN concat(
                        'https://qudlxlryegnainztkrtk.supabase.co/storage/v1/object/public/',
                        regexp_replace(f."bucketName", '([^a-zA-Z0-9\-_.])', E'%\\1', 'g'),
                        '/',
                        -- URL encode the entire path, handling all special characters
                        -- This regex replaces any non-URL-safe character with its percent-encoded equivalent
                        regexp_replace(
                            regexp_replace(f."filePath", ' ', '%20', 'g'),
                            '([^a-zA-Z0-9\-_.~/])', 
                            E'%\\1', 
                            'g'
                        )
                    )
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
CREATE TRIGGER trigger_sync_featured_image_data
    BEFORE UPDATE OF "featuredImageId" ON projects
    FOR EACH ROW
    WHEN (OLD."featuredImageId" IS DISTINCT FROM NEW."featuredImageId")
    EXECUTE FUNCTION sync_featured_image_data();

-- Also create trigger for INSERT operations
CREATE TRIGGER trigger_sync_featured_image_data_insert
    BEFORE INSERT ON projects
    FOR EACH ROW
    WHEN (NEW."featuredImageId" IS NOT NULL)
    EXECUTE FUNCTION sync_featured_image_data();

-- Backfill existing projects to fix URLs with spaces
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
            THEN concat(
                'https://qudlxlryegnainztkrtk.supabase.co/storage/v1/object/public/',
                regexp_replace(f."bucketName", '([^a-zA-Z0-9\-_.])', E'%\\1', 'g'),
                '/',
                regexp_replace(
                    regexp_replace(f."filePath", ' ', '%20', 'g'),
                    '([^a-zA-Z0-9\-_.~/])', 
                    E'%\\1', 
                    'g'
                )
            )
            ELSE NULL 
        END
    )
    FROM files f 
    WHERE f.id = projects."featuredImageId"::integer
)
WHERE "featuredImageId" IS NOT NULL;

-- Update the manual refresh function as well
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
                THEN concat(
                    'https://qudlxlryegnainztkrtk.supabase.co/storage/v1/object/public/',
                    regexp_replace(f."bucketName", '([^a-zA-Z0-9\-_.])', E'%\\1', 'g'),
                    '/',
                    regexp_replace(
                        regexp_replace(f."filePath", ' ', '%20', 'g'),
                        '([^a-zA-Z0-9\-_.~/])', 
                        E'%\\1', 
                        'g'
                    )
                )
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

COMMENT ON FUNCTION sync_featured_image_data() IS 'Automatically syncs featured image data with proper URL encoding when featuredImageId changes';
COMMENT ON FUNCTION refresh_project_featured_image_data(INTEGER) IS 'Manually refreshes featured image data for a specific project with proper URL encoding';
COMMENT ON COLUMN projects."featuredImageData" IS 'Denormalized featured image data with properly URL-encoded publicUrl';
