-- =====================================================
-- CAPCO Design Group - Development Database Setup
-- WITH ESSENTIAL FUNCTIONS ONLY
-- =====================================================
-- This includes ONLY the functions that are actively used
-- Either by triggers or directly called from your application
-- =====================================================

-- First, run the base migration (tables, RLS, indexes)
-- Then run this file for functions and triggers

-- =====================================================
-- ESSENTIAL FUNCTIONS (Used by Triggers)
-- =====================================================

-- 0. Create profile when new user signs up (CRITICAL)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Update timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Sync featured image data on projects
CREATE OR REPLACE FUNCTION sync_featured_image_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync featured image data when files are updated
  IF TG_TABLE_NAME = 'files' AND NEW.id IS NOT NULL THEN
    UPDATE projects 
    SET featured_image_data = jsonb_build_object(
      'id', NEW.id,
      'file_name', NEW.file_name,
      'file_path', NEW.file_path,
      'uploaded_at', NEW.uploaded_at
    )
    WHERE featured_image_id = NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Assign default discussions to new projects
CREATE OR REPLACE FUNCTION assign_default_discussions_to_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial discussion threads for new projects
  INSERT INTO discussion (project_id, author_id, message, internal, created_at)
  VALUES 
    (NEW.id, NEW.author_id, 'Project created - Discussion thread started', true, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Auto-create punchlist items for new projects
CREATE OR REPLACE FUNCTION auto_create_punchlist_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Add default punchlist items for new projects
  INSERT INTO punchlist (project_id, author_id, message, internal, mark_completed, created_at)
  VALUES 
    (NEW.id, NEW.author_id, 'Initial inspection checklist', true, false, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Set project due date based on status
CREATE OR REPLACE FUNCTION set_project_due_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Set due date when project status changes
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Set due date to 30 days from now for new projects
    IF NEW.status = 0 THEN
      NEW.due_date := NOW() + INTERVAL '30 days';
    -- Set to 14 days for projects under review
    ELSIF NEW.status = 1 THEN
      NEW.due_date := NOW() + INTERVAL '14 days';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Update elapsed time when project is created
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.elapsed_time := INTERVAL '0';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Update elapsed time when project is updated
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate elapsed time since project creation
  NEW.elapsed_time := NOW() - NEW.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Update demo_bookings timestamp
CREATE OR REPLACE FUNCTION update_demo_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Update feedback timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Update incomplete discussions count
CREATE OR REPLACE FUNCTION update_incomplete_discussions_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the count of incomplete discussions on the project
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE projects
    SET incomplete_discussions = (
      SELECT COUNT(*)
      FROM discussion
      WHERE project_id = NEW.project_id
      AND mark_completed = false
    )
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects
    SET incomplete_discussions = (
      SELECT COUNT(*)
      FROM discussion
      WHERE project_id = OLD.project_id
      AND mark_completed = false
    )
    WHERE id = OLD.project_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 11. Update subjects timestamp
CREATE OR REPLACE FUNCTION update_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FILE MANAGEMENT FUNCTIONS (Called from app code)
-- =====================================================

-- Checkout a file
CREATE OR REPLACE FUNCTION checkout_file(
  p_file_id integer,
  p_user_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_current_checkout uuid;
BEGIN
  -- Check if file is already checked out
  SELECT checked_out_by INTO v_current_checkout
  FROM files
  WHERE id = p_file_id;
  
  IF v_current_checkout IS NOT NULL AND v_current_checkout != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'File is already checked out by another user'
    );
  END IF;
  
  -- Checkout the file
  UPDATE files
  SET 
    checked_out_by = p_user_id,
    checked_out_at = NOW(),
    checkout_notes = p_notes
  WHERE id = p_file_id;
  
  -- Log the checkout
  INSERT INTO file_checkout_history (file_id, user_id, action, notes, created_at)
  VALUES (p_file_id, p_user_id, 'checkout', p_notes, NOW());
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'File checked out successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Checkin a file
CREATE OR REPLACE FUNCTION checkin_file(
  p_file_id integer,
  p_user_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_current_checkout uuid;
BEGIN
  -- Check if file is checked out by this user
  SELECT checked_out_by INTO v_current_checkout
  FROM files
  WHERE id = p_file_id;
  
  IF v_current_checkout IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'File is not checked out'
    );
  END IF;
  
  IF v_current_checkout != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'File is checked out by another user'
    );
  END IF;
  
  -- Checkin the file
  UPDATE files
  SET 
    checked_out_by = NULL,
    checked_out_at = NULL,
    checkout_notes = NULL
  WHERE id = p_file_id;
  
  -- Log the checkin
  INSERT INTO file_checkout_history (file_id, user_id, action, notes, created_at)
  VALUES (p_file_id, p_user_id, 'checkin', p_notes, NOW());
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'File checked in successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assign a file to a user
CREATE OR REPLACE FUNCTION assign_file(
  p_file_id integer,
  p_user_id uuid,
  p_assigned_by uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
BEGIN
  -- Assign the file
  UPDATE files
  SET 
    assigned_to = p_user_id,
    assigned_at = NOW()
  WHERE id = p_file_id;
  
  -- Log the assignment
  INSERT INTO file_checkout_history (file_id, user_id, action, notes, created_at)
  VALUES (p_file_id, p_assigned_by, 'assign', 
          'Assigned to user: ' || p_user_id::text || '. ' || COALESCE(p_notes, ''), 
          NOW());
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'File assigned successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get file checkout status
CREATE OR REPLACE FUNCTION get_file_checkout_status(p_file_id integer)
RETURNS jsonb AS $$
DECLARE
  v_file_info record;
  v_user_name text;
BEGIN
  SELECT 
    f.checked_out_by,
    f.checked_out_at,
    f.checkout_notes,
    f.assigned_to,
    f.assigned_at
  INTO v_file_info
  FROM files f
  WHERE f.id = p_file_id;
  
  IF v_file_info.checked_out_by IS NOT NULL THEN
    -- Get user name
    SELECT COALESCE(first_name || ' ' || last_name, email) INTO v_user_name
    FROM profiles
    WHERE id = v_file_info.checked_out_by;
    
    RETURN jsonb_build_object(
      'is_checked_out', true,
      'checked_out_by', v_file_info.checked_out_by,
      'checked_out_by_name', v_user_name,
      'checked_out_at', v_file_info.checked_out_at,
      'notes', v_file_info.checkout_notes
    );
  ELSE
    RETURN jsonb_build_object(
      'is_checked_out', false,
      'assigned_to', v_file_info.assigned_to,
      'assigned_at', v_file_info.assigned_at
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- APPLY TRIGGERS
-- =====================================================

-- Create new user profile trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps on various tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_updated_at
  BEFORE UPDATE ON discussion
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_demo_bookings_timestamp
  BEFORE UPDATE ON demo_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_demo_bookings_updated_at();

CREATE TRIGGER update_feedback_timestamp
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

CREATE TRIGGER update_subjects_timestamp
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_subjects_updated_at();

-- Featured image sync trigger
CREATE TRIGGER sync_featured_image_on_file_update
  AFTER UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION sync_featured_image_data();

CREATE TRIGGER sync_featured_image_on_file_insert
  AFTER INSERT ON files
  FOR EACH ROW
  EXECUTE FUNCTION sync_featured_image_data();

-- Project initialization triggers
CREATE TRIGGER assign_discussions_on_project_create
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_discussions_to_project();

CREATE TRIGGER create_punchlist_on_project_create
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_punchlist_items();

-- Project due date trigger
CREATE TRIGGER set_due_date_on_status_change
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_due_date();

-- Elapsed time triggers
CREATE TRIGGER set_elapsed_time_on_create
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_elapsed_time();

CREATE TRIGGER update_elapsed_time_on_update
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_elapsed_time_on_update();

-- Discussion count trigger
CREATE TRIGGER update_discussion_count_on_insert
  AFTER INSERT ON discussion
  FOR EACH ROW
  EXECUTE FUNCTION update_incomplete_discussions_count();

CREATE TRIGGER update_discussion_count_on_update
  AFTER UPDATE ON discussion
  FOR EACH ROW
  EXECUTE FUNCTION update_incomplete_discussions_count();

CREATE TRIGGER update_discussion_count_on_delete
  AFTER DELETE ON discussion
  FOR EACH ROW
  EXECUTE FUNCTION update_incomplete_discussions_count();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Essential functions and triggers installed!';
  RAISE NOTICE 'Total functions: 15 (11 trigger functions + 4 file management)';
  RAISE NOTICE 'All unnecessary/debug functions have been excluded.';
END $$;

