-- Time entries for billing: one row per check-in session (startedAt set, endedAt set on check-out)
CREATE TABLE IF NOT EXISTS "public"."timeEntries" (
  "id" serial PRIMARY KEY,
  "userId" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  "projectId" integer REFERENCES "public"."projects"("id") ON DELETE SET NULL,
  "startedAt" timestamptz NOT NULL DEFAULT now(),
  "endedAt" timestamptz,
  "notes" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE "public"."timeEntries" IS 'Billing timer sessions: check-in starts a row, check-out sets endedAt';
COMMENT ON COLUMN "public"."timeEntries"."projectId" IS 'Optional project for this session; null = general check-in';

CREATE INDEX IF NOT EXISTS "timeEntries_userId_idx" ON "public"."timeEntries" ("userId");
CREATE INDEX IF NOT EXISTS "timeEntries_projectId_idx" ON "public"."timeEntries" ("projectId");
CREATE INDEX IF NOT EXISTS "timeEntries_startedAt_idx" ON "public"."timeEntries" ("startedAt");
CREATE INDEX IF NOT EXISTS "timeEntries_endedAt_idx" ON "public"."timeEntries" ("endedAt") WHERE "endedAt" IS NOT NULL;

-- Location pings: periodic lat/lng from client while checked in (for live dashboard)
CREATE TABLE IF NOT EXISTS "public"."locationPings" (
  "id" serial PRIMARY KEY,
  "userId" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  "timeEntryId" integer REFERENCES "public"."timeEntries"("id") ON DELETE SET NULL,
  "projectId" integer REFERENCES "public"."projects"("id") ON DELETE SET NULL,
  "lat" double precision NOT NULL,
  "lng" double precision NOT NULL,
  "accuracy" double precision,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE "public"."locationPings" IS 'Periodic location updates from team members while checked in; admins see live on dashboard';

CREATE INDEX IF NOT EXISTS "locationPings_userId_idx" ON "public"."locationPings" ("userId");
CREATE INDEX IF NOT EXISTS "locationPings_timeEntryId_idx" ON "public"."locationPings" ("timeEntryId");
CREATE INDEX IF NOT EXISTS "locationPings_createdAt_idx" ON "public"."locationPings" ("createdAt");

-- RLS
ALTER TABLE "public"."timeEntries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."locationPings" ENABLE ROW LEVEL SECURITY;

-- timeEntries: user can CRUD own; admins can read all
CREATE POLICY "timeEntries_select_own" ON "public"."timeEntries"
  FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "timeEntries_insert_own" ON "public"."timeEntries"
  FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "timeEntries_update_own" ON "public"."timeEntries"
  FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "timeEntries_select_admin" ON "public"."timeEntries"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "public"."profiles" WHERE id = auth.uid() AND role = 'Admin')
  );

-- locationPings: user can insert own; user and admins can read (for dashboard)
CREATE POLICY "locationPings_insert_own" ON "public"."locationPings"
  FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "locationPings_select_own" ON "public"."locationPings"
  FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "locationPings_select_admin" ON "public"."locationPings"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "public"."profiles" WHERE id = auth.uid() AND role = 'Admin')
  );
