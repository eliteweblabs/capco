-- Prevent double-billing labor: mark time entries when rolled onto an invoice.
ALTER TABLE "public"."timeEntries"
  ADD COLUMN IF NOT EXISTS "billedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "billedInvoiceId" bigint REFERENCES "public"."invoices"("id") ON DELETE SET NULL;

COMMENT ON COLUMN "public"."timeEntries"."billedAt" IS 'Set when this session is included on an invoice line (labor billing)';
COMMENT ON COLUMN "public"."timeEntries"."billedInvoiceId" IS 'Invoice that includes this session (append-only labor lines)';

CREATE INDEX IF NOT EXISTS "timeEntries_unbilled_project_idx"
  ON "public"."timeEntries" ("projectId", "startedAt")
  WHERE "endedAt" IS NOT NULL
    AND "billedAt" IS NULL
    AND "projectId" IS NOT NULL
    AND "projectId" <> 0;
