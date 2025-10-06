-- =====================================================
-- FIX ALL CAMELCASE REFERENCES - COMPREHENSIVE
-- =====================================================
-- This script updates ALL database functions and triggers to use camelCase field names
-- =====================================================

-- 1. Drop all existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_files_updated_at ON files;
DROP TRIGGER IF EXISTS update_discussion_updated_at ON discussion;
DROP TRIGGER IF EXISTS update_demo_bookings_timestamp ON demo_bookings;
DROP TRIGGER IF EXISTS update_feedback_timestamp ON feedback;
DROP TRIGGER IF EXISTS update_subjects_timestamp ON subjects;
DROP TRIGGER IF EXISTS sync_featured_image_on_file_update ON files;
DROP TRIGGER IF EXISTS sync_featured_image_on_file_insert ON files;
DROP TRIGGER IF EXISTS assign_discussions_on_project_create ON projects;
DROP TRIGGER IF EXISTS create_punchlist_on_project_create ON projects;
DROP TRIGGER IF EXISTS set_due_date_on_status_change ON projects;
DROP TRIGGER IF EXISTS set_elapsed_time_on_create ON projects;
DROP TRIGGER IF EXISTS update_elapsed_time_on_update ON projects;
DROP TRIGGER IF EXISTS update_discussion_count_on_insert ON discussion;
DROP TRIGGER IF EXISTS update_discussion_count_on_update ON discussion;
DROP TRIGGER IF EXISTS update_discussion_count_on_delete ON discussion;

-- 2. Update all functions to use camelCase field names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, "createdAt", "updatedAt")
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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_featured_image_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync featured image data when files are updated
  IF TG_TABLE_NAME = 'files' AND NEW.id IS NOT NULL THEN
    UPDATE projects 
    SET "featuredImageData" = jsonb_build_object(
      'id', NEW.id,
      'fileName', NEW."fileName",
      'filePath', NEW."filePath",
      'uploadedAt', NEW."uploadedAt"
    )
    WHERE "featuredImageId" = NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_default_discussions_to_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial discussion threads for new projects
  INSERT INTO discussion ("projectId", "authorId", message, internal, "createdAt")
  VALUES 
    (NEW.id, NEW."authorId", 'Project created - Discussion thread started', true, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_create_punchlist_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Add default punchlist items for new projects
  INSERT INTO punchlist ("projectId", "authorId", message, internal, "markCompleted", "createdAt")
  VALUES 
    (NEW.id, NEW."authorId", 'Initial inspection checklist', true, false, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_project_due_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Set due date when project status changes
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Set due date to 30 days from now for new projects
    IF NEW.status = 0 THEN
      NEW."dueDate" := NOW() + INTERVAL '30 days';
    -- Set to 14 days for projects under review
    ELSIF NEW.status = 1 THEN
      NEW."dueDate" := NOW() + INTERVAL '14 days';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_update_elapsed_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW."elapsedTime" := INTERVAL '0';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_update_elapsed_time_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate elapsed time since project creation
  NEW."elapsedTime" := NOW() - NEW."createdAt";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_demo_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_incomplete_discussions_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT, UPDATE, and DELETE operations
    IF TG_OP = 'INSERT' THEN
        -- New discussion added - increment count if not completed (treat NULL as incomplete)
        IF NEW."markCompleted" IS NULL OR NOT NEW."markCompleted" THEN
            UPDATE projects 
            SET "incompleteDiscussions" = COALESCE("incompleteDiscussions", 0) + 1
            WHERE id = NEW."projectId";
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Discussion updated - adjust count based on markCompleted changes
        -- Treat NULL as incomplete (false)
        IF (OLD."markCompleted" IS NULL OR NOT OLD."markCompleted") != (NEW."markCompleted" IS NULL OR NOT NEW."markCompleted") THEN
            IF NEW."markCompleted" IS NOT NULL AND NEW."markCompleted" THEN
                -- Marked as completed - decrement count
                UPDATE projects 
                SET "incompleteDiscussions" = GREATEST(COALESCE("incompleteDiscussions", 0) - 1, 0)
                WHERE id = NEW."projectId";
            ELSE
                -- Marked as incomplete (including NULL) - increment count
                UPDATE projects 
                SET "incompleteDiscussions" = COALESCE("incompleteDiscussions", 0) + 1
                WHERE id = NEW."projectId";
            END IF;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Discussion deleted - decrement count if it was incomplete (treat NULL as incomplete)
        IF OLD."markCompleted" IS NULL OR NOT OLD."markCompleted" THEN
            UPDATE projects 
            SET "incompleteDiscussions" = GREATEST(COALESCE("incompleteDiscussions", 0) - 1, 0)
            WHERE id = OLD."projectId";
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recalculate_incomplete_discussions()
RETURNS void AS $$
BEGIN
    -- Update all projects with accurate incomplete discussions count
    -- Treat NULL markCompleted as incomplete
    UPDATE projects 
    SET "incompleteDiscussions" = (
        SELECT COUNT(*)
        FROM discussion 
        WHERE discussion."projectId" = projects.id 
        AND ("markCompleted" IS NULL OR "markCompleted" = false)
    )
    WHERE id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_project_elapsed_time()
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET "elapsedTime" = NOW() - "createdAt"
  WHERE "createdAt" IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_single_project_elapsed_time(project_id_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET "elapsedTime" = NOW() - "createdAt"
  WHERE id = project_id_param AND "createdAt" IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate all triggers with correct function references
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

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

CREATE TRIGGER sync_featured_image_on_file_update
  AFTER UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION sync_featured_image_data();

CREATE TRIGGER sync_featured_image_on_file_insert
  AFTER INSERT ON files
  FOR EACH ROW
  EXECUTE FUNCTION sync_featured_image_data();

CREATE TRIGGER assign_discussions_on_project_create
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_discussions_to_project();

CREATE TRIGGER create_punchlist_on_project_create
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_punchlist_items();

CREATE TRIGGER set_due_date_on_status_change
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_due_date();

CREATE TRIGGER set_elapsed_time_on_create
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_elapsed_time();

CREATE TRIGGER update_elapsed_time_on_update
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_elapsed_time_on_update();

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

-- 4. Run the recalculation function to set initial values
SELECT recalculate_incomplete_discussions();

-- 5. Update elapsed time for existing projects
SELECT update_project_elapsed_time();

-- 6. Success message
SELECT 'All database functions and triggers updated for camelCase columns!' as status;
