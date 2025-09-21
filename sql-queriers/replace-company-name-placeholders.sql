-- Replace CAPCo Fire with {{COMPANY_NAME}} placeholder in project statuses
-- This makes the project reusable for other companies

-- First, let's see what columns actually exist in the table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'project_statuses' 
  AND table_schema = 'public' 
  AND data_type IN ('text', 'character varying', 'varchar')
ORDER BY ordinal_position;

-- Dynamic approach: Update all text columns that contain company references
-- This will work regardless of the actual column names

-- Step 1: Replace 'CAPCo Fire' with {{COMPANY_NAME}} in all text columns
DO $$
DECLARE
    col_name text;
    update_sql text;
BEGIN
    -- Loop through all text columns
    FOR col_name IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'project_statuses' 
          AND table_schema = 'public' 
          AND data_type IN ('text', 'character varying', 'varchar')
    LOOP
        -- Build dynamic UPDATE statement
        update_sql := format('UPDATE project_statuses SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', 
                            col_name, col_name, 'CAPCo Fire', '{{COMPANY_NAME}}', col_name, '%CAPCo Fire%');
        
        -- Execute the update
        EXECUTE update_sql;
        
        RAISE NOTICE 'Updated column: %', col_name;
    END LOOP;
END $$;

-- Step 2: Replace 'CAPCo' with {{COMPANY_NAME}} in all text columns
DO $$
DECLARE
    col_name text;
    update_sql text;
BEGIN
    -- Loop through all text columns
    FOR col_name IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'project_statuses' 
          AND table_schema = 'public' 
          AND data_type IN ('text', 'character varying', 'varchar')
    LOOP
        -- Build dynamic UPDATE statement
        update_sql := format('UPDATE project_statuses SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', 
                            col_name, col_name, 'CAPCo', '{{COMPANY_NAME}}', col_name, '%CAPCo%');
        
        -- Execute the update
        EXECUTE update_sql;
        
        RAISE NOTICE 'Updated column: %', col_name;
    END LOOP;
END $$;

-- Show results - find all rows that now contain {{COMPANY_NAME}}
SELECT * FROM project_statuses 
WHERE EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'project_statuses' 
      AND table_schema = 'public' 
      AND data_type IN ('text', 'character varying', 'varchar')
      AND (
        SELECT COUNT(*) 
        FROM unnest(string_to_array(project_statuses::text, ',')) AS col_value 
        WHERE col_value LIKE '%{{COMPANY_NAME}}%'
      ) > 0
);
