-- =====================================================
-- FIX INCOMPLETE DISCUSSIONS FUNCTION
-- =====================================================
-- This function is triggered on INSERT/UPDATE/DELETE of discussion table
-- and might still be referencing old field names
-- =====================================================

-- Drop the trigger first, then the function
DROP TRIGGER IF EXISTS trigger_update_incomplete_discussions ON discussion;
DROP FUNCTION IF EXISTS update_incomplete_discussions_count();

CREATE OR REPLACE FUNCTION update_incomplete_discussions_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
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

-- Recreate the trigger to ensure it's properly attached

CREATE TRIGGER trigger_update_incomplete_discussions
    AFTER INSERT OR UPDATE OR DELETE ON discussion
    FOR EACH ROW
    EXECUTE FUNCTION update_incomplete_discussions_count();

-- Add documentation
COMMENT ON FUNCTION update_incomplete_discussions_count() IS 
'Updates incomplete discussions count when discussions are inserted, updated, or deleted. Uses camelCase field names.';

COMMENT ON TRIGGER trigger_update_incomplete_discussions ON discussion IS 
'Triggers update_incomplete_discussions_count function on discussion table changes.';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed update_incomplete_discussions_count function!';
    RAISE NOTICE '🔧 Function now uses correct camelCase field names';
    RAISE NOTICE '📝 Trigger recreated and properly attached to discussion table';
END $$;
