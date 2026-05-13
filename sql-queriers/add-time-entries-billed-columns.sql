-- Same as supabase/migrations/20260508120000_time_entries_billed_invoice_link.sql
-- Run in Supabase SQL Editor if migrations are not applied remotely yet.

ALTER TABLE "public"."timeEntries"
  ADD COLUMN IF NOT EXISTS "billedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "billedInvoiceId" bigint REFERENCES "public"."invoices"("id") ON DELETE SET NULL;

COMMENT ON COLUMN "public"."timeEntries"."billedAt" IS 'Set when this session is included on an invoice line (labor billing)';
COMMENT ON COLUMN "public"."timeEntries"."billedInvoiceId" IS 'Invoice that includes this session';

CREATE INDEX IF NOT EXISTS "timeEntries_unbilled_project_idx"
  ON "public"."timeEntries" ("projectId", "startedAt")
  WHERE "endedAt" IS NOT NULL
    AND "billedAt" IS NULL
    AND "projectId" IS NOT NULL
    AND "projectId" <> 0;
