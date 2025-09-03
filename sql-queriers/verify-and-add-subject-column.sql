-- =====================================================
-- VERIFY AND ADD SUBJECT COLUMN TO INVOICES TABLE
-- This script checks if the 'subject' column exists in invoices and creates it if missing
-- =====================================================

-- Step 1: Check if the column exists in invoices table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'subject'
    ) THEN
        RAISE NOTICE 'SUCCESS: subject column already exists in invoices table';
    ELSE
        RAISE NOTICE 'INFO: subject column not found in invoices table, creating it now...';
        
        -- Add the column to invoices table
        ALTER TABLE invoices 
        ADD COLUMN subject TEXT DEFAULT NULL;
        
        -- Add comment for documentation
        COMMENT ON COLUMN invoices.subject IS 'Custom subject line for invoices and proposals';
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_invoices_subject ON invoices(subject);
        
        RAISE NOTICE 'SUCCESS: subject column created successfully in invoices table';
    END IF;
END $$;

-- Step 2: Verify the column now exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'subject'
    ) THEN
        RAISE NOTICE 'VERIFICATION: subject column confirmed to exist in invoices table';
    ELSE
        RAISE EXCEPTION 'ERROR: subject column still not found in invoices table after creation attempt';
    END IF;
END $$;

-- Step 3: Show column information
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name = 'subject';
