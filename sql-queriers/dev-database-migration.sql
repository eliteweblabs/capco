-- =====================================================
-- CAPCO Design Group - Development Database Setup
-- =====================================================
-- Run this entire script in your NEW development Supabase project
-- SQL Editor: Copy and paste this entire file, then click "Run"

-- =====================================================
-- TABLES
-- =====================================================

-- profiles table (CRITICAL - must be first)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  first_name text,
  last_name text,
  company_name text,
  phone text,
  role text DEFAULT 'Client',
  sms_alerts boolean DEFAULT false,
  mobile_carrier text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- projects table
CREATE TABLE IF NOT EXISTS projects (
  id serial PRIMARY KEY,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  address text,
  description text,
  status integer DEFAULT 0,
  sq_ft integer,
  new_construction boolean DEFAULT false,
  units integer,
  featured boolean DEFAULT false,
  architect text,
  subject text,
  nfpa_version text,
  exterior_beacon text,
  site_access text,
  fire_sprinkler_installation text,
  hazardous_material text,
  commencement_of_construction text,
  suppression_detection_systems text,
  building_height text,
  floors_below_grade text,
  hps_commodities text,
  proposal_signature text,
  contract_pdf_url text,
  featured_image_id text,
  featured_image_data jsonb,
  assigned_to_id uuid REFERENCES auth.users(id),
  assigned_to_name text,
  status_name text,
  status_slug text,
  incomplete_discussions integer DEFAULT 0,
  punchlist_count bigint DEFAULT 0,
  due_date timestamp with time zone,
  elapsed_time interval,
  signed_at timestamp with time zone,
  requested_docs jsonb,
  service jsonb,
  project jsonb,
  building jsonb,
  tier jsonb,
  fire_protection_system_type jsonb,
  log jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- files table
CREATE TABLE IF NOT EXISTS files (
  id serial PRIMARY KEY,
  project_id integer REFERENCES projects(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text,
  file_path text,
  file_size bigint,
  file_type text,
  status text,
  title text,
  comments text,
  target_id integer,
  target_location text,
  bucket_name text,
  checked_out_by uuid REFERENCES auth.users(id),
  checked_out_at timestamp with time zone,
  checkout_notes text,
  assigned_to uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone,
  version_number integer DEFAULT 1,
  previous_version_id integer,
  is_current_version boolean DEFAULT true,
  is_private boolean DEFAULT false,
  uploaded_at timestamp without time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- discussion table
CREATE TABLE IF NOT EXISTS discussion (
  id bigserial PRIMARY KEY,
  project_id integer REFERENCES projects(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  parent_id integer REFERENCES discussion(id) ON DELETE CASCADE,
  company_name text,
  thread_path text,
  chat_messages text,
  image_urls text,
  image_paths jsonb,
  internal boolean DEFAULT false,
  notify_client boolean DEFAULT false,
  sms_alert boolean DEFAULT false,
  mark_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- punchlist table
CREATE TABLE IF NOT EXISTS punchlist (
  id serial PRIMARY KEY,
  project_id integer REFERENCES projects(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  parent_id integer REFERENCES punchlist(id) ON DELETE CASCADE,
  company_name text,
  internal boolean DEFAULT false,
  sms_alert boolean DEFAULT false,
  mark_completed boolean DEFAULT false,
  image_paths text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type character varying(50),
  title character varying(255),
  message text,
  action_url character varying(500),
  action_text character varying(100),
  priority character varying(20) DEFAULT 'normal',
  viewed boolean DEFAULT false,
  metadata jsonb,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id serial PRIMARY KEY,
  from_user uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  from_name text,
  message text,
  is_deleted boolean DEFAULT false,
  read_at timestamp with time zone,
  message_timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text,
  user_role text,
  message text,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name character varying(255),
  user_email character varying(255),
  type character varying(50),
  subject character varying(100),
  message text,
  priority character varying(20) DEFAULT 'normal',
  status character varying(20) DEFAULT 'pending',
  anonymous boolean DEFAULT false,
  admin_notes text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- demo_bookings table
CREATE TABLE IF NOT EXISTS demo_bookings (
  id serial PRIMARY KEY,
  name character varying(255),
  email character varying(255),
  phone character varying(50),
  company character varying(255),
  preferred_date date,
  preferred_time character varying(20),
  message text,
  notes text,
  status character varying(50) DEFAULT 'pending',
  assigned_to uuid REFERENCES auth.users(id),
  confirmed_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- project_statuses table
CREATE TABLE IF NOT EXISTS project_statuses (
  id serial PRIMARY KEY,
  status_code integer UNIQUE,
  status text,
  status_color text,
  admin_status_name character varying(100),
  admin_status_slug text,
  admin_status_tab character varying(50),
  admin_status_action text,
  admin_email_subject text,
  admin_email_content text,
  client_status_name text,
  client_status_slug text,
  client_status_tab text,
  client_status_action text,
  client_email_subject text,
  client_email_content text,
  email_to_roles jsonb,
  admin_visible boolean DEFAULT true,
  client_visible boolean DEFAULT true,
  est_time character varying(50),
  button_text text,
  button_link text,
  modal_admin text,
  modal_client text,
  modal_auto_redirect_admin text,
  modal_auto_redirect_client text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id bigserial PRIMARY KEY,
  project_id bigint REFERENCES projects(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  subject text,
  invoice_date date,
  due_date date,
  payment_terms text,
  catalog_line_items jsonb,
  subtotal numeric(10,2),
  tax_rate numeric(5,2),
  tax_amount numeric(10,2),
  discount_amount numeric(10,2),
  total_amount numeric(10,2),
  paid_amount numeric(10,2),
  outstanding_balance numeric(10,2),
  status text DEFAULT 'draft',
  notes text,
  payment_notes text,
  payment_method text,
  payment_reference text,
  proposal_notes text,
  proposal_signature text,
  signed_at timestamp with time zone,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- payments table
CREATE TABLE IF NOT EXISTS payments (
  id bigserial PRIMARY KEY,
  invoice_id bigint REFERENCES invoices(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  payment_date date,
  amount numeric(10,2),
  payment_method text,
  payment_reference text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- line_items_catalog table
CREATE TABLE IF NOT EXISTS line_items_catalog (
  id serial PRIMARY KEY,
  created_by uuid REFERENCES auth.users(id),
  name character varying(255),
  description text,
  category character varying(100),
  unit_price numeric(10,2),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- subject_catalog table
CREATE TABLE IF NOT EXISTS subject_catalog (
  id serial PRIMARY KEY,
  created_by uuid REFERENCES auth.users(id),
  subject text,
  description text,
  category character varying(100),
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id serial PRIMARY KEY,
  created_by uuid REFERENCES auth.users(id),
  title character varying(500),
  description text,
  category character varying(100),
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- invoice_subject_lines table
CREATE TABLE IF NOT EXISTS invoice_subject_lines (
  id bigserial PRIMARY KEY,
  title text,
  created_at timestamp with time zone DEFAULT now()
);

-- pdf_templates table
CREATE TABLE IF NOT EXISTS pdf_templates (
  id serial PRIMARY KEY,
  created_by uuid REFERENCES auth.users(id),
  name character varying(255),
  description text,
  html_content text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- pdf_components table
CREATE TABLE IF NOT EXISTS pdf_components (
  id serial PRIMARY KEY,
  created_by uuid REFERENCES auth.users(id),
  name character varying(255),
  description text,
  component_type character varying(100),
  html_content text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- template_component_mapping table
CREATE TABLE IF NOT EXISTS template_component_mapping (
  id serial PRIMARY KEY,
  template_id integer REFERENCES pdf_templates(id) ON DELETE CASCADE,
  component_id integer REFERENCES pdf_components(id) ON DELETE CASCADE,
  insertion_point character varying(100),
  display_order integer,
  is_required boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- document_components table
CREATE TABLE IF NOT EXISTS document_components (
  id serial PRIMARY KEY,
  document_id integer,
  component_id integer REFERENCES pdf_components(id) ON DELETE CASCADE,
  insertion_point character varying(100),
  display_order integer,
  component_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- generated_documents table
CREATE TABLE IF NOT EXISTS generated_documents (
  id serial PRIMARY KEY,
  project_id integer REFERENCES projects(id) ON DELETE CASCADE,
  template_id integer REFERENCES pdf_templates(id),
  created_by uuid REFERENCES auth.users(id),
  document_name character varying(255),
  file_path text,
  file_size bigint,
  generation_status character varying(50) DEFAULT 'pending',
  error_message text,
  generation_started_at timestamp with time zone,
  generation_completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- file_versions table
CREATE TABLE IF NOT EXISTS file_versions (
  id serial PRIMARY KEY,
  file_id integer REFERENCES files(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id),
  version_number integer,
  file_path text,
  file_type text,
  file_size bigint,
  notes text,
  uploaded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- file_checkout_history table
CREATE TABLE IF NOT EXISTS file_checkout_history (
  id serial PRIMARY KEY,
  file_id integer REFERENCES files(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action character varying(20),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- files_global table
CREATE TABLE IF NOT EXISTS files_global (
  id serial PRIMARY KEY,
  name text,
  file_name text,
  file_path text,
  file_type text,
  file_size bigint,
  type integer,
  status text,
  uploaded_at timestamp without time zone DEFAULT now()
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

CREATE INDEX IF NOT EXISTS idx_projects_author_id ON projects(author_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON projects(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_author_id ON files(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_project_id ON discussion(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_viewed ON notifications(viewed);
CREATE INDEX IF NOT EXISTS idx_direct_messages_from_user ON direct_messages(from_user);
CREATE INDEX IF NOT EXISTS idx_direct_messages_to_user ON direct_messages(to_user);

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
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
    )
  );

-- Projects RLS Policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
    )
  );

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
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
      WHERE projects.id = files.project_id
      AND (projects.author_id = auth.uid() OR
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Staff')))
    )
  );

CREATE POLICY "Users can upload files to own projects"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = files.project_id
      AND (projects.author_id = auth.uid() OR
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Staff')))
    )
  );

-- Notifications RLS Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Direct Messages RLS Policies
CREATE POLICY "Users can view own messages"
  ON direct_messages FOR SELECT
  TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());

CREATE POLICY "Users can send messages"
  ON direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (from_user = auth.uid());

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
-- TRIGGERS
-- =====================================================

-- Note: Functions and triggers are in dev-database-migration-with-functions.sql
-- Run that file AFTER this one completes successfully

-- =====================================================
-- SEED DATA (optional - for testing)
-- =====================================================

-- Insert default project statuses (if they don't exist)
INSERT INTO project_statuses (status_code, status, admin_status_name, client_status_name, status_color, admin_visible, client_visible)
VALUES
  (0, 'New Submission', 'New Submission', 'Submitted', '#3b82f6', true, true),
  (1, 'Under Review', 'Under Review', 'In Review', '#f59e0b', true, true),
  (2, 'Approved', 'Approved', 'Approved', '#10b981', true, true),
  (3, 'Revisions Needed', 'Revisions Needed', 'Revisions Needed', '#ef4444', true, true)
ON CONFLICT (status_code) DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Development database setup complete!';
  RAISE NOTICE 'Tables created, RLS policies applied, triggers installed.';
  RAISE NOTICE 'You can now test user creation with magic links.';
END $$;

