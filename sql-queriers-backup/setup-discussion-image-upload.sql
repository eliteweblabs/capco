-- Setup for Discussion Image Upload System
-- This script creates all necessary database tables, columns, and storage setup

-- ==============================================
-- 1. CREATE STORAGE BUCKET
-- ==============================================

-- Create the main project documents bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents', 
  false,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/acad',
    'application/x-autocad',
    'application/autocad',
    'application/x-apple-diskimage',
    'application/x-dmg',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'audio/mp3',
    'audio/wav',
    'audio/m4a'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 2. CREATE FILES TABLE (if it doesn't exist)
-- ==============================================

CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  title TEXT,
  comments TEXT,
  status TEXT DEFAULT 'active',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. CREATE DISCUSSIONS TABLE (if it doesn't exist)
-- ==============================================

CREATE TABLE IF NOT EXISTS discussion (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  internal BOOLEAN DEFAULT false,
  sms_alert BOOLEAN DEFAULT false,
  parent_id INTEGER REFERENCES discussion(id) ON DELETE CASCADE,
  image_paths TEXT[] DEFAULT '{}',
  mark_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 4. ADD MISSING COLUMNS TO EXISTING TABLES
-- ==============================================

-- Add email column to profiles table (if it doesn't exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add phone column to profiles table (if it doesn't exist)  
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add sms_alerts column to profiles table (if it doesn't exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS sms_alerts BOOLEAN DEFAULT false;

-- Add mobile_carrier column to profiles table (if it doesn't exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS mobile_carrier TEXT;

-- ==============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Files table indexes
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_author_id ON files(author_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at);

-- Discussion table indexes
CREATE INDEX IF NOT EXISTS idx_discussion_project_id ON discussion(project_id);
CREATE INDEX IF NOT EXISTS idx_discussion_author_id ON discussion(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_parent_id ON discussion(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussion_created_at ON discussion(created_at);
CREATE INDEX IF NOT EXISTS idx_discussion_internal ON discussion(internal);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ==============================================
-- 6. SETUP ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion ENABLE ROW LEVEL SECURITY;

-- Files table policies
DROP POLICY IF EXISTS "Users can view files for their projects" ON files;
CREATE POLICY "Users can view files for their projects" ON files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = files.project_id 
      AND (
        p.author_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM profiles pr 
          WHERE pr.id = auth.uid() 
          AND pr.role IN ('Admin', 'Staff')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert files for their projects" ON files;
CREATE POLICY "Users can insert files for their projects" ON files
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = files.project_id 
      AND (
        p.author_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM profiles pr 
          WHERE pr.id = auth.uid() 
          AND pr.role IN ('Admin', 'Staff')
        )
      )
    )
  );

-- Discussion table policies
DROP POLICY IF EXISTS "Users can view discussions for their projects" ON discussion;
CREATE POLICY "Users can view discussions for their projects" ON discussion
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = discussion.project_id 
      AND (
        p.author_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM profiles pr 
          WHERE pr.id = auth.uid() 
          AND pr.role IN ('Admin', 'Staff')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert discussions for their projects" ON discussion;
CREATE POLICY "Users can insert discussions for their projects" ON discussion
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = discussion.project_id 
      AND (
        p.author_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM profiles pr 
          WHERE pr.id = auth.uid() 
          AND pr.role IN ('Admin', 'Staff')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own discussions" ON discussion;
CREATE POLICY "Users can update their own discussions" ON discussion
  FOR UPDATE USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles pr 
      WHERE pr.id = auth.uid() 
      AND pr.role IN ('Admin', 'Staff')
    )
  );

-- ==============================================
-- 7. STORAGE BUCKET POLICIES
-- ==============================================

-- Storage bucket policies for project-documents
DROP POLICY IF EXISTS "Users can view files in project-documents" ON storage.objects;
CREATE POLICY "Users can view files in project-documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-documents' AND
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = CAST(split_part(name, '/', 3) AS INTEGER)
      AND (
        p.author_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM profiles pr 
          WHERE pr.id = auth.uid() 
          AND pr.role IN ('Admin', 'Staff')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can upload files to project-documents" ON storage.objects;
CREATE POLICY "Users can upload files to project-documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-documents' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = CAST(split_part(name, '/', 3) AS INTEGER)
      AND (
        p.author_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM profiles pr 
          WHERE pr.id = auth.uid() 
          AND pr.role IN ('Admin', 'Staff')
        )
      )
    )
  );

-- ==============================================
-- 8. CREATE TRIGGERS FOR UPDATED_AT
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_files_updated_at ON files;
CREATE TRIGGER update_files_updated_at 
  BEFORE UPDATE ON files 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discussions_updated_at ON discussion;
CREATE TRIGGER update_discussions_updated_at 
  BEFORE UPDATE ON discussion 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 9. VERIFICATION QUERIES
-- ==============================================

-- Check if everything was created successfully
SELECT 'Storage Bucket' as component, 
       CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-documents') 
            THEN '✅ Created' 
            ELSE '❌ Missing' 
       END as status;

SELECT 'Files Table' as component,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files') 
            THEN '✅ Created' 
            ELSE '❌ Missing' 
       END as status;

SELECT 'Discussions Table' as component,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discussions') 
            THEN '✅ Created' 
            ELSE '❌ Missing' 
       END as status;

SELECT 'Profiles Email Column' as component,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') 
            THEN '✅ Created' 
            ELSE '❌ Missing' 
       END as status;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

SELECT '🎉 Setup Complete!' as message,
       'All tables, columns, indexes, and policies have been created for discussion image uploads.' as description;
