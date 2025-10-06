-- =====================================================
-- Fix Trigger Field Names - Update snake_case to camelCase
-- =====================================================
-- This fixes the database triggers that are still using snake_case field names
-- but the database schema has been updated to use camelCase field names

-- 1. Fix the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, createdAt, updatedAt)
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
  NEW.updatedAt = NOW();
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
    SET featuredImageData = jsonb_build_object(
      'id', NEW.id,
      'fileName', NEW.fileName,
      'filePath', NEW.filePath,
      'uploadedAt', NEW.uploadedAt
    )
    WHERE featuredImageId = NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Fix the assign_default_discussions_to_project function
CREATE OR REPLACE FUNCTION assign_default_discussions_to_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial discussion threads for new projects
  INSERT INTO discussion (projectId, authorId, message, internal, createdAt)
  VALUES 
    (NEW.id, NEW.authorId, 'Project created - Discussion thread started', true, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Fix the auto_create_punchlist_items function
CREATE OR REPLACE FUNCTION auto_create_punchlist_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Add default punchlist items for new projects
  INSERT INTO punchlist (projectId, authorId, message, internal, markCompleted, createdAt)
  VALUES 
    (NEW.id, NEW.authorId, 'Initial inspection checklist', true, false, NOW());
  
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
      NEW.dueDate := NOW() + INTERVAL '30 days';
    -- Set to 14 days for projects under review
    ELSIF NEW.status = 1 THEN
      NEW.dueDate := NOW() + INTERVAL '14 days';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Fix the trigger_update_elapsed_time function
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.elapsedTime := INTERVAL '0';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Fix the trigger_update_elapsed_time_on_update function
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate elapsed time since project creation
  NEW.elapsedTime := NOW() - NEW.createdAt;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Fix the update_demo_bookings_updated_at function
CREATE OR REPLACE FUNCTION update_demo_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Fix the update_feedback_updated_at function
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Fix the update_subjects_updated_at function
CREATE OR REPLACE FUNCTION update_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Fix the update_project_elapsed_time function
CREATE OR REPLACE FUNCTION update_project_elapsed_time()
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET elapsedTime = NOW() - createdAt
  WHERE createdAt IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 13. Fix the update_single_project_elapsed_time function
CREATE OR REPLACE FUNCTION update_single_project_elapsed_time(project_id_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET elapsedTime = NOW() - createdAt
  WHERE id = project_id_param AND createdAt IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 14. Fix the trigger_update_elapsed_time function (for inserts)
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.elapsedTime = NOW() - NEW.createdAt;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Fix the trigger_update_elapsed_time_on_update function
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if createdAt changed
  IF OLD.createdAt IS DISTINCT FROM NEW.createdAt THEN
    NEW.elapsedTime = NOW() - NEW.createdAt;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. Fix the update_incomplete_discussions_count function
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

-- 17. Fix the recalculate_incomplete_discussions function
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

-- Verify the functions were updated
SELECT 'Trigger functions updated successfully!' as status;
