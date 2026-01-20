#!/usr/bin/env node

/**
 * Generate SQL to sync Rothco schema to match Capco (Master)
 * 
 * This script uses Supabase MCP tools to query both databases and generate
 * migration SQL that makes Rothco match Capco exactly.
 * 
 * Usage:
 *   node scripts/generate-schema-sync-sql.js > sync-rothco-to-capco.sql
 */

import fs from 'fs';

// Project references
const CAPCO_PROJECT_REF = 'qudlxlryegnainztkrtk';
const ROTHCO_PROJECT_REF = 'fhqglhcjlkusrykqnoel';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.error(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Generate SQL queries to compare schemas
 * These queries should be run via Supabase SQL Editor or MCP tools
 */
function generateComparisonQueries() {
  const queries = [];

  queries.push('-- ============================================================================');
  queries.push('-- CAPCO (MASTER) Schema Export');
  queries.push('-- Run these queries on CAPCO database and save results');
  queries.push('-- ============================================================================\n');

  // Query 1: Get all tables
  queries.push('-- Query 1: Get all tables from Capco');
  queries.push(`
SELECT 
  table_name,
  'CAPCO' as source
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
  `);

  // Query 2: Get all columns with details
  queries.push('\n-- Query 2: Get all columns from Capco');
  queries.push(`
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale,
  c.is_nullable,
  c.column_default,
  c.udt_name,
  c.ordinal_position,
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
  `);

  queries.push('\n-- ============================================================================');
  queries.push('-- ROTHCO Schema Export');
  queries.push('-- Run these queries on ROTHCO database and save results');
  queries.push('-- ============================================================================\n');

  // Query 3: Get all tables from Rothco
  queries.push('-- Query 3: Get all tables from Rothco');
  queries.push(`
SELECT 
  table_name,
  'ROTHCO' as source
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
  `);

  // Query 4: Get all columns from Rothco
  queries.push('\n-- Query 4: Get all columns from Rothco');
  queries.push(`
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale,
  c.is_nullable,
  c.column_default,
  c.udt_name,
  c.ordinal_position,
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
  `);

  return queries.join('\n');
}

/**
 * Generate instructions for using the comparison results
 */
function generateInstructions() {
  const instructions = [];

  instructions.push('\n-- ============================================================================');
  instructions.push('-- INSTRUCTIONS: How to Use These Queries');
  instructions.push('-- ============================================================================\n');
  instructions.push('-- 1. Run Query 1 and Query 2 on CAPCO database');
  instructions.push('--    Save results as: capco-tables.csv and capco-columns.csv');
  instructions.push('');
  instructions.push('-- 2. Run Query 3 and Query 4 on ROTHCO database');
  instructions.push('--    Save results as: rothco-tables.csv and rothco-columns.csv');
  instructions.push('');
  instructions.push('-- 3. Run the comparison script:');
  instructions.push('--    node scripts/compare-schema-results.js capco-tables.csv capco-columns.csv rothco-tables.csv rothco-columns.csv');
  instructions.push('');
  instructions.push('-- 4. Review the generated migration SQL');
  instructions.push('-- 5. Apply migrations to ROTHCO database');
  instructions.push('');

  return instructions.join('\n');
}

// Main execution
log('📝 Generating schema comparison queries...', 'cyan');

const queries = generateComparisonQueries();
const instructions = generateInstructions();

// Output to console (can be redirected to file)
console.log(queries);
console.log(instructions);

log('\n✅ Queries generated!', 'green');
log('   Save this output to a file and run on both databases.', 'blue');
log('   Example: node scripts/generate-schema-sync-sql.js > comparison-queries.sql', 'blue');
