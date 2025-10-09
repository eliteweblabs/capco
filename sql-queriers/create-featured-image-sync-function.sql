-- Function to sync featured image data when featured_image_id changes
-- This denormalizes the featured image data into the projects table for performance

-- First, add the featured_image_data column if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS featured_image_data JSONB;

-- Create the function to sync featured image data
CREATE OR REPLACE FUNCTION sync_featured_image_data()
RETURNS TRIGGER AS $$
BEGIN
    -- If featured_image_id is being set to a value
    IF NEW.featured_image_id IS NOT NULL THEN
        -- Get the file data and populate featured_image_data
        SELECT jsonb_build_object(
            'id', f.id,
            'file_name', f.file_name,
            'file_path', f.file_path,
            'file_type', f.file_type,
            'file_size', f.file_size,
            'bucket_name', f.bucket_name,
            'uploaded_at', f.uploaded_at,
            'title', f.title,
            'comments', f.comments,
            'publicUrl', CASE 
                WHEN f.bucket_name IS NOT NULL AND f.file_path IS NOT NULL 
                THEN concat('https://qudlxlryegnainztkrtk.supabase.co/storage/v1/object/public/', f.bucket_name, '/', f.file_path)
                ELSE NULL 
            END
        )
        INTO NEW.featured_image_data
        FROM files f 
        WHERE f.id = NEW.featured_image_id;
        
        -- If no file found, set to null
        IF NEW.featured_image_data IS NULL THEN
            NEW.featured_image_data = NULL;
        END IF;
        
    -- If featured_image_id is being set to NULL, clear the data
    ELSIF NEW.featured_image_id IS NULL THEN
        NEW.featured_image_data = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync when featured_image_id changes
DROP TRIGGER IF EXISTS trigger_sync_featured_image_data ON projects;
CREATE TRIGGER trigger_sync_featured_image_data
    BEFORE UPDATE OF featured_image_id ON projects
    FOR EACH ROW
    WHEN (OLD.featured_image_id IS DISTINCT FROM NEW.featured_image_id)
    EXECUTE FUNCTION sync_featured_image_data();

-- Also create trigger for INSERT operations (in case featured_image_id is set during insert)
DROP TRIGGER IF EXISTS trigger_sync_featured_image_data_insert ON projects;
CREATE TRIGGER trigger_sync_featured_image_data_insert
    BEFORE INSERT ON projects
    FOR EACH ROW
    WHEN (NEW.featured_image_id IS NOT NULL)
    EXECUTE FUNCTION sync_featured_image_data();

-- Backfill existing projects with featured_image_id set
UPDATE projects 
SET featured_image_data = (
    SELECT jsonb_build_object(
        'id', f.id,
        'file_name', f.file_name,
        'file_path', f.file_path,
        'file_type', f.file_type,
        'file_size', f.file_size,
        'bucket_name', f.bucket_name,
        'uploaded_at', f.uploaded_at,
        'title', f.title,
        'comments', f.comments,
        'publicUrl', CASE 
            WHEN f.bucket_name IS NOT NULL AND f.file_path IS NOT NULL 
            THEN concat('https://qudlxlryegnainztkrtk.supabase.co/storage/v1/object/public/', f.bucket_name, '/', f.file_path)
            ELSE NULL 
        END
    )
    FROM files f 
    WHERE f.id = projects.featured_image_id
)
WHERE featured_image_id IS NOT NULL 
AND featured_image_data IS NULL;

-- Create index on featured_image_id for better performance
CREATE INDEX IF NOT EXISTS idx_projects_featured_image_id ON projects(featured_image_id);

-- Optional: Create a function to manually refresh featured image data for a specific project
CREATE OR REPLACE FUNCTION refresh_project_featured_image_data(project_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    UPDATE projects 
    SET featured_image_data = (
        SELECT jsonb_build_object(
            'id', f.id,
            'file_name', f.file_name,
            'file_path', f.file_path,
            'file_type', f.file_type,
            'file_size', f.file_size,
            'bucket_name', f.bucket_name,
            'uploaded_at', f.uploaded_at,
            'title', f.title,
            'comments', f.comments,
            'publicUrl', CASE 
                WHEN f.bucket_name IS NOT NULL AND f.file_path IS NOT NULL 
                THEN concat('https://qudlxlryegnainztkrtk.supabase.co/storage/v1/object/public/', f.bucket_name, '/', f.file_path)
                ELSE NULL 
            END
        )
        FROM files f 
        WHERE f.id = projects.featured_image_id
    )
    WHERE projects.id = project_id;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT refresh_project_featured_image_data(123);

COMMENT ON FUNCTION sync_featured_image_data() IS 'Automatically syncs featured image data when featured_image_id changes';
COMMENT ON FUNCTION refresh_project_featured_image_data(INTEGER) IS 'Manually refreshes featured image data for a specific project';
COMMENT ON COLUMN projects.featured_image_data IS 'Denormalized featured image data for performance - automatically synced from files table';
