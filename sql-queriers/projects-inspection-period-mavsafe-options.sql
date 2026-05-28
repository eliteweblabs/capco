-- MavSafe recurring inspection periods: year-interval options (1–5 years between inspections).
-- Apply to every live Supabase project (MAVSAFE, CAPCo, Rothco, …) after deploy.
-- Code: public/data/config-mavsafe.json, src/lib/project-schedule.ts

UPDATE "public"."projects"
SET "inspectionPeriod" = '2_year'
WHERE "inspectionPeriod" = 'biennial';

-- If a mistaken per-year deploy saved these values, map to closest intervals
UPDATE "public"."projects"
SET "inspectionPeriod" = 'semi_annual'
WHERE "inspectionPeriod" = '2x_year';

UPDATE "public"."projects"
SET "inspectionPeriod" = 'quarterly'
WHERE "inspectionPeriod" IN ('3x_year', '4x_year', '5x_year');

ALTER TABLE "public"."projects"
  DROP CONSTRAINT IF EXISTS "projects_inspectionPeriod_check";

ALTER TABLE "public"."projects"
  ADD CONSTRAINT "projects_inspectionPeriod_check"
  CHECK (
    "inspectionPeriod" IS NULL
    OR "inspectionPeriod" IN (
      'quarterly',
      'semi_annual',
      'yearly',
      '2_year',
      '3_year',
      '4_year',
      '5_year'
    )
  );

COMMENT ON COLUMN "public"."projects"."inspectionPeriod" IS
  'Recurrence interval: quarterly, semi_annual, yearly (1 yr), 2_year … 5_year (N years between inspections).';
