-- Update the featured image sync function to remove public_url generation
-- The API will handle generating signed URLs dynamically

CREATE OR REPLACE FUNCTION sync_featured_image_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.featured_image_id IS NOT NULL AND NEW.featured_image_id != '' THEN
        -- Get file data and populate featured_image_data JSONB (without public_url)
        SELECT jsonb_build_object(
            'id', f.id,
            'file_name', f.file_name,
            'file_path', f.file_path,
            'file_type', f.file_type,
            'file_size', f.file_size,
            'bucket_name', f.bucket_name,
            'uploaded_at', f.uploaded_at,
            'title', f.title,
            'comments', f.comments
            -- Removed public_url - will be generated dynamically by API
        )
        INTO NEW.featured_image_data
        FROM files f 
        WHERE f.id::text = NEW.featured_image_id;
        
    ELSIF NEW.featured_image_id IS NULL OR NEW.featured_image_id = '' THEN
        NEW.featured_image_data = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the manual refresh function too
CREATE OR REPLACE FUNCTION refresh_project_featured_image_data(p_project_id INT)
RETURNS VOID AS $$
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
            'comments', f.comments
            -- Removed public_url - will be generated dynamically by API
        )
        FROM files f 
        WHERE f.id::text = projects.featured_image_id
    )
    WHERE id = p_project_id AND featured_image_id IS NOT NULL AND featured_image_id != '';
END;
$$ LANGUAGE plpgsql;

-- Backfill existing projects to remove public_url from featured_image_data
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
        'comments', f.comments
        -- Removed public_url - will be generated dynamically by API
    )
    FROM files f 
    WHERE f.id::text = projects.featured_image_id
)
WHERE featured_image_id IS NOT NULL 
AND featured_image_id != '';
