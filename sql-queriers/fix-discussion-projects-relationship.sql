-- Fix the foreign key relationship between discussion and projects tables
-- This ensures the join works properly for fetching project addresses

-- First, check if the foreign key constraint exists
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'discussion_project_id_fkey' 
        AND table_name = 'discussion'
    ) THEN
        ALTER TABLE discussion DROP CONSTRAINT discussion_project_id_fkey;
    END IF;
    
    -- Also check for camelCase version
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'discussion_projectId_fkey' 
        AND table_name = 'discussion'
    ) THEN
        ALTER TABLE discussion DROP CONSTRAINT discussion_projectId_fkey;
    END IF;
    
    -- Recreate the foreign key constraint with proper naming
    ALTER TABLE discussion 
    ADD CONSTRAINT discussion_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Fixed discussion -> projects foreign key relationship';
END $$;

-- Verify the constraint was created
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'discussion'
AND ccu.table_name = 'projects';
