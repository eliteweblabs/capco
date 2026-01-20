-- =====================================================
-- PRODUCTION DATA EXPORT SCRIPT
-- =====================================================
-- Run this script in your PRODUCTION Supabase SQL Editor
-- Copy the results and save them to import into dev database
-- =====================================================

-- =====================================================
-- 1. EXPORT PROJECT_STATUSES (CRITICAL)
-- =====================================================
-- NOTE: Use export-statuses-simple.sql instead - it's simpler!
-- This file kept for reference but use the simple version

-- For camelCase table "projectStatuses", use export-statuses-simple.sql

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

