-- Hourly pay rate on user profiles for payroll / time costing (camelCase column)
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "hourlyRate" numeric(12, 2);
