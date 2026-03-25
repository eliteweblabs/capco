-- ============================================
-- CAPCO OPS PIPELINE - Email → Tasks → Magic Links
-- ============================================

-- 1. EMAIL LOG — every processed email
CREATE TABLE IF NOT EXISTS "public"."emailLog" (
    "id" serial PRIMARY KEY,
    "projectId" integer REFERENCES "public"."projects"("id"),
    "fromEmail" text NOT NULL,
    "fromName" text,
    "toEmail" text,
    "subject" text,
    "bodyText" text,
    "bodyHtml" text,
    "attachments" jsonb DEFAULT '[]'::jsonb,
    "messageId" text,
    "threadId" text,
    "isProjectRelated" boolean DEFAULT false,
    "isProcessed" boolean DEFAULT false,
    "classification" text, -- 'info_request', 'document_needed', 'design_work', 'review_approval', 'scheduling', 'unknown'
    "classificationConfidence" real,
    "classificationDetails" jsonb DEFAULT '{}'::jsonb,
    "archivedAt" timestamptz,
    "createdAt" timestamptz DEFAULT now(),
    "updatedAt" timestamptz DEFAULT now()
);

COMMENT ON TABLE "public"."emailLog" IS 'Ingested emails from IMAP polling — parsed, classified, and linked to projects';

CREATE INDEX idx_email_log_project ON "public"."emailLog"("projectId");
CREATE INDEX idx_email_log_from ON "public"."emailLog"("fromEmail");
CREATE INDEX idx_email_log_processed ON "public"."emailLog"("isProcessed");

-- 2. TASKS — generated from emails or manually
CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" serial PRIMARY KEY,
    "projectId" integer REFERENCES "public"."projects"("id"),
    "emailLogId" integer REFERENCES "public"."emailLog"("id"),
    "title" text NOT NULL,
    "description" text,
    "type" text NOT NULL, -- 'info_request', 'document_generation', 'design_work', 'review', 'scheduling', 'client_upload', 'follow_up'
    "priority" text DEFAULT 'normal', -- 'urgent', 'normal', 'low'
    "status" text DEFAULT 'pending', -- 'pending', 'in_progress', 'waiting_client', 'waiting_designer', 'completed', 'dismissed'
    "assignedToId" uuid REFERENCES "auth"."users"("id"),
    "assignedToName" text,
    "dueDate" timestamptz,
    "completedAt" timestamptz,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "createdAt" timestamptz DEFAULT now(),
    "updatedAt" timestamptz DEFAULT now()
);

COMMENT ON TABLE "public"."tasks" IS 'Actionable tasks derived from emails or created manually — core of the ops pipeline';

CREATE INDEX idx_tasks_project ON "public"."tasks"("projectId");
CREATE INDEX idx_tasks_status ON "public"."tasks"("status");
CREATE INDEX idx_tasks_assigned ON "public"."tasks"("assignedToId");
CREATE INDEX idx_tasks_priority ON "public"."tasks"("priority");

-- 3. CLIENT MAGIC LINKS — one-pager tokens for client actions
CREATE TABLE IF NOT EXISTS "public"."clientMagicLinks" (
    "id" serial PRIMARY KEY,
    "token" varchar(64) NOT NULL UNIQUE,
    "projectId" integer REFERENCES "public"."projects"("id"),
    "taskId" integer REFERENCES "public"."tasks"("id"),
    "clientEmail" text,
    "clientPhone" text,
    "clientName" text,
    "linkType" text NOT NULL, -- 'upload_docs', 'review_approve', 'fill_form', 'schedule', 'info_response'
    "pageData" jsonb NOT NULL DEFAULT '{}'::jsonb, -- what to show: required items, pre-filled fields, etc.
    "responseData" jsonb, -- what the client submitted back
    "status" text DEFAULT 'pending', -- 'pending', 'viewed', 'partial', 'completed', 'expired'
    "viewedAt" timestamptz,
    "completedAt" timestamptz,
    "expiresAt" timestamptz NOT NULL,
    "createdAt" timestamptz DEFAULT now(),
    "updatedAt" timestamptz DEFAULT now()
);

COMMENT ON TABLE "public"."clientMagicLinks" IS 'Token-based one-pager links sent to clients via SMS/email — no login required';

CREATE UNIQUE INDEX idx_client_magic_token ON "public"."clientMagicLinks"("token");
CREATE INDEX idx_client_magic_project ON "public"."clientMagicLinks"("projectId");
CREATE INDEX idx_client_magic_status ON "public"."clientMagicLinks"("status");

-- 4. CLIENT UPLOADS — files uploaded via magic links
CREATE TABLE IF NOT EXISTS "public"."clientUploads" (
    "id" serial PRIMARY KEY,
    "magicLinkId" integer REFERENCES "public"."clientMagicLinks"("id"),
    "projectId" integer REFERENCES "public"."projects"("id"),
    "requirementKey" text, -- which requirement this fulfills: 'floor_plans', 'water_supply', 'occupancy_info', etc.
    "fileName" text NOT NULL,
    "filePath" text NOT NULL, -- path in Supabase storage
    "fileSize" integer,
    "mimeType" text,
    "isValid" boolean, -- post-upload validation
    "validationNotes" text,
    "createdAt" timestamptz DEFAULT now()
);

COMMENT ON TABLE "public"."clientUploads" IS 'Files uploaded by clients through magic link one-pagers';

CREATE INDEX idx_client_uploads_project ON "public"."clientUploads"("projectId");
CREATE INDEX idx_client_uploads_magic ON "public"."clientUploads"("magicLinkId");

-- 5. PROJECT REQUIREMENTS — checklist of what's needed per project
CREATE TABLE IF NOT EXISTS "public"."projectRequirements" (
    "id" serial PRIMARY KEY,
    "projectId" integer REFERENCES "public"."projects"("id"),
    "requirementKey" text NOT NULL, -- 'floor_plans', 'occupancy_info', 'water_supply', 'existing_system', 'ahj_forms', etc.
    "label" text NOT NULL, -- human-readable: "Floor Plans (PDF or DWG)"
    "description" text, -- help text for the client
    "isRequired" boolean DEFAULT true,
    "isMet" boolean DEFAULT false,
    "metAt" timestamptz,
    "metBy" text, -- 'client_upload', 'email_attachment', 'manual', 'existing'
    "fileId" integer, -- link to clientUploads or files table
    "notes" text,
    "createdAt" timestamptz DEFAULT now(),
    "updatedAt" timestamptz DEFAULT now()
);

COMMENT ON TABLE "public"."projectRequirements" IS 'Per-project checklist of required documents and info — drives magic link upload pages';

CREATE INDEX idx_proj_req_project ON "public"."projectRequirements"("projectId");
CREATE UNIQUE INDEX idx_proj_req_unique ON "public"."projectRequirements"("projectId", "requirementKey");

-- 6. SMS LOG — track all outbound SMS
CREATE TABLE IF NOT EXISTS "public"."smsLog" (
    "id" serial PRIMARY KEY,
    "toPhone" text NOT NULL,
    "fromPhone" text,
    "body" text NOT NULL,
    "twilioSid" text, -- Twilio message SID for tracking
    "status" text DEFAULT 'queued', -- 'queued', 'sent', 'delivered', 'failed', 'undelivered'
    "direction" text DEFAULT 'outbound', -- 'outbound', 'inbound'
    "projectId" integer REFERENCES "public"."projects"("id"),
    "taskId" integer REFERENCES "public"."tasks"("id"),
    "magicLinkId" integer REFERENCES "public"."clientMagicLinks"("id"),
    "errorMessage" text,
    "cost" numeric(6,4),
    "createdAt" timestamptz DEFAULT now(),
    "updatedAt" timestamptz DEFAULT now()
);

COMMENT ON TABLE "public"."smsLog" IS 'All SMS sent/received via Twilio — for audit trail and delivery tracking';

CREATE INDEX idx_sms_log_phone ON "public"."smsLog"("toPhone");
CREATE INDEX idx_sms_log_project ON "public"."smsLog"("projectId");

-- 7. FOLLOW-UP SCHEDULE — automated nag cadence
CREATE TABLE IF NOT EXISTS "public"."followUps" (
    "id" serial PRIMARY KEY,
    "taskId" integer REFERENCES "public"."tasks"("id"),
    "magicLinkId" integer REFERENCES "public"."clientMagicLinks"("id"),
    "projectId" integer REFERENCES "public"."projects"("id"),
    "targetType" text NOT NULL, -- 'client', 'designer', 'jay'
    "targetEmail" text,
    "targetPhone" text,
    "targetName" text,
    "channel" text NOT NULL, -- 'sms', 'email', 'slack'
    "scheduledAt" timestamptz NOT NULL,
    "sentAt" timestamptz,
    "escalationLevel" integer DEFAULT 1, -- 1=friendly, 2=firm, 3=escalate to Jay
    "messageTemplate" text, -- which message to send
    "status" text DEFAULT 'scheduled', -- 'scheduled', 'sent', 'cancelled', 'skipped'
    "cancelledReason" text, -- 'task_completed', 'manual', etc.
    "createdAt" timestamptz DEFAULT now()
);

COMMENT ON TABLE "public"."followUps" IS 'Scheduled follow-ups for clients and designers — auto-nag cadence';

CREATE INDEX idx_followups_scheduled ON "public"."followUps"("scheduledAt") WHERE "status" = 'scheduled';
CREATE INDEX idx_followups_task ON "public"."followUps"("taskId");

-- 8. DOCUMENT GENERATION LOG — track AI-generated docs
CREATE TABLE IF NOT EXISTS "public"."docGenLog" (
    "id" serial PRIMARY KEY,
    "projectId" integer REFERENCES "public"."projects"("id"),
    "taskId" integer REFERENCES "public"."tasks"("id"),
    "templateType" text NOT NULL, -- 'narrative', 'affidavit', 'nfpa241', 'letter', 'proposal'
    "templateVariant" text, -- '13R_non_boston', '13_commercial', etc.
    "inputData" jsonb NOT NULL DEFAULT '{}'::jsonb, -- fields used to generate
    "outputPath" text, -- path in Supabase storage
    "outputFormat" text DEFAULT 'pdf', -- 'pdf', 'docx'
    "status" text DEFAULT 'draft', -- 'draft', 'approved', 'sent', 'revision_needed'
    "approvedBy" uuid REFERENCES "auth"."users"("id"),
    "approvedAt" timestamptz,
    "sentTo" text, -- email address it was sent to
    "sentAt" timestamptz,
    "createdAt" timestamptz DEFAULT now(),
    "updatedAt" timestamptz DEFAULT now()
);

COMMENT ON TABLE "public"."docGenLog" IS 'AI-generated documents — narratives, affidavits, NFPA 241 plans, letters';

CREATE INDEX idx_docgen_project ON "public"."docGenLog"("projectId");
CREATE INDEX idx_docgen_type ON "public"."docGenLog"("templateType");

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE "public"."emailLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."clientMagicLinks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."clientUploads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."projectRequirements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."smsLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."followUps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."docGenLog" ENABLE ROW LEVEL SECURITY;

-- Admin (authenticated) can do everything
CREATE POLICY "admin_all_emailLog" ON "public"."emailLog" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_tasks" ON "public"."tasks" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_clientMagicLinks" ON "public"."clientMagicLinks" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_clientUploads" ON "public"."clientUploads" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_projectRequirements" ON "public"."projectRequirements" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_smsLog" ON "public"."smsLog" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_followUps" ON "public"."followUps" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_docGenLog" ON "public"."docGenLog" FOR ALL USING (auth.role() = 'authenticated');

-- Anon access for magic link pages (client-facing, token-validated in app code)
CREATE POLICY "anon_read_clientMagicLinks" ON "public"."clientMagicLinks" FOR SELECT USING (auth.role() = 'anon');
CREATE POLICY "anon_update_clientMagicLinks" ON "public"."clientMagicLinks" FOR UPDATE USING (auth.role() = 'anon');
CREATE POLICY "anon_insert_clientUploads" ON "public"."clientUploads" FOR INSERT WITH CHECK (auth.role() = 'anon');
CREATE POLICY "anon_read_projectRequirements" ON "public"."projectRequirements" FOR SELECT USING (auth.role() = 'anon');

-- STORAGE: Allow anon uploads to client-uploads path (for magic link pages)
CREATE POLICY "anon_client_uploads" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'project-media' 
  AND auth.role() = 'anon' 
  AND name LIKE 'projects/%/client-uploads/%'
);

CREATE POLICY "anon_client_uploads_read" ON storage.objects FOR SELECT 
USING (
  bucket_id = 'project-media' 
  AND name LIKE 'projects/%/client-uploads/%'
);
