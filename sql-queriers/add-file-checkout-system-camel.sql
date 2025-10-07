-- File Checkout and Assignment System
-- Allows staff/admin to check out files without overwriting
-- Includes assignment capabilities

-- Drop all variations of the functions to ensure a clean slate
DROP FUNCTION IF EXISTS public.checkout_file(INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS public.checkin_file(INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS public.assign_file(INTEGER, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_file_checkout_status(INTEGER);

DROP FUNCTION IF EXISTS checkout_file(INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS checkin_file(INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS assign_file(INTEGER, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS get_file_checkout_status(INTEGER);

DROP FUNCTION IF EXISTS public.checkoutFile(INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS public.checkinFile(INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS public.assignFile(INTEGER, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.getFileCheckoutStatus(INTEGER);

DROP FUNCTION IF EXISTS checkoutFile(INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS checkinFile(INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS assignFile(INTEGER, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS getFileCheckoutStatus(INTEGER);

-- Also try without parameter types in case they were created differently
DROP FUNCTION IF EXISTS public.checkout_file CASCADE;
DROP FUNCTION IF EXISTS public.checkin_file CASCADE;
DROP FUNCTION IF EXISTS public.assign_file CASCADE;
DROP FUNCTION IF EXISTS public.get_file_checkout_status CASCADE;

DROP FUNCTION IF EXISTS checkout_file CASCADE;
DROP FUNCTION IF EXISTS checkin_file CASCADE;
DROP FUNCTION IF EXISTS assign_file CASCADE;
DROP FUNCTION IF EXISTS get_file_checkout_status CASCADE;

DROP FUNCTION IF EXISTS public.checkoutFile CASCADE;
DROP FUNCTION IF EXISTS public.checkinFile CASCADE;
DROP FUNCTION IF EXISTS public.assignFile CASCADE;
DROP FUNCTION IF EXISTS public.getFileCheckoutStatus CASCADE;

DROP FUNCTION IF EXISTS checkoutFile CASCADE;
DROP FUNCTION IF EXISTS checkinFile CASCADE;
DROP FUNCTION IF EXISTS assignFile CASCADE;
DROP FUNCTION IF EXISTS getFileCheckoutStatus CASCADE;

-- Add checkout and assignment columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS "checkedOutBy" UUID REFERENCES auth.users(id);
ALTER TABLE files ADD COLUMN IF NOT EXISTS "checkedOutAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS "assignedTo" UUID REFERENCES auth.users(id);
ALTER TABLE files ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS "checkoutNotes" TEXT;

-- Create file_checkout_history table for tracking
CREATE TABLE IF NOT EXISTS "fileCheckoutHistory" (
  id SERIAL PRIMARY KEY,
  "fileId" INTEGER REFERENCES files(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES auth.users(id),
  action VARCHAR(20) NOT NULL, -- 'checkout', 'checkin', 'assign', 'unassign'
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_checkedOutBy ON files("checkedOutBy");
CREATE INDEX IF NOT EXISTS idx_files_assignedTo ON files("assignedTo");
CREATE INDEX IF NOT EXISTS idx_fileCheckoutHistory_fileId ON "fileCheckoutHistory"("fileId");
CREATE INDEX IF NOT EXISTS idx_fileCheckoutHistory_userId ON "fileCheckoutHistory"("userId");

-- Function to check out a file
CREATE OR REPLACE FUNCTION public.checkout_file(
  file_id_param INTEGER,
  user_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  fileRecord RECORD;
  result JSON;
BEGIN
  -- Get file details
  SELECT 
    f.*,
    f."checkedOutBy",
    f."checkedOutAt",
    f."assignedTo",
    f."assignedAt",
    f."checkoutNotes"
  INTO fileRecord 
  FROM files f 
  WHERE f.id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  -- Check if file is already checked out
  IF fileRecord."checkedOutBy" IS NOT NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'File is already checked out',
      'checkedOutBy', fileRecord."checkedOutBy",
      'checkedOutAt', fileRecord."checkedOutAt"
    );
  END IF;
  
  -- Check out the file
  UPDATE files 
  SET 
    "checkedOutBy" = user_id_param,
    "checkedOutAt" = NOW(),
    "checkoutNotes" = notes_param
  WHERE id = file_id_param;
  
  -- Log the checkout
  INSERT INTO fileCheckoutHistory (fileId, userId, action, notes)
  VALUES (file_id_param, user_id_param, 'checkout', notes_param);
  
  RETURN json_build_object('success', true, 'message', 'File checked out successfully');
END;
$$ LANGUAGE plpgsql;

-- Function to check in a file
CREATE OR REPLACE FUNCTION public.checkin_file(
  file_id_param INTEGER,
  user_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  fileRecord RECORD;
BEGIN
  -- Get file details
  SELECT 
    f.*,
    f."checkedOutBy",
    f."checkedOutAt",
    f."assignedTo",
    f."assignedAt",
    f."checkoutNotes"
  INTO fileRecord 
  FROM files f 
  WHERE f.id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  -- Check if user has the file checked out
  IF fileRecord."checkedOutBy" != user_id_param THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'You do not have this file checked out'
    );
  END IF;
  
  -- Check in the file
  UPDATE files 
  SET 
    "checkedOutBy" = NULL,
    "checkedOutAt" = NULL,
    "checkoutNotes" = NULL
  WHERE id = file_id_param;
  
  -- Log the checkin
  INSERT INTO fileCheckoutHistory (fileId, userId, action, notes)
  VALUES (file_id_param, user_id_param, 'checkin', notes_param);
  
  RETURN json_build_object('success', true, 'message', 'File checked in successfully');
END;
$$ LANGUAGE plpgsql;

-- Function to assign a file
CREATE OR REPLACE FUNCTION public.assign_file(
  file_id_param INTEGER,
  assigned_to_param UUID,
  assigned_by_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  fileRecord RECORD;
BEGIN
  -- Get file details
  SELECT 
    f.*,
    f."checkedOutBy",
    f."checkedOutAt",
    f."assignedTo",
    f."assignedAt",
    f."checkoutNotes"
  INTO fileRecord 
  FROM files f 
  WHERE f.id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  -- Assign the file
  UPDATE files 
  SET 
    "assignedTo" = assigned_to_param,
    "assignedAt" = NOW()
  WHERE id = file_id_param;
  
  -- Log the assignment
  INSERT INTO fileCheckoutHistory (fileId, userId, action, notes)
  VALUES (file_id_param, assigned_by_param, 'assign', notes_param);
  
  RETURN json_build_object('success', true, 'message', 'File assigned successfully');
END;
$$ LANGUAGE plpgsql;

-- Function to get file checkout status
CREATE OR REPLACE FUNCTION public.get_file_checkout_status(file_id_param INTEGER)
RETURNS JSON AS $$
DECLARE
  fileRecord RECORD;
  checkoutUser RECORD;
  assignedUser RECORD;
BEGIN
  -- Get file with user details
  SELECT 
    f.*,
    cu.email as checkedOutByEmail,
    cu.raw_user_meta_data->>'companyName' as checkedOutByName,
    au.email as assignedToEmail,
    au.raw_user_meta_data->>'companyName' as assignedToName
  INTO fileRecord
  FROM files f
  LEFT JOIN auth.users cu ON f.checkedOutBy = cu.id
  LEFT JOIN auth.users au ON f.assignedTo = au.id
  WHERE f.id = file_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'File not found');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'fileId', fileRecord.id,
    'checkedOut', fileRecord.checkedOutBy IS NOT NULL,
    'checkedOutBy', fileRecord.checkedOutBy,
    'checkedOutByName', fileRecord.checkedOutByName,
    'checkedOutByEmail', fileRecord.checkedOutByEmail,
    'checkedOutAt', fileRecord.checkedOutAt,
    'checkoutNotes', fileRecord.checkoutNotes,
    'assignedTo', fileRecord.assignedTo,
    'assignedToName', fileRecord.assignedToName,
    'assignedToEmail', fileRecord.assignedToEmail,
    'assignedAt', fileRecord.assignedAt
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.checkout_file(INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.checkin_file(INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_file(INTEGER, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_file_checkout_status(INTEGER) TO authenticated;

-- RLS Policies for fileCheckoutHistory
ALTER TABLE fileCheckoutHistory ENABLE ROW LEVEL SECURITY;

-- Admins can see all checkout history
DROP POLICY IF EXISTS "Admins can view all checkout history" ON fileCheckoutHistory;
CREATE POLICY "Admins can view all checkout history" ON fileCheckoutHistory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Users can see their own checkout history
DROP POLICY IF EXISTS "Users can view own checkout history" ON fileCheckoutHistory;
CREATE POLICY "Users can view own checkout history" ON fileCheckoutHistory
  FOR SELECT USING (userId = auth.uid());

-- Staff can see checkout history for files in their projects
DROP POLICY IF EXISTS "Staff can view project checkout history" ON fileCheckoutHistory;
CREATE POLICY "Staff can view project checkout history" ON fileCheckoutHistory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM files f
      JOIN projects p ON f."projectId" = p.id
      WHERE f.id = fileCheckoutHistory.fileId
      AND (
        p."authorId" = auth.uid() OR 
        p."assignedToId" = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
        )
      )
    )
  );
