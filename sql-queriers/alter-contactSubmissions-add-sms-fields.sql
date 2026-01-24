-- Add SMS-related fields to contactSubmissions table
-- Run this in Supabase SQL Editor to add the new fields for SMS alerts and mobile carrier

-- Add smsAlerts column (boolean, defaults to false)
ALTER TABLE "contactSubmissions"
ADD COLUMN IF NOT EXISTS "smsAlerts" BOOLEAN DEFAULT false;

-- Add mobileCarrier column (text, nullable)
ALTER TABLE "contactSubmissions"
ADD COLUMN IF NOT EXISTS "mobileCarrier" TEXT;

-- Add comment to explain the fields
COMMENT ON COLUMN "contactSubmissions"."smsAlerts" IS 'Whether the user wants to receive SMS alerts for project updates';
COMMENT ON COLUMN "contactSubmissions"."mobileCarrier" IS 'Mobile carrier gateway domain (e.g., @vtext.com) for SMS-to-email';

-- Optional: Create an index on smsAlerts for efficient filtering
CREATE INDEX IF NOT EXISTS "idx_contactSubmissions_smsAlerts" 
ON "contactSubmissions"("smsAlerts") 
WHERE "smsAlerts" = true;

-- Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'contactSubmissions'
  AND column_name IN ('smsAlerts', 'mobileCarrier')
ORDER BY ordinal_position;
