-- Migration: Update contactSubmissions table for SMS alerts and carrier
-- Run this if you already have the contactSubmissions table

-- Step 1: Rename smsConsent to smsAlerts
ALTER TABLE "contactSubmissions" 
  RENAME COLUMN "smsConsent" TO "smsAlerts";

-- Step 2: Add mobileCarrier column
ALTER TABLE "contactSubmissions"
  ADD COLUMN IF NOT EXISTS "mobileCarrier" TEXT;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN "contactSubmissions"."smsAlerts" IS 'Whether user opted in for SMS notifications (not marketing)';
COMMENT ON COLUMN "contactSubmissions"."mobileCarrier" IS 'Mobile carrier ID (e.g., verizon, att, tmobile) - required if smsAlerts is true';

-- Verification query
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'contactSubmissions'
  AND column_name IN ('smsAlerts', 'mobileCarrier')
ORDER BY ordinal_position;
