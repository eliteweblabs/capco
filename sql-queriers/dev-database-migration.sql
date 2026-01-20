-- =====================================================
-- CAPCO Design Group - Development Database Setup
-- =====================================================
-- Run this entire script in your NEW development Supabase project
-- SQL Editor: Copy and paste this entire file, then click "Run"
-- NOTE: Uses camelCase column names to match production database

-- =====================================================
-- DROP EXISTING TABLES (in correct order for foreign keys)
-- =====================================================
-- WARNING: This will DELETE ALL DATA in these tables!

-- Drop tables with foreign key dependencies first (children before parents)
DROP TABLE IF EXISTS documentComponents CASCADE;
DROP TABLE IF EXISTS template_component_mapping CASCADE;
DROP TABLE IF EXISTS generated_documents CASCADE;
DROP TABLE IF EXISTS pdf_components CASCADE;
DROP TABLE IF EXISTS pdf_templates CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS "fileCheckoutHistory" CASCADE;
DROP TABLE IF EXISTS "fileVersions" CASCADE;
DROP TABLE IF EXISTS files_global CASCADE;
DROP TABLE IF EXISTS punchlist CASCADE;
DROP TABLE IF EXISTS discussion CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS directMessages CASCADE;
DROP TABLE IF EXISTS chatMessages CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS demo_bookings CASCADE;
DROP TABLE IF EXISTS project_statuses CASCADE;
DROP TABLE IF EXISTS invoice_subject_lines CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS subject_catalog CASCADE;
DROP TABLE IF EXISTS line_items_catalog CASCADE;
DROP TABLE IF EXISTS global_options CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Also drop any old snake_case table names that might exist
DROP TABLE IF EXISTS file_checkout_history CASCADE;
DROP TABLE IF EXISTS file_versions CASCADE;

-- =====================================================
-- TABLES
-- =====================================================

-- profiles table (CRITICAL - must be first)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  "firstName" text,
  "lastName" text,
  "companyName" text,
  phone text,
  role text DEFAULT 'Client',
  "smsAlerts" boolean DEFAULT false,
  "mobileCarrier" text,
  "avatarUrl" text,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- projects table
CREATE TABLE IF NOT EXISTS projects (
  id serial PRIMARY KEY,
  "authorId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  address text,
  description text,
  status integer DEFAULT 0,
  "sqFt" integer,
  "newConstruction" boolean DEFAULT false,
  units integer,
  featured boolean DEFAULT false,
  architect text,
  subject text,
  "nfpaVersion" text,
  "exteriorBeacon" text,
  "siteAccess" text,
  "fireSprinklerInstallation" text,
  "hazardousMaterial" text,
  "commencementOfConstruction" text,
  "suppressionDetectionSystems" text,
  "buildingHeight" text,
  "floorsBelowGrade" text,
  "hpsCommodities" text,
  "proposalSignature" text,
  "contractPdfUrl" text,
  "featuredImageId" text,
  "featuredImageData" jsonb,
  "assignedToId" uuid REFERENCES auth.users(id),
  "assignedToName" text,
  "statusName" text,
  "statusSlug" text,
  "incompleteDiscussions" integer DEFAULT 0,
  "punchlistCount" bigint DEFAULT 0,
  "dueDate" timestamp with time zone,
  "elapsedTime" interval,
  "signedAt" timestamp with time zone,
  "requestedDocs" jsonb,
  service jsonb,
  project jsonb,
  building jsonb,
  tier jsonb,
  "fireProtectionSystemType" jsonb,
  log jsonb,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- files table
CREATE TABLE IF NOT EXISTS files (
  id serial PRIMARY KEY,
  "projectId" integer REFERENCES projects(id) ON DELETE CASCADE,
  "authorId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  "fileName" text,
  "filePath" text,
  "fileSize" bigint,
  "fileType" text,
  status text,
  title text,
  comments text,
  "targetId" integer,
  "targetLocation" text,
  "bucketName" text,
  "checkedOutBy" uuid REFERENCES auth.users(id),
  "checkedOutAt" timestamp with time zone,
  "checkoutNotes" text,
  "assignedTo" uuid REFERENCES auth.users(id),
  "assignedAt" timestamp with time zone,
  "versionNumber" integer DEFAULT 1,
  "previousVersionId" integer,
  "isCurrentVersion" boolean DEFAULT true,
  "isPrivate" boolean DEFAULT false,
  "uploadedAt" timestamp without time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- discussion table
CREATE TABLE IF NOT EXISTS discussion (
  id bigserial PRIMARY KEY,
  "projectId" integer REFERENCES projects(id) ON DELETE CASCADE,
  "authorId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  "parentId" integer REFERENCES discussion(id) ON DELETE CASCADE,
  "companyName" text,
  "threadPath" text,
  "chatMessages" text,
  "imageUrls" text,
  "imagePaths" jsonb,
  internal boolean DEFAULT false,
  "notifyClient" boolean DEFAULT false,
  "smsAlert" boolean DEFAULT false,
  "markCompleted" boolean DEFAULT false,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- punchlist table
CREATE TABLE IF NOT EXISTS punchlist (
  id serial PRIMARY KEY,
  "projectId" integer REFERENCES projects(id) ON DELETE CASCADE,
  "authorId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  "parentId" integer REFERENCES punchlist(id) ON DELETE CASCADE,
  "companyName" text,
  internal boolean DEFAULT false,
  "smsAlert" boolean DEFAULT false,
  "markCompleted" boolean DEFAULT false,
  "imagePaths" text[],
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  "userId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type character varying(50),
  title character varying(255),
  message text,
  "actionUrl" character varying(500),
  "actionText" character varying(100),
  priority character varying(20) DEFAULT 'normal',
  viewed boolean DEFAULT false,
  metadata jsonb,
  "expiresAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- directMessages table
CREATE TABLE IF NOT EXISTS directMessages (
  id serial PRIMARY KEY,
  "fromUser" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  "toUser" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  "fromName" text,
  message text,
  "isDeleted" boolean DEFAULT false,
  "readAt" timestamp with time zone,
  "messageTimestamp" timestamp with time zone DEFAULT now(),
  "createdAt" timestamp with time zone DEFAULT now()
);

-- chatMessages table
CREATE TABLE IF NOT EXISTS chatMessages (
  id serial PRIMARY KEY,
  "userId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  "userName" text,
  "userRole" text,
  message text,
  timestamp timestamp with time zone DEFAULT now(),
  "createdAt" timestamp with time zone DEFAULT now()
);

-- feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id serial PRIMARY KEY,
  "userId" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "userName" character varying(255),
  "userEmail" character varying(255),
  type character varying(50),
  subject character varying(100),
  message text,
  priority character varying(20) DEFAULT 'normal',
  status character varying(20) DEFAULT 'pending',
  anonymous boolean DEFAULT false,
  "adminNotes" text,
  "resolvedAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- demo_bookings table
CREATE TABLE IF NOT EXISTS demo_bookings (
  id serial PRIMARY KEY,
  name character varying(255),
  email character varying(255),
  phone character varying(50),
  company character varying(255),
  "preferredDate" date,
  "preferredTime" character varying(20),
  message text,
  notes text,
  status character varying(50) DEFAULT 'pending',
  "assignedTo" uuid REFERENCES auth.users(id),
  "confirmedAt" timestamp with time zone,
  "completedAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- project_statuses table
CREATE TABLE IF NOT EXISTS project_statuses (
  id serial PRIMARY KEY,
  "statusCode" integer UNIQUE,
  status text,
  "statusColor" text,
  "adminStatusName" character varying(100),
  "adminStatusSlug" text,
  "adminStatusTab" character varying(50),
  "adminStatusAction" text,
  "adminEmailSubject" text,
  "adminEmailContent" text,
  "clientStatusName" text,
  "clientStatusSlug" text,
  "clientStatusTab" text,
  "clientStatusAction" text,
  "clientEmailSubject" text,
  "clientEmailContent" text,
  "emailToRoles" jsonb,
  "adminVisible" boolean DEFAULT true,
  "clientVisible" boolean DEFAULT true,
  "estTime" character varying(50),
  "buttonText" text,
  "buttonLink" text,
  "modalAdmin" text,
  "modalClient" text,
  "modalAutoRedirectAdmin" text,
  "modalAutoRedirectClient" text,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id bigserial PRIMARY KEY,
  "projectId" bigint REFERENCES projects(id) ON DELETE CASCADE,
  "createdBy" uuid REFERENCES auth.users(id),
  subject text,
  "invoiceDate" date,
  "dueDate" date,
  "paymentTerms" text,
  "catalogLineItems" jsonb,
  subtotal numeric(10,2),
  "taxRate" numeric(5,2),
  "taxAmount" numeric(10,2),
  "discountAmount" numeric(10,2),
  "totalAmount" numeric(10,2),
  "paidAmount" numeric(10,2),
  "outstandingBalance" numeric(10,2),
  status text DEFAULT 'draft',
  notes text,
  "paymentNotes" text,
  "paymentMethod" text,
  "paymentReference" text,
  "proposalNotes" text,
  "proposalSignature" text,
  "signedAt" timestamp with time zone,
  "sentAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- payments table
CREATE TABLE IF NOT EXISTS payments (
  id bigserial PRIMARY KEY,
  "invoiceId" bigint REFERENCES invoices(id) ON DELETE CASCADE,
  "createdBy" uuid REFERENCES auth.users(id),
  "paymentDate" date,
  amount numeric(10,2),
  "paymentMethod" text,
  "paymentReference" text,
  notes text,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- line_items_catalog table
CREATE TABLE IF NOT EXISTS line_items_catalog (
  id serial PRIMARY KEY,
  "createdBy" uuid REFERENCES auth.users(id),
  name character varying(255),
  description text,
  category character varying(100),
  "unitPrice" numeric(10,2),
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- subject_catalog table
CREATE TABLE IF NOT EXISTS subject_catalog (
  id serial PRIMARY KEY,
  "createdBy" uuid REFERENCES auth.users(id),
  subject text,
  description text,
  category character varying(100),
  "usageCount" integer DEFAULT 0,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id serial PRIMARY KEY,
  "createdBy" uuid REFERENCES auth.users(id),
  title character varying(500),
  description text,
  category character varying(100),
  "usageCount" integer DEFAULT 0,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- invoice_subject_lines table
CREATE TABLE IF NOT EXISTS invoice_subject_lines (
  id bigserial PRIMARY KEY,
  title text,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- pdf_templates table
CREATE TABLE IF NOT EXISTS pdf_templates (
  id serial PRIMARY KEY,
  "createdBy" uuid REFERENCES auth.users(id),
  name character varying(255),
  description text,
  "htmlContent" text,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- pdf_components table
CREATE TABLE IF NOT EXISTS pdf_components (
  id serial PRIMARY KEY,
  "createdBy" uuid REFERENCES auth.users(id),
  name character varying(255),
  description text,
  "componentType" character varying(100),
  "htmlContent" text,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- template_component_mapping table
CREATE TABLE IF NOT EXISTS template_component_mapping (
  id serial PRIMARY KEY,
  "templateId" integer REFERENCES pdf_templates(id) ON DELETE CASCADE,
  "componentId" integer REFERENCES pdf_components(id) ON DELETE CASCADE,
  "insertionPoint" character varying(100),
  "displayOrder" integer,
  "isRequired" boolean DEFAULT false,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- documentComponents table
CREATE TABLE IF NOT EXISTS documentComponents (
  id serial PRIMARY KEY,
  "documentId" integer,
  "componentId" integer REFERENCES pdf_components(id) ON DELETE CASCADE,
  "insertionPoint" character varying(100),
  "displayOrder" integer,
  "componentData" jsonb,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- generated_documents table
CREATE TABLE IF NOT EXISTS generated_documents (
  id serial PRIMARY KEY,
  "projectId" integer REFERENCES projects(id) ON DELETE CASCADE,
  "templateId" integer REFERENCES pdf_templates(id),
  "createdBy" uuid REFERENCES auth.users(id),
  "documentName" character varying(255),
  "filePath" text,
  "fileSize" bigint,
  "generationStatus" character varying(50) DEFAULT 'pending',
  "errorMessage" text,
  "generationStartedAt" timestamp with time zone,
  "generationCompletedAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- file_versions table (camelCase: fileVersions)
CREATE TABLE IF NOT EXISTS "fileVersions" (
  id serial PRIMARY KEY,
  "fileId" integer REFERENCES files(id) ON DELETE CASCADE,
  "uploadedBy" uuid REFERENCES auth.users(id),
  "versionNumber" integer,
  "filePath" text,
  "fileType" text,
  "fileSize" bigint,
  notes text,
  "uploadedAt" timestamp with time zone DEFAULT now(),
  "createdAt" timestamp with time zone DEFAULT now()
);

-- file_checkout_history table (camelCase: fileCheckoutHistory)
CREATE TABLE IF NOT EXISTS "fileCheckoutHistory" (
  id serial PRIMARY KEY,
  "fileId" integer REFERENCES files(id) ON DELETE CASCADE,
  "userId" uuid REFERENCES auth.users(id),
  action character varying(20),
  notes text,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- files_global table
CREATE TABLE IF NOT EXISTS files_global (
  id serial PRIMARY KEY,
  name text,
  "fileName" text,
  "filePath" text,
  "fileType" text,
  "fileSize" bigint,
  type integer,
  status text,
  "uploadedAt" timestamp without time zone DEFAULT now()
);

-- global_options table
CREATE TABLE IF NOT EXISTS global_options (
  id bigserial PRIMARY KEY,
  key text UNIQUE,
  value text
);

-- =====================================================
-- INDEXES (for performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_projects_author_id ON projects("authorId");
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON projects("assignedToId");
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files("projectId");
CREATE INDEX IF NOT EXISTS idx_files_author_id ON files("authorId");
CREATE INDEX IF NOT EXISTS idx_discussion_project_id ON discussion("projectId");
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_viewed ON notifications(viewed);
CREATE INDEX IF NOT EXISTS idx_directMessages_from_user ON directMessages("fromUser");
CREATE INDEX IF NOT EXISTS idx_directMessages_to_user ON directMessages("toUser");

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion ENABLE ROW LEVEL SECURITY;
ALTER TABLE punchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE directMessages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatMessages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies (non-recursive to avoid infinite loop)

-- 1. Users can SELECT their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 2. Users can INSERT their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 3. Users can UPDATE their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Security definer function to check admin status (avoids RLS recursion)
CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('Admin', 'Staff')
  );
$$;

-- 4. Admins can SELECT all profiles (uses function to avoid recursion)
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin_or_staff());

-- 5. Admins can UPDATE all profiles
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin_or_staff());

-- Projects RLS Policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    "authorId" = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
    )
  );

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK ("authorId" = auth.uid());

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    "authorId" = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
    )
  );

CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Files RLS Policies
CREATE POLICY "Users can view project files"
  ON files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = files."projectId"
      AND (projects."authorId" = auth.uid() OR
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Staff')))
    )
  );

CREATE POLICY "Users can upload files to own projects"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = files."projectId"
      AND (projects."authorId" = auth.uid() OR
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Staff')))
    )
  );

-- Notifications RLS Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING ("userId" = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING ("userId" = auth.uid());

-- Direct Messages RLS Policies
CREATE POLICY "Users can view own messages"
  ON directMessages FOR SELECT
  TO authenticated
  USING ("fromUser" = auth.uid() OR "toUser" = auth.uid());

CREATE POLICY "Users can send messages"
  ON directMessages FOR INSERT
  TO authenticated
  WITH CHECK ("fromUser" = auth.uid());

-- Feedback RLS Policies
CREATE POLICY "Users can submit feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
    )
  );

-- =====================================================
-- TRIGGERS: Auto-create profile on user signup
-- =====================================================

-- Function to handle new user creation (Google OAuth, Email, Magic Link, etc.)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _firstName text;
  _lastName text;
  _companyName text;
  _avatarUrl text;
BEGIN
  -- Extract first name (try multiple metadata fields for different auth providers)
  _firstName := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'firstName', ''),
    NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'given_name', ''),  -- Google OAuth
    ''
  );
  
  -- Extract last name
  _lastName := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'lastName', ''),
    NULLIF(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'family_name', ''),  -- Google OAuth
    ''
  );
  
  -- Extract company name (fallback to full name or email)
  _companyName := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'companyName', ''),
    NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),  -- Google OAuth full name
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    split_part(NEW.email, '@', 1)  -- Fallback to email username
  );
  
  -- Extract avatar URL (try multiple fields)
  _avatarUrl := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'avatarUrl', ''),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'picture', ''),  -- Google OAuth
    NULL
  );

  -- Insert new profile
  INSERT INTO public.profiles (
    id, 
    email,
    role, 
    "companyName",
    "firstName",
    "lastName",
    "avatarUrl",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id, 
    NEW.email,
    'Client',  -- Default role for new users
    _companyName,
    _firstName,
    _lastName,
    _avatarUrl,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Don't error if profile already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- =====================================================
-- SEED DATA (optional - for testing)
-- =====================================================

-- Insert default project statuses (if they don't exist)
INSERT INTO project_statuses ("statusCode", status, "adminStatusName", "clientStatusName", "statusColor", "adminVisible", "clientVisible")
VALUES
  (0, 'New Submission', 'New Submission', 'Submitted', '#3b82f6', true, true),
  (1, 'Under Review', 'Under Review', 'In Review', '#f59e0b', true, true),
  (2, 'Approved', 'Approved', 'Approved', '#10b981', true, true),
  (3, 'Revisions Needed', 'Revisions Needed', 'Revisions Needed', '#ef4444', true, true)
ON CONFLICT ("statusCode") DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Development database setup complete!';
  RAISE NOTICE 'Tables created with camelCase columns, RLS policies applied.';
  RAISE NOTICE 'You can now test user creation with magic links.';
END $$;
