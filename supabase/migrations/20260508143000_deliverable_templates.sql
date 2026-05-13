-- PDF deliverable templates: metadata for AcroForm-based fill (shortcodes map to field names).
CREATE TABLE IF NOT EXISTS "public"."deliverableTemplates" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "storageBucket" text DEFAULT 'deliverable-templates'::text NOT NULL,
    "storagePath" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "deliverableTemplates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "deliverableTemplates_storagePath_bucket_key" UNIQUE ("storageBucket", "storagePath")
);

ALTER TABLE "public"."deliverableTemplates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deliverableTemplates_select_staff"
    ON "public"."deliverableTemplates"
    FOR SELECT
    TO authenticated
    USING (public.is_admin_or_staff());

CREATE POLICY "deliverableTemplates_write_admin"
    ON "public"."deliverableTemplates"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM "public"."profiles" p
            WHERE p.id = auth.uid()
              AND p.role IN ('Admin', 'superAdmin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM "public"."profiles" p
            WHERE p.id = auth.uid()
              AND p.role IN ('Admin', 'superAdmin')
        )
    );

GRANT ALL ON TABLE "public"."deliverableTemplates" TO service_role;

-- Private bucket for template PDFs (filled output is generated on demand, not stored here).
INSERT INTO storage.buckets (id, name, public)
VALUES ('deliverable-templates', 'deliverable-templates', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "deliverable_templates_storage_read_staff"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'deliverable-templates'::text AND public.is_admin_or_staff()
    );

CREATE POLICY "deliverable_templates_storage_write_admin"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'deliverable-templates'::text
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('Admin', 'superAdmin')
        )
    );

CREATE POLICY "deliverable_templates_storage_update_admin"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'deliverable-templates'::text
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('Admin', 'superAdmin')
        )
    );

CREATE POLICY "deliverable_templates_storage_delete_admin"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'deliverable-templates'::text
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('Admin', 'superAdmin')
        )
    );
