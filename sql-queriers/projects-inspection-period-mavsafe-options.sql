-- MavSafe recurring inspection periods: fixed month intervals between inspections.
-- Apply to every live Supabase project (MAVSAFE, CAPCo, Rothco, …).
-- Code: public/data/config-mavsafe.json, src/lib/project-schedule.ts

UPDATE "public"."projects" SET "inspectionPeriod" = '3_months' WHERE "inspectionPeriod" = 'quarterly';
UPDATE "public"."projects" SET "inspectionPeriod" = '6_months' WHERE "inspectionPeriod" = 'semi_annual';
UPDATE "public"."projects" SET "inspectionPeriod" = '12_months' WHERE "inspectionPeriod" = 'yearly';
UPDATE "public"."projects" SET "inspectionPeriod" = '24_months' WHERE "inspectionPeriod" IN ('2_year', 'biennial');
UPDATE "public"."projects" SET "inspectionPeriod" = '36_months' WHERE "inspectionPeriod" = '3_year';
UPDATE "public"."projects" SET "inspectionPeriod" = '60_months' WHERE "inspectionPeriod" IN ('4_year', '5_year');
UPDATE "public"."projects" SET "inspectionPeriod" = '6_months' WHERE "inspectionPeriod" = '2x_year';
UPDATE "public"."projects" SET "inspectionPeriod" = '3_months' WHERE "inspectionPeriod" IN ('3x_year', '4x_year');
UPDATE "public"."projects" SET "inspectionPeriod" = '6_months' WHERE "inspectionPeriod" = '5x_year';

ALTER TABLE "public"."projects"
  DROP CONSTRAINT IF EXISTS "projects_inspectionPeriod_check";

ALTER TABLE "public"."projects"
  ADD CONSTRAINT "projects_inspectionPeriod_check"
  CHECK (
    "inspectionPeriod" IS NULL
    OR "inspectionPeriod" IN (
      '3_months',
      '6_months',
      '12_months',
      '18_months',
      '24_months',
      '36_months',
      '60_months'
    )
  );

COMMENT ON COLUMN "public"."projects"."inspectionPeriod" IS
  'Recurrence interval in months: 3_months, 6_months, 12_months, 18_months, 24_months, 36_months, 60_months.';
