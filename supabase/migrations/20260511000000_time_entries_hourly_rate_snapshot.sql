-- Hourly rate at check-in — frozen for payroll if profile.hourlyRate changes later
ALTER TABLE "public"."timeEntries"
  ADD COLUMN IF NOT EXISTS "hourlyRateSnapshot" numeric(12, 2);

COMMENT ON COLUMN "public"."timeEntries"."hourlyRateSnapshot" IS 'profiles.hourlyRate copied when the interval starts (check-in); used for costing';
