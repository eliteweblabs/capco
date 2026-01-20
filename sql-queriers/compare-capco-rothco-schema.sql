-- ============================================================================
-- CAPCO (MASTER) vs ROTHCO Schema Comparison
-- ============================================================================
-- This script generates comparison queries to identify differences between
-- Capco (master) and Rothco databases
-- ============================================================================

-- STEP 1: Get all tables from Capco (MASTER)
-- Run this on CAPCO database first, save results
-- ============================================================================
SELECT 
  table_name,
  'CAPCO' as source
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- STEP 2: Get all tables from Rothco
-- Run this on ROTHCO database, save results
-- ============================================================================
SELECT 
  table_name,
  'ROTHCO' as source
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- STEP 3: Get detailed column information from Capco (MASTER)
-- Run this on CAPCO database, save results
-- ============================================================================
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.character_maximum_length,
  c.is_nullable,
  c.column_default,
  c.udt_name,
  CASE 
    WHEN pk.column_name IS NOT NULL THEN 'YES'
    ELSE 'NO'
  END as is_primary_key
FROM information_schema.tables t
JOIN information_schema.columns c 
  ON t.table_name = c.table_name 
  AND t.table_schema = c.table_schema
LEFT JOIN (
  SELECT ku.table_name, ku.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku
    ON tc.constraint_name = ku.constraint_name
    AND tc.table_schema = ku.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- STEP 4: Get detailed column information from Rothco
-- Run this on ROTHCO database, save results
-- ============================================================================
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.character_maximum_length,
  c.is_nullable,
  c.column_default,
  c.udt_name,
  CASE 
    WHEN pk.column_name IS NOT NULL THEN 'YES'
    ELSE 'NO'
  END as is_primary_key
FROM information_schema.tables t
JOIN information_schema.columns c 
  ON t.table_name = c.table_name 
  AND t.table_schema = c.table_schema
LEFT JOIN (
  SELECT ku.table_name, ku.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku
    ON tc.constraint_name = ku.constraint_name
    AND tc.table_schema = ku.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- STEP 5: Compare table names (case-sensitive)
-- Run this after exporting results from both databases
-- ============================================================================
-- This query helps identify:
-- 1. Tables that exist in Capco but not in Rothco
-- 2. Tables that exist in Rothco but not in Capco
-- 3. Tables with different casing

-- STEP 6: Compare column names (case-sensitive) for each table
-- Run this for each table that exists in both databases
-- ============================================================================
-- This query helps identify:
-- 1. Columns that exist in Capco but not in Rothco
-- 2. Columns that exist in Rothco but not in Capco
-- 3. Columns with different casing
-- 4. Columns with different data types
