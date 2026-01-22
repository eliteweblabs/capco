-- Fix filesGlobal sequence issue
-- This ensures the sequence exists and is properly configured

-- Create the sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS files_global_id_seq;

-- Make sure the filesGlobal table uses the sequence for id
ALTER TABLE "filesGlobal" 
  ALTER COLUMN "id" SET DEFAULT nextval('files_global_id_seq'::regclass);

-- Make sure id column is NOT NULL
ALTER TABLE "filesGlobal" 
  ALTER COLUMN "id" SET NOT NULL;

-- Set the sequence to the max id + 1 to avoid conflicts
SELECT setval('files_global_id_seq', COALESCE((SELECT MAX(id) FROM "filesGlobal"), 0) + 1, false);

-- Make sure the table has a primary key on id
ALTER TABLE "filesGlobal" DROP CONSTRAINT IF EXISTS "filesGlobal_pkey";
ALTER TABLE "filesGlobal" ADD PRIMARY KEY ("id");
