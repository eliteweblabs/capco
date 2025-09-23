-- File Checkout and Assignment System - Clean Migration
-- Run this to set up the complete file checkout system

-- Step 1: Add columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS checked_out_by UUID REFERENCES auth.users(id);
ALTER TABLE files ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE files ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS checkout_notes TEXT;

-- Step 2: Create file_checkout_history table
CREATE TABLE IF NOT EXISTS file_checkout_history (
  id SERIAL PRIMARY KEY,
  file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_files_checked_out_by ON files(checked_out_by);
CREATE INDEX IF NOT EXISTS idx_files_assigned_to ON files(assigned_to);
CREATE INDEX IF NOT EXISTS idx_file_checkout_history_file_id ON file_checkout_history(file_id);
CREATE INDEX IF NOT EXISTS idx_file_checkout_history_user_id ON file_checkout_history(user_id);

-- Step 4: Create functions
CREATE OR REPLACE FUNCTION checkout_file(
  file_id_param INTEGER,
  user_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  file_record RECORD;
BEGIN
  SELECT * INTO file_record FROM files WHERE id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  IF file_record.checked_out_by IS NOT NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'File is already checked out',
      'checked_out_by', file_record.checked_out_by,
      'checked_out_at', file_record.checked_out_at
    );
  END IF;
  
  UPDATE files
  SET 
    checked_out_by = user_id_param,
    checked_out_at = NOW(),
    checkout_notes = notes_param,
    assigned_to = NULL,
    assigned_at = NULL
  WHERE id = file_id_param
  RETURNING * INTO file_record;
  
  INSERT INTO file_checkout_history (file_id, user_id, action, notes)
  VALUES (file_id_param, user_id_param, 'checkout', notes_param);
  
  RETURN json_build_object('success', true, 'file', file_record);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION checkin_file(
  file_id_param INTEGER,
  user_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  file_record RECORD;
BEGIN
  SELECT * INTO file_record FROM files WHERE id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  IF file_record.checked_out_by != user_id_param THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'File is not checked out by you',
      'checked_out_by', file_record.checked_out_by
    );
  END IF;
  
  UPDATE files
  SET 
    checked_out_by = NULL,
    checked_out_at = NULL,
    checkout_notes = NULL
  WHERE id = file_id_param
  RETURNING * INTO file_record;
  
  INSERT INTO file_checkout_history (file_id, user_id, action, notes)
  VALUES (file_id_param, user_id_param, 'checkin', notes_param);
  
  RETURN json_build_object('success', true, 'file', file_record);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_file(
  file_id_param INTEGER,
  assigned_to_param UUID,
  user_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  file_record RECORD;
BEGIN
  SELECT * INTO file_record FROM files WHERE id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  UPDATE files
  SET 
    assigned_to = assigned_to_param,
    assigned_at = NOW(),
    checkout_notes = notes_param
  WHERE id = file_id_param
  RETURNING * INTO file_record;
  
  INSERT INTO file_checkout_history (file_id, user_id, action, notes)
  VALUES (file_id_param, user_id_param, 'assign', notes_param);
  
  RETURN json_build_object('success', true, 'file', file_record);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION unassign_file(
  file_id_param INTEGER,
  user_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  file_record RECORD;
BEGIN
  SELECT * INTO file_record FROM files WHERE id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  UPDATE files
  SET 
    assigned_to = NULL,
    assigned_at = NULL,
    checkout_notes = notes_param
  WHERE id = file_id_param
  RETURNING * INTO file_record;
  
  INSERT INTO file_checkout_history (file_id, user_id, action, notes)
  VALUES (file_id_param, user_id_param, 'unassign', notes_param);
  
  RETURN json_build_object('success', true, 'file', file_record);
END;
$$ LANGUAGE plpgsql;

-- Step 5: Drop existing policies (if any)
DROP POLICY IF EXISTS "Admins can view all files" ON files;
DROP POLICY IF EXISTS "Users can view own files" ON files;
DROP POLICY IF EXISTS "Staff can view assigned files" ON files;
DROP POLICY IF EXISTS "Admins can view all checkout history" ON file_checkout_history;
DROP POLICY IF EXISTS "Users can view own checkout history" ON file_checkout_history;
DROP POLICY IF EXISTS "Staff can view project checkout history" ON file_checkout_history;

-- Step 6: Create RLS policies for files
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

-- Step 7: Create RLS policies for file_checkout_history
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

-- Step 8: Grant permissions
GRANT EXECUTE ON FUNCTION checkout_file(INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION checkin_file(INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_file(INTEGER, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION unassign_file(INTEGER, UUID, TEXT) TO authenticated;
