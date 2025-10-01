-- =====================================================
-- RESET DEVELOPMENT DATABASE
-- =====================================================
-- WARNING: This will DROP ALL tables and data
-- Only run this on your DEVELOPMENT database!
-- =====================================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_files_updated_at ON files;
DROP TRIGGER IF EXISTS update_discussion_updated_at ON discussion;
DROP TRIGGER IF EXISTS update_demo_bookings_timestamp ON demo_bookings;
DROP TRIGGER IF EXISTS update_feedback_timestamp ON feedback;
DROP TRIGGER IF EXISTS update_subjects_timestamp ON subjects;
DROP TRIGGER IF EXISTS sync_featured_image_on_file_update ON files;
DROP TRIGGER IF EXISTS sync_featured_image_on_file_insert ON files;
DROP TRIGGER IF EXISTS assign_discussions_on_project_create ON projects;
DROP TRIGGER IF EXISTS create_punchlist_on_project_create ON projects;
DROP TRIGGER IF EXISTS set_due_date_on_status_change ON projects;
DROP TRIGGER IF EXISTS set_elapsed_time_on_create ON projects;
DROP TRIGGER IF EXISTS update_elapsed_time_on_update ON projects;
DROP TRIGGER IF EXISTS update_discussion_count_on_insert ON discussion;
DROP TRIGGER IF EXISTS update_discussion_count_on_update ON discussion;
DROP TRIGGER IF EXISTS update_discussion_count_on_delete ON discussion;

-- Drop all functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS sync_featured_image_data() CASCADE;
DROP FUNCTION IF EXISTS assign_default_discussions_to_project() CASCADE;
DROP FUNCTION IF EXISTS auto_create_punchlist_items() CASCADE;
DROP FUNCTION IF EXISTS set_project_due_date() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_elapsed_time() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_elapsed_time_on_update() CASCADE;
DROP FUNCTION IF EXISTS update_demo_bookings_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_feedback_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_incomplete_discussions_count() CASCADE;
DROP FUNCTION IF EXISTS update_subjects_updated_at() CASCADE;
DROP FUNCTION IF EXISTS checkout_file(integer, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS checkin_file(integer, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS assign_file(integer, uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS get_file_checkout_status(integer) CASCADE;

-- Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS file_checkout_history CASCADE;
DROP TABLE IF EXISTS file_versions CASCADE;
DROP TABLE IF EXISTS generated_documents CASCADE;
DROP TABLE IF EXISTS document_components CASCADE;
DROP TABLE IF EXISTS template_component_mapping CASCADE;
DROP TABLE IF EXISTS pdf_components CASCADE;
DROP TABLE IF EXISTS pdf_templates CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS line_items_catalog CASCADE;
DROP TABLE IF EXISTS subject_catalog CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS invoice_subject_lines CASCADE;
DROP TABLE IF EXISTS global_options CASCADE;
DROP TABLE IF EXISTS files_global CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS punchlist CASCADE;
DROP TABLE IF EXISTS discussion CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS demo_bookings CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS project_statuses CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Development database reset complete!';
  RAISE NOTICE 'All tables, functions, and triggers have been dropped.';
  RAISE NOTICE 'Now run: 1) dev-database-migration.sql';
  RAISE NOTICE 'Then run: 2) dev-database-migration-with-functions.sql';
END $$;

