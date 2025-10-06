-- Drop the most likely problematic functions
-- These are the ones that probably reference projectid/project_id

-- Drop discussion-related functions
DROP FUNCTION IF EXISTS assign_default_discussion_to_project() CASCADE;
DROP FUNCTION IF EXISTS assign_default_discussions_to_existing_project() CASCADE;
DROP FUNCTION IF EXISTS assign_default_discussions_to_project() CASCADE;
DROP FUNCTION IF EXISTS recalculate_incomplete_discussions() CASCADE;
DROP FUNCTION IF EXISTS update_incomplete_discussions_count() CASCADE;

-- Drop functions that might reference project fields
DROP FUNCTION IF EXISTS get_conversation() CASCADE;
DROP FUNCTION IF EXISTS get_recent_conversations() CASCADE;
DROP FUNCTION IF EXISTS recalculate_invoice_totals() CASCADE;
DROP FUNCTION IF EXISTS update_invoice_totals() CASCADE;

-- Drop project-related functions
DROP FUNCTION IF EXISTS update_project_elapsed_time() CASCADE;
DROP FUNCTION IF EXISTS update_single_project_elapsed_time() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_elapsed_time() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_elapsed_time_on_update() CASCADE;
DROP FUNCTION IF EXISTS update_single_project_due_date() CASCADE;
DROP FUNCTION IF EXISTS set_project_due_date() CASCADE;
DROP FUNCTION IF EXISTS reset_project_due_date() CASCADE;
DROP FUNCTION IF EXISTS extend_project_due_date() CASCADE;
DROP FUNCTION IF EXISTS update_missing_due_dates() CASCADE;
DROP FUNCTION IF EXISTS schedule_elapsed_time_updates() CASCADE;

-- Drop file-related functions that might reference projectId
DROP FUNCTION IF EXISTS assign_file() CASCADE;
DROP FUNCTION IF EXISTS checkout_file() CASCADE;
DROP FUNCTION IF EXISTS checkin_file() CASCADE;
DROP FUNCTION IF EXISTS get_file_checkout_status() CASCADE;

-- Drop punchlist functions
DROP FUNCTION IF EXISTS auto_create_punchlist_items() CASCADE;
DROP FUNCTION IF EXISTS create_default_punchlist_items() CASCADE;

-- Drop invoice functions
DROP FUNCTION IF EXISTS calculate_outstanding_balance() CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;

-- Drop other potentially problematic functions
DROP FUNCTION IF EXISTS sync_featured_image_data() CASCADE;
DROP FUNCTION IF EXISTS create_line_item_from_catalog() CASCADE;
DROP FUNCTION IF EXISTS search_catalog_items() CASCADE;

SELECT '✅ Dropped all potentially problematic functions!' as status;
