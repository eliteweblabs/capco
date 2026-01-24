-- Fix Critical RLS Security Issues
-- Generated: 2026-01-23
-- This migration addresses all ERROR-level RLS issues found by Supabase security advisor

-- ============================================================================
-- 1. ENABLE RLS ON TABLES THAT DON'T HAVE IT
-- ============================================================================

-- Enable RLS on projectStatuses (has policies but RLS disabled)
ALTER TABLE public."projectStatuses" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on public tables without RLS
ALTER TABLE public."cmsPages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."directMessages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."documentComponents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."documentTemplates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."filesGlobal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."fileVersions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."fileCheckoutHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."subjects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."templateComponentMapping" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CREATE RLS POLICIES FOR cmsPages
-- ============================================================================

-- Everyone can read active CMS pages
CREATE POLICY "Anyone can read active CMS pages"
  ON public."cmsPages"
  FOR SELECT
  USING (
    "isActive" = true
  );

-- Admins can do everything with CMS pages
CREATE POLICY "Admins can manage CMS pages"
  ON public."cmsPages"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- ============================================================================
-- 3. CREATE RLS POLICIES FOR directMessages
-- ============================================================================

-- Users can read messages they sent or received
CREATE POLICY "Users can read their own messages"
  ON public."directMessages"
  FOR SELECT
  USING (
    auth.uid() = "fromUser" OR auth.uid() = "toUser"
  );

-- Users can send messages
CREATE POLICY "Authenticated users can send messages"
  ON public."directMessages"
  FOR INSERT
  WITH CHECK (
    auth.uid() = "fromUser"
  );

-- Users can delete their own sent messages
CREATE POLICY "Users can delete their sent messages"
  ON public."directMessages"
  FOR UPDATE
  USING (
    auth.uid() = "fromUser"
  )
  WITH CHECK (
    auth.uid() = "fromUser"
  );

-- Admins can see all messages
CREATE POLICY "Admins can view all messages"
  ON public."directMessages"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- ============================================================================
-- 4. CREATE RLS POLICIES FOR documentComponents
-- ============================================================================

-- Authenticated users can read document components
CREATE POLICY "Authenticated users can read document components"
  ON public."documentComponents"
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage document components
CREATE POLICY "Admins can manage document components"
  ON public."documentComponents"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- ============================================================================
-- 5. CREATE RLS POLICIES FOR documentTemplates
-- ============================================================================

-- Authenticated users can read active templates
CREATE POLICY "Authenticated users can read active templates"
  ON public."documentTemplates"
  FOR SELECT
  TO authenticated
  USING ("isActive" = true);

-- Admins can manage templates
CREATE POLICY "Admins can manage templates"
  ON public."documentTemplates"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- ============================================================================
-- 6. CREATE RLS POLICIES FOR filesGlobal
-- ============================================================================

-- Authenticated users can read global files
CREATE POLICY "Authenticated users can read global files"
  ON public."filesGlobal"
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage global files
CREATE POLICY "Admins can manage global files"
  ON public."filesGlobal"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- ============================================================================
-- 7. CREATE RLS POLICIES FOR fileVersions
-- ============================================================================

-- Users can view versions of files they have access to (via files table RLS)
CREATE POLICY "Users can view file versions for accessible files"
  ON public."fileVersions"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = "fileVersions"."fileId"
      -- This will respect the RLS policies on the files table
    )
  );

-- Admins can view all file versions
CREATE POLICY "Admins can view all file versions"
  ON public."fileVersions"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Users can create versions when uploading new versions of their files
CREATE POLICY "Users can create file versions"
  ON public."fileVersions"
  FOR INSERT
  WITH CHECK (
    auth.uid() = "uploadedBy" AND
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = "fileVersions"."fileId"
      -- Respects files table RLS
    )
  );

-- Admins can manage all file versions
CREATE POLICY "Admins can manage file versions"
  ON public."fileVersions"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- ============================================================================
-- 8. CREATE RLS POLICIES FOR fileCheckoutHistory
-- ============================================================================

-- Users can view checkout history for files they have access to
CREATE POLICY "Users can view checkout history for accessible files"
  ON public."fileCheckoutHistory"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = "fileCheckoutHistory"."fileId"
    )
  );

-- Admins can view all checkout history
CREATE POLICY "Admins can view all checkout history"
  ON public."fileCheckoutHistory"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- System can insert checkout history (triggered by checkout/checkin actions)
CREATE POLICY "Authenticated users can create checkout history"
  ON public."fileCheckoutHistory"
  FOR INSERT
  WITH CHECK (
    auth.uid() = "userId"
  );

-- ============================================================================
-- 9. CREATE RLS POLICIES FOR subjects
-- ============================================================================

-- Everyone can read active subjects
CREATE POLICY "Anyone can read active subjects"
  ON public."subjects"
  FOR SELECT
  USING ("isActive" = true);

-- Admins can manage subjects
CREATE POLICY "Admins can manage subjects"
  ON public."subjects"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- ============================================================================
-- 10. CREATE RLS POLICIES FOR templateComponentMapping
-- ============================================================================

-- Authenticated users can read template mappings
CREATE POLICY "Authenticated users can read template mappings"
  ON public."templateComponentMapping"
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage template mappings
CREATE POLICY "Admins can manage template mappings"
  ON public."templateComponentMapping"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- ============================================================================
-- 11. ADD POLICIES FOR TABLES WITH RLS ENABLED BUT NO POLICIES
-- ============================================================================

-- ai_agent_project_memory: Users can read/write their own project memory
CREATE POLICY "Users can manage their project memory"
  ON public."ai_agent_project_memory"
  FOR ALL
  USING (
    auth.uid() = "authorId"
  )
  WITH CHECK (
    auth.uid() = "authorId"
  );

CREATE POLICY "Admins can view all project memory"
  ON public."ai_agent_project_memory"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- ai_generated_documents: Users can read/write their own AI documents
CREATE POLICY "Users can manage their AI documents"
  ON public."ai_generated_documents"
  FOR ALL
  USING (
    auth.uid() = "authorId"
  )
  WITH CHECK (
    auth.uid() = "authorId"
  );

CREATE POLICY "Admins can view all AI documents"
  ON public."ai_generated_documents"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- ai_generations: Users can read generations for their documents
CREATE POLICY "Users can view AI generations for their documents"
  ON public."ai_generations"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."ai_generated_documents" d
      WHERE d.id = "ai_generations"."documentId"
      AND d."authorId" = auth.uid()
    )
  );

CREATE POLICY "System can create AI generations"
  ON public."ai_generations"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all AI generations"
  ON public."ai_generations"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- bannerAlerts: Everyone can read active alerts
CREATE POLICY "Anyone can read active banner alerts"
  ON public."bannerAlerts"
  FOR SELECT
  USING (
    "isActive" = true AND
    (
      "startDate" IS NULL OR "startDate" <= now()
    ) AND
    (
      "endDate" IS NULL OR "endDate" >= now()
    )
  );

CREATE POLICY "Admins can manage banner alerts"
  ON public."bannerAlerts"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- demo_bookings: Users can create demo bookings
CREATE POLICY "Anyone can create demo bookings"
  ON public."demo_bookings"
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage demo bookings"
  ON public."demo_bookings"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- discussion: Users can view discussions for their projects
CREATE POLICY "Users can view discussions for their projects"
  ON public."discussion"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "discussion"."projectId"
      AND (
        p."authorId" = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'Admin'
        )
      )
    )
  );

CREATE POLICY "Users can create discussions on their projects"
  ON public."discussion"
  FOR INSERT
  WITH CHECK (
    auth.uid() = "authorId" AND
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "discussion"."projectId"
      AND (
        p."authorId" = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'Admin'
        )
      )
    )
  );

CREATE POLICY "Users can update their own discussions"
  ON public."discussion"
  FOR UPDATE
  USING (
    auth.uid() = "authorId"
  )
  WITH CHECK (
    auth.uid() = "authorId"
  );

CREATE POLICY "Admins can manage all discussions"
  ON public."discussion"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- generatedDocuments: Similar to AI documents
CREATE POLICY "Users can view their generated documents"
  ON public."generatedDocuments"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "generatedDocuments"."projectId"
      AND (
        p."authorId" = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'Admin'
        )
      )
    )
  );

CREATE POLICY "Admins can manage generated documents"
  ON public."generatedDocuments"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- invoices: Users can view invoices for their projects
CREATE POLICY "Users can view their project invoices"
  ON public."invoices"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "invoices"."projectId"
      AND (
        p."authorId" = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'Admin'
        )
      )
    )
  );

CREATE POLICY "Admins can manage invoices"
  ON public."invoices"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- magicLinkTokens: System only (service_role should handle this)
CREATE POLICY "Service role can manage magic link tokens"
  ON public."magicLinkTokens"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- payments: Users can view payments for their invoices
CREATE POLICY "Users can view their payments"
  ON public."payments"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."invoices" i
      JOIN public.projects p ON p.id = i."projectId"
      WHERE i.id = "payments"."invoiceId"
      AND (
        p."authorId" = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'Admin'
        )
      )
    )
  );

CREATE POLICY "Admins can manage payments"
  ON public."payments"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- projectItemTemplates: Admins only
CREATE POLICY "Admins can manage project item templates"
  ON public."projectItemTemplates"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

CREATE POLICY "Authenticated users can view project item templates"
  ON public."projectItemTemplates"
  FOR SELECT
  TO authenticated
  USING ("enabled" = true);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This migration:
-- 1. Enables RLS on 10 tables that didn't have it
-- 2. Adds appropriate policies for all tables
-- 3. Follows the principle of least privilege
-- 4. Ensures Admins have full access
-- 5. Ensures Clients only see their own data
-- 6. Protects sensitive system tables (magicLinkTokens)
