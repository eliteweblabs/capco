-- Create function to update incomplete discussions count
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

-- Create trigger for discussion table
DROP TRIGGER IF EXISTS trigger_update_incomplete_discussions ON discussion;
CREATE TRIGGER trigger_update_incomplete_discussions
    AFTER INSERT OR UPDATE OR DELETE ON discussion
    FOR EACH ROW
    EXECUTE FUNCTION update_incomplete_discussions_count();

-- Function to recalculate all incomplete discussions counts (for initial setup)
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

-- Run the recalculation function to set initial values
SELECT recalculate_incomplete_discussions();

-- Add comment for documentation
COMMENT ON FUNCTION update_incomplete_discussions_count() IS 'Automatically updates incomplete_discussions count on projects table when discussion mark_completed status changes';
COMMENT ON FUNCTION recalculate_incomplete_discussions() IS 'Recalculates all incomplete_discussions counts for initial setup or data correction';
