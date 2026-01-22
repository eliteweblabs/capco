-- Update bannerAlerts table schema
-- 1. Rename 'description' column to 'content'
-- 2. Make 'title' optional (remove NOT NULL constraint)
-- 3. Make 'content' required (add NOT NULL constraint)

-- First, check if the column exists with the old name
DO $$ 
BEGIN
  -- Rename description to content if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bannerAlerts' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE "bannerAlerts" RENAME COLUMN description TO content;
    RAISE NOTICE 'Renamed description column to content';
  END IF;

  -- Make title nullable
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bannerAlerts' 
    AND column_name = 'title'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "bannerAlerts" ALTER COLUMN title DROP NOT NULL;
    RAISE NOTICE 'Made title column nullable';
  END IF;

  -- Make content required (NOT NULL)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bannerAlerts' 
    AND column_name = 'content'
    AND is_nullable = 'YES'
  ) THEN
    -- First, update any null values to empty string to prevent errors
    UPDATE "bannerAlerts" SET content = '' WHERE content IS NULL;
    -- Then add the NOT NULL constraint
    ALTER TABLE "bannerAlerts" ALTER COLUMN content SET NOT NULL;
    RAISE NOTICE 'Made content column NOT NULL';
  END IF;
END $$;

-- Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bannerAlerts'
ORDER BY ordinal_position;
