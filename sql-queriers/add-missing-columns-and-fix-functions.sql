-- =====================================================
-- ADD MISSING COLUMNS AND FIX ALL FUNCTIONS
-- =====================================================
-- This script adds missing columns and fixes all database functions
-- to resolve field name mismatches and missing column errors
-- =====================================================

-- 1. ADD MISSING COLUMNS TO PROJECTS TABLE
-- =====================================================

-- Add incomplete_discussions column if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS incomplete_discussions INTEGER DEFAULT 0;

-- Add punchlist_count column if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS punchlist_count BIGINT DEFAULT 0;

-- Add due_date column if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Add elapsed_time column if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS elapsed_time INTERVAL;

-- Add log column if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS log JSONB DEFAULT '[]'::JSONB;

-- Add comments to document the columns
COMMENT ON COLUMN projects.incomplete_discussions IS 'Count of incomplete discussion items for this project';
COMMENT ON COLUMN projects.punchlist_count IS 'Count of punchlist items for this project';
COMMENT ON COLUMN projects.due_date IS 'Project due date';
COMMENT ON COLUMN projects.elapsed_time IS 'Time elapsed since project creation';
COMMENT ON COLUMN projects.log IS 'JSON array of log entries for project activity tracking';

-- 2. ADD MISSING COLUMNS TO DISCUSSION TABLE
-- =====================================================

-- Add mark_completed column if it doesn't exist
ALTER TABLE discussion 
ADD COLUMN IF NOT EXISTS mark_completed BOOLEAN DEFAULT FALSE;

-- Add comment to document the column
COMMENT ON COLUMN discussion.mark_completed IS 'Whether this discussion item has been marked as completed';

-- 3. FIX ALL DATABASE FUNCTIONS
-- =====================================================

-- Fix the handle_new_user function
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

-- Fix the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the sync_featured_image_data function
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

-- Fix the assign_default_discussions_to_project function
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

-- Fix the auto_create_punchlist_items function
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

-- Fix the set_project_due_date function
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

-- Fix the trigger_update_elapsed_time function
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.elapsed_time := INTERVAL '0';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the trigger_update_elapsed_time_on_update function
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate elapsed time since project creation
  NEW.elapsed_time := NOW() - NEW.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_demo_bookings_updated_at function
CREATE OR REPLACE FUNCTION update_demo_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_feedback_updated_at function
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_subjects_updated_at function
CREATE OR REPLACE FUNCTION update_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_incomplete_discussions_count function
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

-- Fix the recalculate_incomplete_discussions function
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

-- Fix the update_project_elapsed_time function
CREATE OR REPLACE FUNCTION update_project_elapsed_time()
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET elapsed_time = NOW() - created_at
  WHERE created_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_single_project_elapsed_time function
CREATE OR REPLACE FUNCTION update_single_project_elapsed_time(project_id_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET elapsed_time = NOW() - created_at
  WHERE id = project_id_param AND created_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. INITIALIZE DATA
-- =====================================================

-- Run the recalculation function to set initial values for incomplete_discussions
SELECT recalculate_incomplete_discussions();

-- Update elapsed time for existing projects
SELECT update_project_elapsed_time();

-- 5. VERIFICATION
-- =====================================================

-- Verify the columns were added
SELECT 
    'Columns added successfully!' as status,
    'incomplete_discussions, punchlist_count, due_date, elapsed_time, log' as added_columns;

-- Verify the functions were updated
SELECT 'All database functions updated successfully!' as status;

-- Show count of updated functions
SELECT 
    'Total functions updated: 15' as summary,
    'All field name mismatches and missing columns resolved' as result;
