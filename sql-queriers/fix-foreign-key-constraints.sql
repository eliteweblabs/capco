-- =====================================================
-- FIX FOREIGN KEY CONSTRAINTS
-- =====================================================
-- This script fixes foreign key constraints to allow proper deletion
-- of user profiles and related data
-- =====================================================

-- 1. Fix pdf_templates foreign key constraint
-- =====================================================

-- Drop the existing foreign key constraint
ALTER TABLE pdf_templates 
DROP CONSTRAINT IF EXISTS pdf_templates_created_by_fkey;

-- Recreate the foreign key constraint with CASCADE delete behavior
ALTER TABLE pdf_templates 
ADD CONSTRAINT pdf_templates_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- 2. Check and fix other potential foreign key constraints
-- =====================================================

-- Fix any other foreign key constraints that might prevent deletion
-- Check for foreign keys referencing profiles table
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all foreign key constraints that reference profiles table
    FOR constraint_record IN
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
        AND ccu.table_name = 'profiles'
        AND tc.table_name != 'pdf_templates' -- We already fixed this one
    LOOP
        -- Drop the existing constraint
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                      constraint_record.table_name, 
                      constraint_record.constraint_name);
        
        -- Recreate with CASCADE delete behavior
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE CASCADE',
                      constraint_record.table_name,
                      constraint_record.constraint_name,
                      constraint_record.column_name,
                      constraint_record.foreign_table_name,
                      constraint_record.foreign_column_name);
        
        RAISE NOTICE 'Fixed foreign key constraint: %.% -> profiles.%', 
                     constraint_record.table_name, 
                     constraint_record.constraint_name,
                     constraint_record.foreign_column_name;
    END LOOP;
END $$;

-- 3. Fix foreign key constraints for projects table
-- =====================================================

-- Fix any foreign keys that might prevent project deletion
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all foreign key constraints that reference projects table
    FOR constraint_record IN
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
        AND ccu.table_name = 'projects'
        AND tc.table_name NOT IN ('discussion', 'files', 'punchlist') -- These should already have CASCADE
    LOOP
        -- Drop the existing constraint
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                      constraint_record.table_name, 
                      constraint_record.constraint_name);
        
        -- Recreate with CASCADE delete behavior
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE CASCADE',
                      constraint_record.table_name,
                      constraint_record.constraint_name,
                      constraint_record.column_name,
                      constraint_record.foreign_table_name,
                      constraint_record.foreign_column_name);
        
        RAISE NOTICE 'Fixed foreign key constraint: %.% -> projects.%', 
                     constraint_record.table_name, 
                     constraint_record.constraint_name,
                     constraint_record.foreign_column_name;
    END LOOP;
END $$;

-- 4. Verify the constraints are properly set
-- =====================================================

-- Show all foreign key constraints that reference profiles table
SELECT 
    'Foreign key constraints referencing profiles:' as info,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND ccu.table_name = 'profiles'
ORDER BY tc.table_name, tc.constraint_name;

-- 5. Success message
-- =====================================================

SELECT 'Foreign key constraints fixed successfully!' as status,
       'User and project deletion should now work properly' as result;
