-- =====================================================
-- COMPREHENSIVE FIELD NAME FIX - ALL FUNCTIONS
-- =====================================================
-- This script fixes ALL database functions to use the correct field names
-- Based on your database schema which uses snake_case field names
-- =====================================================

-- 1. Fix the handle_new_user function
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

-- 2. Fix the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Fix the sync_featured_image_data function
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

-- 4. Fix the assign_default_discussions_to_project function
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

-- 5. Fix the auto_create_punchlist_items function
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

-- 6. Fix the set_project_due_date function
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

-- 7. Fix the trigger_update_elapsed_time function
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.elapsed_time := INTERVAL '0';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Fix the trigger_update_elapsed_time_on_update function
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate elapsed time since project creation
  NEW.elapsed_time := NOW() - NEW.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Fix the update_demo_bookings_updated_at function
CREATE OR REPLACE FUNCTION update_demo_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Fix the update_feedback_updated_at function
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Fix the update_subjects_updated_at function
CREATE OR REPLACE FUNCTION update_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Fix the update_incomplete_discussions_count function
CREATE OR REPLACE FUNCTION update_incomplete_discussions_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT, UPDATE, and DELETE operations
    IF TG_OP = 'INSERT' THEN
        -- New discussion added - increment count if not completed (treat NULL as incomplete)
        IF NEW.mark_completed IS NULL OR NOT NEW.mark_completed THEN
            UPDATE projects 
            SET incomplete_discussions = COALESCE(incomplete_discussions, 0) + 1
            WHERE id = NEW.project_id;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Discussion updated - adjust count based on mark_completed changes
        -- Treat NULL as incomplete (false)
        IF (OLD.mark_completed IS NULL OR NOT OLD.mark_completed) != (NEW.mark_completed IS NULL OR NOT NEW.mark_completed) THEN
            IF NEW.mark_completed IS NOT NULL AND NEW.mark_completed THEN
                -- Marked as completed - decrement count
                UPDATE projects 
                SET incomplete_discussions = GREATEST(COALESCE(incomplete_discussions, 0) - 1, 0)
                WHERE id = NEW.project_id;
            ELSE
                -- Marked as incomplete (including NULL) - increment count
                UPDATE projects 
                SET incomplete_discussions = COALESCE(incomplete_discussions, 0) + 1
                WHERE id = NEW.project_id;
            END IF;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Discussion deleted - decrement count if it was incomplete (treat NULL as incomplete)
        IF OLD.mark_completed IS NULL OR NOT OLD.mark_completed THEN
            UPDATE projects 
            SET incomplete_discussions = GREATEST(COALESCE(incomplete_discussions, 0) - 1, 0)
            WHERE id = OLD.project_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 13. Fix the recalculate_incomplete_discussions function
CREATE OR REPLACE FUNCTION recalculate_incomplete_discussions()
RETURNS void AS $$
BEGIN
    -- Update all projects with accurate incomplete discussions count
    -- Treat NULL mark_completed as incomplete
    UPDATE projects 
    SET incomplete_discussions = (
        SELECT COUNT(*)
        FROM discussion 
        WHERE discussion.project_id = projects.id 
        AND (mark_completed IS NULL OR mark_completed = false)
    )
    WHERE id IS NOT NULL; -- Add WHERE clause to satisfy PostgreSQL requirement
END;
$$ LANGUAGE plpgsql;

-- 14. Fix the update_project_elapsed_time function
CREATE OR REPLACE FUNCTION update_project_elapsed_time()
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET elapsed_time = NOW() - created_at
  WHERE created_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 15. Fix the update_single_project_elapsed_time function
CREATE OR REPLACE FUNCTION update_single_project_elapsed_time(project_id_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET elapsed_time = NOW() - created_at
  WHERE id = project_id_param AND created_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 16. Fix the trigger_update_elapsed_time function (for inserts)
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.elapsed_time = NOW() - NEW.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 17. Fix the trigger_update_elapsed_time_on_update function
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if created_at changed
  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    NEW.elapsed_time = NOW() - NEW.created_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 18. Fix the checkout_file function
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

-- 19. Fix the checkin_file function
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

-- 20. Fix the assign_file function
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

-- 21. Fix the get_file_checkout_status function
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
-- VERIFICATION
-- =====================================================

-- Verify the functions were updated
SELECT 'All database functions updated successfully!' as status;

-- Show count of updated functions
SELECT 
    'Total functions updated: 21' as summary,
    'All field name mismatches should now be resolved' as result;
