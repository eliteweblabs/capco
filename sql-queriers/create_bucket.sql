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
    INSERT INTO storage.buckets (id, name, public)
    VALUES (
      'project-media',  -- bucket id
      'Project Media',  -- display name
      false            -- not public by default, we'll use RLS
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
  DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

  -- Create new policies
  
  -- View/Download policy
  CREATE POLICY "Give users access to own folder"
    ON storage.objects FOR SELECT
    USING (
      -- Must be authenticated
      auth.role() = 'authenticated' 
      AND 
      -- Must be in our project-media bucket
      bucket_id = 'project-media'
      AND
      (
        -- Admin/Staff can access all files
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND role IN ('Admin', 'Staff')
        )
        OR
        -- Users can access files from their projects
        (storage.foldername(name))[1] IN (
          SELECT id::text 
          FROM public.projects
          WHERE "authorId" = auth.uid()
          OR "assignedToId" = auth.uid()
        )
      )
    );

  -- Upload policy
  CREATE POLICY "Allow authenticated uploads"
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
      AND
      (
        -- Admin/Staff can upload anywhere
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND role IN ('Admin', 'Staff')
        )
        OR
        -- Users can only upload to their project folders
        (storage.foldername(name))[1] IN (
          SELECT id::text 
          FROM public.projects
          WHERE "authorId" = auth.uid()
          OR "assignedToId" = auth.uid()
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
      'Give users access to own folder',
      'Allow authenticated uploads'
    )
  ) THEN
    RAISE EXCEPTION 'Policy creation failed';
  END IF;

  RAISE NOTICE 'Storage bucket setup verified successfully';
END $$;

COMMIT;
