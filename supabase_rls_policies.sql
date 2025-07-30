-- Enable RLS on tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Projects table policies
-- Allow users to insert their own projects
CREATE POLICY "Users can insert their own projects" ON projects
FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Allow users to view their own projects
CREATE POLICY "Users can view their own projects" ON projects
FOR SELECT USING (auth.uid() = author_id);

-- Allow users to update their own projects
CREATE POLICY "Users can update their own projects" ON projects
FOR UPDATE USING (auth.uid() = author_id);

-- Allow users to delete their own projects
CREATE POLICY "Users can delete their own projects" ON projects
FOR DELETE USING (auth.uid() = author_id);

-- Files table policies
-- Allow users to insert files for their own projects
CREATE POLICY "Users can insert files for their own projects" ON files
FOR INSERT WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = files.project_id AND author_id = auth.uid()
  )
);

-- Allow users to view files for their own projects
CREATE POLICY "Users can view files for their own projects" ON files
FOR SELECT USING (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = files.project_id AND author_id = auth.uid()
  )
);

-- Allow users to update files for their own projects
CREATE POLICY "Users can update files for their own projects" ON files
FOR UPDATE USING (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = files.project_id AND author_id = auth.uid()
  )
);

-- Allow users to delete files for their own projects
CREATE POLICY "Users can delete files for their own projects" ON files
FOR DELETE USING (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = files.project_id AND author_id = auth.uid()
  )
); 