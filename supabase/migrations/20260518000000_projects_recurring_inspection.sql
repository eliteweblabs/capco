-- =============================================================================
-- Recurring inspection metadata on projects
--
-- Phase 2 of the calendar/scheduling feature (MAVSAFE only initially).
-- Adds four nullable columns to `projects` so admins/staff can flag a project
-- as a recurring inspection and pick a period + start date. `nextInspectionAt`
-- is editable; on insert/update it auto-defaults to `inspectionStartDate` only
-- when it is NULL (so manual overrides from admins are never clobbered).
--
-- See markdowns/ for the broader plan. No app code changes here.
-- =============================================================================

ALTER TABLE "public"."projects"
  ADD COLUMN IF NOT EXISTS "isInspection" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "inspectionPeriod" text,
  ADD COLUMN IF NOT EXISTS "inspectionStartDate" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "nextInspectionAt" timestamp with time zone;

-- Allowed period values mirror the projectForm button-group in
-- public/data/config-mavsafe.json. NULL is allowed for non-inspection rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_inspectionPeriod_check'
  ) THEN
    ALTER TABLE "public"."projects"
      ADD CONSTRAINT "projects_inspectionPeriod_check"
      CHECK (
        "inspectionPeriod" IS NULL
        OR "inspectionPeriod" IN ('quarterly', 'semi_annual', 'yearly', 'biennial')
      );
  END IF;
END$$;

-- Default nextInspectionAt to inspectionStartDate when an admin enables
-- the inspection toggle without providing a separate next-date.
-- The IS NULL guard means manual overrides are preserved on subsequent saves.
CREATE OR REPLACE FUNCTION public.default_next_inspection_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."isInspection" IS TRUE
     AND NEW."nextInspectionAt" IS NULL
     AND NEW."inspectionStartDate" IS NOT NULL THEN
    NEW."nextInspectionAt" := NEW."inspectionStartDate";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS default_next_inspection_at_trg ON public.projects;
CREATE TRIGGER default_next_inspection_at_trg
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.default_next_inspection_at();

-- Partial index for the upcoming /admin/schedule calendar query
-- (only indexes rows that actually participate in the recurring schedule).
CREATE INDEX IF NOT EXISTS idx_projects_next_inspection
  ON public.projects ("nextInspectionAt")
  WHERE "isInspection" = true;

COMMENT ON COLUMN "public"."projects"."isInspection" IS
  'When true, this project represents a recurring inspection. Drives /admin/schedule.';
COMMENT ON COLUMN "public"."projects"."inspectionPeriod" IS
  'Recurrence interval. One of: quarterly, semi_annual, yearly, biennial.';
COMMENT ON COLUMN "public"."projects"."inspectionStartDate" IS
  'Anchor date of the first inspection in the series. Historical; do not auto-advance.';
COMMENT ON COLUMN "public"."projects"."nextInspectionAt" IS
  'Next scheduled inspection. Editable. Defaults to inspectionStartDate on insert/update when NULL.';
