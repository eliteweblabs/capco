-- ============================================================================
-- Migration SQL: Make Rothco match Capco (Master) schema
-- Generated: 2026-02-14T23:38:45.440Z
-- ============================================================================

-- ============================================================================
-- STEP 2: Fix column differences
-- ============================================================================

-- Add missing columns to table "feedback"
ALTER TABLE "feedback" ADD COLUMN "user_id" uuid;
ALTER TABLE "feedback" ADD COLUMN "user_email" varchar(255);
ALTER TABLE "feedback" ADD COLUMN "user_name" varchar(255);
ALTER TABLE "feedback" ADD COLUMN "admin_notes" text;
ALTER TABLE "feedback" ADD COLUMN "resolved_at" timestamptz;

-- Add missing columns to table "invoices"
ALTER TABLE "invoices" ADD COLUMN "paidAt" timestamptz;
ALTER TABLE "invoices" ADD COLUMN "templateId" int4;

-- Add missing columns to table "projects"
ALTER TABLE "projects" ADD COLUMN "fireServiceType" jsonb;
ALTER TABLE "projects" ADD COLUMN "contractData" jsonb;

-- ============================================================================
-- STEP 3: Type mismatches (REVIEW CAREFULLY - may require data migration)
-- ============================================================================

-- Type mismatches in table "invoices":
--   "taxRate": Rothco has numeric(5,2), Capco has numeric(5,4)
--   ALTER TABLE "invoices" ALTER COLUMN "taxRate" TYPE numeric(5,4); -- REVIEW: May need USING clause

-- ============================================================================
-- STEP 4: Create missing tables
-- ============================================================================
-- WARNING: These tables need to be created manually based on Capco schema
-- Export CREATE TABLE statements from Capco and run them here

-- CREATE TABLE "directMessages" (...);
-- CREATE TABLE "documentComponents" (...);
-- CREATE TABLE "documentTemplates" (...);
-- CREATE TABLE "filesGlobal" (...);
-- CREATE TABLE "globalSettings" (...);

-- ============================================================================
-- STEP 5: Extra tables in Rothco (review before removing)
-- ============================================================================

-- DROP TABLE IF EXISTS "bannerAlerts";
-- DROP TABLE IF EXISTS "chat_messages";
-- DROP TABLE IF EXISTS "direct_messages";
-- DROP TABLE IF EXISTS "document_components";
-- DROP TABLE IF EXISTS "document_templates";
-- DROP TABLE IF EXISTS "files_global";
-- DROP TABLE IF EXISTS "generated_documents";
-- DROP TABLE IF EXISTS "globalOptions";
-- DROP TABLE IF EXISTS "global_options";
-- DROP TABLE IF EXISTS "global_settings";
-- DROP TABLE IF EXISTS "invoice_subject_lines";
-- DROP TABLE IF EXISTS "kysely_migration";
-- DROP TABLE IF EXISTS "kysely_migration_lock";
-- DROP TABLE IF EXISTS "line_items_catalog";
-- DROP TABLE IF EXISTS "pdf_components";
-- DROP TABLE IF EXISTS "pdf_templates";
-- DROP TABLE IF EXISTS "project_statuses";
-- DROP TABLE IF EXISTS "subject_catalog";
