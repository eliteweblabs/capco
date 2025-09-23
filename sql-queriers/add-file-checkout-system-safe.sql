-- File Checkout and Assignment System - Safe Migration
-- Handles existing objects gracefully

-- Add checkout and assignment columns to files table (if not exist)
ALTER TABLE files ADD COLUMN IF NOT EXISTS checked_out_by UUID REFERENCES auth.users(id);
ALTER TABLE files ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE files ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS checkout_notes TEXT;

-- Create file_checkout_history table for tracking (if not exists)
CREATE TABLE IF NOT EXISTS file_checkout_history (
  id SERIAL PRIMARY KEY,
  file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(20) NOT NULL, -- 'checkout', 'checkin', 'assign', 'unassign'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_files_checked_out_by ON files(checked_out_by);
CREATE INDEX IF NOT EXISTS idx_files_assigned_to ON files(assigned_to);
CREATE INDEX IF NOT EXISTS idx_file_checkout_history_file_id ON file_checkout_history(file_id);
CREATE INDEX IF NOT EXISTS idx_file_checkout_history_user_id ON file_checkout_history(user_id);

-- Function to check out a file
CREATE OR REPLACE FUNCTION checkout_file(
  file_id_param INTEGER,
  user_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  file_record RECORD;
  result JSON;
BEGIN
  -- Get file details
  SELECT * INTO file_record FROM files WHERE id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  -- Check if file is already checked out
  IF file_record.checked_out_by IS NOT NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'File is already checked out',
      'checked_out_by', file_record.checked_out_by,
      'checked_out_at', file_record.checked_out_at
    );
  END IF;
  
  -- Update file status
  UPDATE files
  SET 
    checked_out_by = user_id_param,
    checked_out_at = NOW(),
    checkout_notes = notes_param,
    assigned_to = NULL, -- Clear assignment on checkout
    assigned_at = NULL
  WHERE id = file_id_param
  RETURNING * INTO file_record;
  
  -- Log history
  INSERT INTO file_checkout_history (file_id, user_id, action, notes)
  VALUES (file_id_param, user_id_param, 'checkout', notes_param);
  
  RETURN json_build_object('success', true, 'file', file_record);
END;
$$ LANGUAGE plpgsql;

-- Function to check in a file
CREATE OR REPLACE FUNCTION checkin_file(
  file_id_param INTEGER,
  user_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  file_record RECORD;
  result JSON;
BEGIN
  -- Get file details
  SELECT * INTO file_record FROM files WHERE id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  -- Check if file is checked out by this user
  IF file_record.checked_out_by != user_id_param THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'File is not checked out by you',
      'checked_out_by', file_record.checked_out_by
    );
  END IF;
  
  -- Update file status
  UPDATE files
  SET 
    checked_out_by = NULL,
    checked_out_at = NULL,
    checkout_notes = NULL
  WHERE id = file_id_param
  RETURNING * INTO file_record;
  
  -- Log history
  INSERT INTO file_checkout_history (file_id, user_id, action, notes)
  VALUES (file_id_param, user_id_param, 'checkin', notes_param);
  
  RETURN json_build_object('success', true, 'file', file_record);
END;
$$ LANGUAGE plpgsql;

-- Function to assign a file
CREATE OR REPLACE FUNCTION assign_file(
  file_id_param INTEGER,
  assigned_to_param UUID,
  user_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  file_record RECORD;
  result JSON;
BEGIN
  -- Get file details
  SELECT * INTO file_record FROM files WHERE id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  -- Update file assignment
  UPDATE files
  SET 
    assigned_to = assigned_to_param,
    assigned_at = NOW(),
    checkout_notes = notes_param
  WHERE id = file_id_param
  RETURNING * INTO file_record;
  
  -- Log history
  INSERT INTO file_checkout_history (file_id, user_id, action, notes)
  VALUES (file_id_param, user_id_param, 'assign', notes_param);
  
  RETURN json_build_object('success', true, 'file', file_record);
END;
$$ LANGUAGE plpgsql;

-- Function to unassign a file
CREATE OR REPLACE FUNCTION unassign_file(
  file_id_param INTEGER,
  user_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  file_record RECORD;
  result JSON;
BEGIN
  -- Get file details
  SELECT * INTO file_record FROM files WHERE id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  -- Update file assignment
  UPDATE files
  SET 
    assigned_to = NULL,
    assigned_at = NULL,
    checkout_notes = notes_param
  WHERE id = file_id_param
  RETURNING * INTO file_record;
  
  -- Log history
  INSERT INTO file_checkout_history (file_id, user_id, action, notes)
  VALUES (file_id_param, user_id_param, 'unassign', notes_param);
  
  RETURN json_build_object('success', true, 'file', file_record);
END;
$$ LANGUAGE plpgsql;

-- Function to get file checkout status
CREATE OR REPLACE FUNCTION get_file_checkout_status(file_id_param INTEGER)
RETURNS TABLE (
  file_id INTEGER,
  checked_out BOOLEAN,
  checked_out_by UUID,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID,
  assigned_at TIMESTAMP WITH TIME ZONE,
  checkout_notes TEXT,
  checked_out_by_name TEXT,
  assigned_to_name TEXT,
  history JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id AS file_id,
    (f.checked_out_by IS NOT NULL) AS checked_out,
    f.checked_out_by,
    f.checked_out_at,
    f.assigned_to,
    f.assigned_at,
    f.checkout_notes,
    (SELECT p.company_name FROM profiles p WHERE p.id = f.checked_out_by) AS checked_out_by_name,
    (SELECT p.company_name FROM profiles p WHERE p.id = f.assigned_to) AS assigned_to_name,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'action', h.action,
          'user_id', h.user_id,
          'user_name', (SELECT p.company_name FROM profiles p WHERE p.id = h.user_id),
          'notes', h.notes,
          'created_at', h.created_at
        ) ORDER BY h.created_at DESC
      )
      FROM file_checkout_history h
      WHERE h.file_id = f.id
    ) AS history
  FROM files f
  WHERE f.id = file_id_param;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for files table (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view all files" ON files;
DROP POLICY IF EXISTS "Users can view own files" ON files;
DROP POLICY IF EXISTS "Staff can view assigned files" ON files;

-- Files RLS Policies
CREATE POLICY "Admins can view all files" ON files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Users can view own files" ON files
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Staff can view assigned files" ON files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'Staff'
    ) AND (
      author_id = auth.uid() OR 
      assigned_to = auth.uid() OR
      checked_out_by = auth.uid()
    )
  );

-- RLS Policies for file_checkout_history table (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view all checkout history" ON file_checkout_history;
DROP POLICY IF EXISTS "Users can view own checkout history" ON file_checkout_history;
DROP POLICY IF EXISTS "Staff can view project checkout history" ON file_checkout_history;

-- File checkout history RLS Policies
CREATE POLICY "Admins can view all checkout history" ON file_checkout_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Users can view own checkout history" ON file_checkout_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Staff can view project checkout history" ON file_checkout_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM files f
      JOIN projects p ON f.project_id = p.id
      WHERE f.id = file_checkout_history.file_id
      AND (
        p.author_id = auth.uid() OR 
        p.assigned_to_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
        )
      )
    )
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION checkout_file(INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION checkin_file(INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_file(INTEGER, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION unassign_file(INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_file_checkout_status(INTEGER) TO authenticated;
