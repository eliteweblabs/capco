-- Create storage bucket for project files
BEGIN;

-- First check if bucket exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM storage.buckets 
    WHERE id = 'project-media'
  ) THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name)
    VALUES (
      'project-media',  -- bucket id
      'Project Media'   -- display name
    );
    
    RAISE NOTICE 'Created project-media bucket';
  ELSE
    RAISE NOTICE 'Bucket project-media already exists';
  END IF;
END $$;

-- Set up RLS policies for the bucket
DO $$
BEGIN
  -- Drop existing policies if any
  DROP POLICY IF EXISTS "Allow authenticated users to view media" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload media" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to update their own media" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to delete their own media" ON storage.objects;

  -- Create new policies
  -- View policy
  CREATE POLICY "Allow authenticated users to view media"
    ON storage.objects FOR SELECT
    USING (
      -- Must be authenticated
      auth.role() = 'authenticated' 
      AND 
      -- Must be in our project-media bucket
      bucket_id = 'project-media'
    );

  -- Upload policy
  CREATE POLICY "Allow authenticated users to upload media"
    ON storage.objects FOR INSERT
    WITH CHECK (
      -- Must be authenticated
      auth.role() = 'authenticated'
      AND
      -- Must be in our project-media bucket
      bucket_id = 'project-media'
      AND
      -- File size limit: 50MB
      (octet_length(content) / 1024 / 1024) <= 50
    );

  -- Update policy
  CREATE POLICY "Allow users to update their own media"
    ON storage.objects FOR UPDATE
    USING (
      -- Must be authenticated
      auth.role() = 'authenticated'
      AND
      -- Must be in our project-media bucket
      bucket_id = 'project-media'
      AND
      -- Must be owner or admin
      (
        owner = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('Admin', 'Staff')
        )
      )
    );

  -- Delete policy
  CREATE POLICY "Allow users to delete their own media"
    ON storage.objects FOR DELETE
    USING (
      -- Must be authenticated
      auth.role() = 'authenticated'
      AND
      -- Must be in our project-media bucket
      bucket_id = 'project-media'
      AND
      -- Must be owner or admin
      (
        owner = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('Admin', 'Staff')
        )
      )
    );

  RAISE NOTICE 'Created storage bucket policies';
END $$;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verify setup
DO $$
BEGIN
  -- Check bucket exists
  IF NOT EXISTS (
    SELECT 1 
    FROM storage.buckets 
    WHERE id = 'project-media'
  ) THEN
    RAISE EXCEPTION 'Bucket creation failed';
  END IF;

  -- Check policies exist
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname IN (
      'Allow authenticated users to view media',
      'Allow authenticated users to upload media',
      'Allow users to update their own media',
      'Allow users to delete their own media'
    )
  ) THEN
    RAISE EXCEPTION 'Policy creation failed';
  END IF;

  RAISE NOTICE 'Storage bucket setup verified successfully';
END $$;

COMMIT;
