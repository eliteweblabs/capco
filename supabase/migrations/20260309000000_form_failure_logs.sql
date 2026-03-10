-- Form failure logs for monitoring and debugging
-- Stores client-reported form submission failures for admin review

CREATE TABLE IF NOT EXISTS "public"."formFailureLogs" (
  "id" serial PRIMARY KEY,
  "formId" character varying(100),
  "formAction" character varying(500),
  "error" text NOT NULL,
  "statusCode" integer,
  "context" jsonb,
  "userAgent" character varying(500),
  "createdAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_failure_logs_created_at ON "public"."formFailureLogs" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_form_failure_logs_form_id ON "public"."formFailureLogs" ("formId");

-- RLS: Admins can read; API (service role) can insert
ALTER TABLE "public"."formFailureLogs" ENABLE ROW LEVEL SECURITY;

-- Service role can insert (used by API)
CREATE POLICY "form_failure_logs_service_insert"
  ON "public"."formFailureLogs"
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Authenticated admins can read
CREATE POLICY "form_failure_logs_admin_select"
  ON "public"."formFailureLogs"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "profiles"
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Admin', 'superAdmin')
    )
  );

COMMENT ON TABLE "public"."formFailureLogs" IS 'Client-side form submission failures for monitoring and debugging';
