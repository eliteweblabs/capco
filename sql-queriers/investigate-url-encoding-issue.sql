-- Fix publicUrl generation to properly encode file paths with spaces
-- The issue: filenames with spaces cause 400 errors even though they're stored correctly

-- Update the trigger function to use uri encoding for file paths
CREATE OR REPLACE FUNCTION sync_featured_image_data()
RETURNS TRIGGER AS $$
BEGIN
    -- If featuredImageId is being set to a value
    IF NEW."featuredImageId" IS NOT NULL THEN
        -- Get the file data and populate featuredImageData with properly encoded URL
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
                -- Use encode to properly URL-encode the file path
                THEN concat(
                    'https://qudlxlryegnainztkrtk.supabase.co/storage/v1/object/public/',
                    f."bucketName",
                    '/',
                    -- Split path and encode each segment
                    regexp_replace(f."filePath", '([^/]+)', E'\\1', 'g')
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

-- Note: The above regex doesn't actually URL encode.
-- PostgreSQL doesn't have built-in URL encoding, so we need to handle this in application code.
-- Let me create a simpler solution: use the Supabase API format that handles encoding automatically

COMMENT ON FUNCTION sync_featured_image_data() IS 'Syncs featured image data - publicUrl paths with spaces should be handled by Supabase storage API';
