-- File Checkout and Assignment System
-- Allows staff/admin to check out files without overwriting
-- Includes assignment capabilities

-- Add checkout and assignment columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS checked_out_by UUID REFERENCES auth.users(id);
ALTER TABLE files ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE files ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS checkout_notes TEXT;

-- Create file_checkout_history table for tracking
CREATE TABLE IF NOT EXISTS file_checkout_history (
  id SERIAL PRIMARY KEY,
  file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(20) NOT NULL, -- 'checkout', 'checkin', 'assign', 'unassign'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
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
  
  -- Check out the file
  UPDATE files 
  SET 
    checked_out_by = user_id_param,
    checked_out_at = NOW(),
    checkout_notes = notes_param
  WHERE id = file_id_param;
  
  -- Log the checkout
  INSERT INTO file_checkout_history (file_id, user_id, action, notes)
  VALUES (file_id_param, user_id_param, 'checkout', notes_param);
  
  RETURN json_build_object('success', true, 'message', 'File checked out successfully');
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
BEGIN
  -- Get file details
  SELECT * INTO file_record FROM files WHERE id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  -- Check if user has the file checked out
  IF file_record.checked_out_by != user_id_param THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'You do not have this file checked out'
    );
  END IF;
  
  -- Check in the file
  UPDATE files 
  SET 
    checked_out_by = NULL,
    checked_out_at = NULL,
    checkout_notes = NULL
  WHERE id = file_id_param;
  
  -- Log the checkin
  INSERT INTO file_checkout_history (file_id, user_id, action, notes)
  VALUES (file_id_param, user_id_param, 'checkin', notes_param);
  
  RETURN json_build_object('success', true, 'message', 'File checked in successfully');
END;
$$ LANGUAGE plpgsql;

-- Function to assign a file
CREATE OR REPLACE FUNCTION assign_file(
  file_id_param INTEGER,
  assigned_to_param UUID,
  assigned_by_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  file_record RECORD;
BEGIN
  -- Get file details
  SELECT * INTO file_record FROM files WHERE id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  -- Assign the file
  UPDATE files 
  SET 
    assigned_to = assigned_to_param,
    assigned_at = NOW()
  WHERE id = file_id_param;
  
  -- Log the assignment
  INSERT INTO file_checkout_history (file_id, user_id, action, notes)
  VALUES (file_id_param, assigned_by_param, 'assign', notes_param);
  
  RETURN json_build_object('success', true, 'message', 'File assigned successfully');
END;
$$ LANGUAGE plpgsql;

-- Function to get file checkout status
CREATE OR REPLACE FUNCTION get_file_checkout_status(file_id_param INTEGER)
RETURNS JSON AS $$
DECLARE
  file_record RECORD;
  checkout_user RECORD;
  assigned_user RECORD;
BEGIN
  -- Get file with user details
  SELECT 
    f.*,
    cu.email as checked_out_by_email,
    cu.raw_user_meta_data->>'company_name' as checked_out_by_name,
    au.email as assigned_to_email,
    au.raw_user_meta_data->>'company_name' as assigned_to_name
  INTO file_record
  FROM files f
  LEFT JOIN auth.users cu ON f.checked_out_by = cu.id
  LEFT JOIN auth.users au ON f.assigned_to = au.id
  WHERE f.id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'file_id', file_record.id,
    'checked_out', file_record.checked_out_by IS NOT NULL,
    'checked_out_by', file_record.checked_out_by,
    'checked_out_by_name', file_record.checked_out_by_name,
    'checked_out_by_email', file_record.checked_out_by_email,
    'checked_out_at', file_record.checked_out_at,
    'checkout_notes', file_record.checkout_notes,
    'assigned_to', file_record.assigned_to,
    'assigned_to_name', file_record.assigned_to_name,
    'assigned_to_email', file_record.assigned_to_email,
    'assigned_at', file_record.assigned_at
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION checkout_file(INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION checkin_file(INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_file(INTEGER, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_file_checkout_status(INTEGER) TO authenticated;

-- RLS Policies for file_checkout_history
ALTER TABLE file_checkout_history ENABLE ROW LEVEL SECURITY;

-- Admins can see all checkout history
DROP POLICY IF EXISTS "Admins can view all checkout history" ON file_checkout_history;
CREATE POLICY "Admins can view all checkout history" ON file_checkout_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Users can see their own checkout history
DROP POLICY IF EXISTS "Users can view own checkout history" ON file_checkout_history;
CREATE POLICY "Users can view own checkout history" ON file_checkout_history
  FOR SELECT USING (user_id = auth.uid());

-- Staff can see checkout history for files in their projects
DROP POLICY IF EXISTS "Staff can view project checkout history" ON file_checkout_history;
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
