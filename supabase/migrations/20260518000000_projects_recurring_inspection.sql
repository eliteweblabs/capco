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

-- iCal-style anchor model: inspectionStartDate is the DTSTART of the series,
-- inspectionPeriod is the RRULE interval, and nextInspectionAt is a cached
-- pointer that mirrors the anchor (advanced independently later when a
-- "completed inspection" workflow is added).
--
-- On INSERT or first-time enable: default the anchor to now() so the project
-- appears on today's calendar cell immediately, with no extra admin step.
-- nextInspectionAt mirrors the anchor on first save.
CREATE OR REPLACE FUNCTION public.default_next_inspection_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."isInspection" IS TRUE THEN
    IF NEW."inspectionStartDate" IS NULL THEN
      NEW."inspectionStartDate" := now();
    END IF;
    IF NEW."nextInspectionAt" IS NULL THEN
      NEW."nextInspectionAt" := NEW."inspectionStartDate";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS default_next_inspection_at_trg ON public.projects;
CREATE TRIGGER default_next_inspection_at_trg
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.default_next_inspection_at();

-- On UPDATE: when the admin moves the anchor (from the project form or by
-- editing/dragging a chip on /admin/schedule), reset the series pointer so
-- all derived future occurrences shift with the new anchor.
CREATE OR REPLACE FUNCTION public.sync_next_inspection_on_anchor_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."isInspection" IS TRUE
     AND NEW."inspectionStartDate" IS DISTINCT FROM OLD."inspectionStartDate" THEN
    NEW."nextInspectionAt" := NEW."inspectionStartDate";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_next_inspection_on_anchor_change_trg ON public.projects;
CREATE TRIGGER sync_next_inspection_on_anchor_change_trg
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_next_inspection_on_anchor_change();

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
