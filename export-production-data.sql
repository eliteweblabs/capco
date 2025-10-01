-- =====================================================
-- PRODUCTION DATA EXPORT SCRIPT
-- =====================================================
-- Run this script in your PRODUCTION Supabase SQL Editor
-- Copy the results and save them to import into dev database
-- =====================================================

-- =====================================================
-- 1. EXPORT PROJECT_STATUSES (CRITICAL)
-- =====================================================
SELECT 
  'INSERT INTO project_statuses (status_code, status, admin_status_name, client_status_name, admin_status_slug, client_status_slug, status_color, admin_visible, client_visible, admin_status_tab, client_status_tab, admin_status_action, client_status_action, modal_admin, modal_client, modal_auto_redirect_admin, modal_auto_redirect_client, admin_email_subject, admin_email_content, client_email_subject, client_email_content, button_text, button_link, email_to_roles, est_time) VALUES ' ||
  string_agg(
    format(
      '(%s, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L)',
      status_code,
      status,
      admin_status_name,
      client_status_name,
      admin_status_slug,
      client_status_slug,
      status_color,
      admin_visible,
      client_visible,
      admin_status_tab,
      client_status_tab,
      admin_status_action,
      client_status_action,
      modal_admin,
      modal_client,
      modal_auto_redirect_admin,
      modal_auto_redirect_client,
      admin_email_subject,
      admin_email_content,
      client_email_subject,
      client_email_content,
      button_text,
      button_link,
      email_to_roles::text,
      est_time
    ),
    E',\n'
    ORDER BY status_code
  ) || ' ON CONFLICT (status_code) DO UPDATE SET ' ||
  'status = EXCLUDED.status, ' ||
  'admin_status_name = EXCLUDED.admin_status_name, ' ||
  'client_status_name = EXCLUDED.client_status_name, ' ||
  'admin_status_slug = EXCLUDED.admin_status_slug, ' ||
  'client_status_slug = EXCLUDED.client_status_slug, ' ||
  'status_color = EXCLUDED.status_color, ' ||
  'admin_visible = EXCLUDED.admin_visible, ' ||
  'client_visible = EXCLUDED.client_visible, ' ||
  'admin_status_tab = EXCLUDED.admin_status_tab, ' ||
  'client_status_tab = EXCLUDED.client_status_tab, ' ||
  'admin_status_action = EXCLUDED.admin_status_action, ' ||
  'client_status_action = EXCLUDED.client_status_action, ' ||
  'modal_admin = EXCLUDED.modal_admin, ' ||
  'modal_client = EXCLUDED.modal_client, ' ||
  'modal_auto_redirect_admin = EXCLUDED.modal_auto_redirect_admin, ' ||
  'modal_auto_redirect_client = EXCLUDED.modal_auto_redirect_client, ' ||
  'admin_email_subject = EXCLUDED.admin_email_subject, ' ||
  'admin_email_content = EXCLUDED.admin_email_content, ' ||
  'client_email_subject = EXCLUDED.client_email_subject, ' ||
  'client_email_content = EXCLUDED.client_email_content, ' ||
  'button_text = EXCLUDED.button_text, ' ||
  'button_link = EXCLUDED.button_link, ' ||
  'email_to_roles = EXCLUDED.email_to_roles::jsonb, ' ||
  'est_time = EXCLUDED.est_time;' AS export_sql
FROM project_statuses
WHERE status_code IS NOT NULL;

-- =====================================================
-- 2. EXPORT LINE_ITEMS_CATALOG
-- =====================================================
SELECT 
  'INSERT INTO line_items_catalog (name, description, category, unit_price, is_active) VALUES ' ||
  string_agg(
    format(
      '(%L, %L, %L, %s, %L)',
      name,
      description,
      category,
      unit_price,
      is_active
    ),
    E',\n'
  ) || ' ON CONFLICT DO NOTHING;' AS export_sql
FROM line_items_catalog
WHERE is_active = true;

-- =====================================================
-- 3. EXPORT SUBJECT_CATALOG
-- =====================================================
SELECT 
  'INSERT INTO subject_catalog (subject, description, category, is_active, usage_count) VALUES ' ||
  string_agg(
    format(
      '(%L, %L, %L, %L, %s)',
      subject,
      description,
      category,
      is_active,
      COALESCE(usage_count, 0)
    ),
    E',\n'
  ) || ' ON CONFLICT DO NOTHING;' AS export_sql
FROM subject_catalog
WHERE is_active = true;

-- =====================================================
-- 4. EXPORT GLOBAL_OPTIONS
-- =====================================================
SELECT 
  'INSERT INTO global_options (key, value) VALUES ' ||
  string_agg(
    format(
      '(%L, %L)',
      key,
      value
    ),
    E',\n'
  ) || ' ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;' AS export_sql
FROM global_options;

-- =====================================================
-- 5. EXPORT PDF_TEMPLATES
-- =====================================================
SELECT 
  'INSERT INTO pdf_templates (name, description, html_content, is_active) VALUES ' ||
  string_agg(
    format(
      '(%L, %L, %L, %L)',
      name,
      description,
      html_content,
      is_active
    ),
    E',\n'
  ) || ' ON CONFLICT DO NOTHING;' AS export_sql
FROM pdf_templates
WHERE is_active = true;

-- =====================================================
-- 6. EXPORT PDF_COMPONENTS
-- =====================================================
SELECT 
  'INSERT INTO pdf_components (name, description, component_type, html_content, is_active) VALUES ' ||
  string_agg(
    format(
      '(%L, %L, %L, %L, %L)',
      name,
      description,
      component_type,
      html_content,
      is_active
    ),
    E',\n'
  ) || ' ON CONFLICT DO NOTHING;' AS export_sql
FROM pdf_components
WHERE is_active = true;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- Run each SELECT query above in your PRODUCTION database
-- Copy the resulting SQL statements
-- Run them in your DEVELOPMENT database
-- This will sync all configuration and reference data
-- =====================================================

