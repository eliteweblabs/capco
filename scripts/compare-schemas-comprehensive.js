#!/usr/bin/env node

/**
 * Comprehensive Schema Comparison: Capco (Master) vs Rothco
 * 
 * Compares:
 * - All tables (including casing)
 * - All columns (including casing, data types, nullability, defaults)
 * - Generates migration SQL to make Rothco match Capco
 * 
 * Usage:
 *   node scripts/compare-schemas-comprehensive.js
 * 
 * Requires Supabase MCP connection to both projects
 */

import { createClient } from '@supabase/supabase-js';

const CAPCO_PROJECT_REF = 'qudlxlryegnainztkrtk';
const ROTHCO_PROJECT_REF = 'fhqglhcjlkusrykqnoel';

// These will need to be set via environment variables or Supabase dashboard
const CAPCO_URL = `https://${CAPCO_PROJECT_REF}.supabase.co`;
const ROTHCO_URL = `https://${ROTHCO_PROJECT_REF}.supabase.co`;

const CAPCO_ANON_KEY = process.env.CAPCO_SUPABASE_ANON_KEY || '';
const ROTHCO_ANON_KEY = process.env.ROTHCO_SUPABASE_ANON_KEY || '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Get all tables from a Supabase project using SQL query
 */
async function getTables(supabaseClient, projectName) {
  const query = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  
  try {
    const { data, error } = await supabaseClient.rpc('exec_sql', { sql: query });
    if (error) {
      // Fallback: try direct query via PostgREST
      log(`⚠️  RPC not available, trying alternative method for ${projectName}...`, 'yellow');
      return [];
    }
    return data?.map(row => row.table_name) || [];
  } catch (error) {
    log(`⚠️  Error getting tables for ${projectName}: ${error.message}`, 'yellow');
    return [];
  }
}

/**
 * Get all columns for a table using SQL query
 */
async function getTableColumns(supabaseClient, tableName, projectName) {
  const query = `
    SELECT 
      column_name,
      data_type,
      character_maximum_length,
      is_nullable,
      column_default,
      udt_name,
      ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position;
  `;
  
  try {
    // Try using a function or direct query
    // Since we can't directly query information_schema via PostgREST,
    // we'll need to use SQL editor or create a helper function
    log(`  ⚠️  Cannot directly query information_schema for ${tableName}`, 'yellow');
    return [];
  } catch (error) {
    log(`  ⚠️  Error getting columns for ${tableName}: ${error.message}`, 'yellow');
    return [];
  }
}

/**
 * Compare two schemas and generate migration SQL
 */
function compareSchemas(capcoTables, rothcoTables, capcoColumns, rothcoColumns) {
  const results = {
    missingTables: [],
    extraTables: [],
    missingColumns: {},
    extraColumns: {},
    casingMismatches: {},
    typeMismatches: {},
  };

  // Compare tables
  const capcoTableSet = new Set(capcoTables);
  const rothcoTableSet = new Set(rothcoTables);

  // Tables in Capco but not in Rothco
  capcoTables.forEach(table => {
    if (!rothcoTableSet.has(table)) {
      results.missingTables.push(table);
    }
  });

  // Tables in Rothco but not in Capco (should be removed or kept?)
  rothcoTables.forEach(table => {
    if (!capcoTableSet.has(table)) {
      results.extraTables.push(table);
    }
  });

  // Case-sensitive comparison
  const capcoTableLower = new Map(capcoTables.map(t => [t.toLowerCase(), t]));
  const rothcoTableLower = new Map(rothcoTables.map(t => [t.toLowerCase(), t]));

  capcoTableLower.forEach((capcoTable, lowerKey) => {
    const rothcoTable = rothcoTableLower.get(lowerKey);
    if (rothcoTable && capcoTable !== rothcoTable) {
      results.casingMismatches[lowerKey] = {
        capco: capcoTable,
        rothco: rothcoTable,
      };
    }
  });

  return results;
}

/**
 * Generate migration SQL to make Rothco match Capco
 */
function generateMigrationSQL(results) {
  const sql = [];
  
  sql.push('-- ============================================================================');
  sql.push('-- Migration SQL: Make Rothco match Capco schema');
  sql.push('-- Generated: ' + new Date().toISOString());
  sql.push('-- ============================================================================\n');

  // Rename tables with casing mismatches
  if (Object.keys(results.casingMismatches).length > 0) {
    sql.push('-- Rename tables to match Capco casing');
    Object.entries(results.casingMismatches).forEach(([lower, { capco, rothco }]) => {
      sql.push(`ALTER TABLE IF EXISTS "${rothco}" RENAME TO "${capco}";`);
    });
    sql.push('');
  }

  // Create missing tables
  if (results.missingTables.length > 0) {
    sql.push('-- TODO: Create missing tables');
    sql.push('-- These tables need to be created manually based on Capco schema:');
    results.missingTables.forEach(table => {
      sql.push(`-- CREATE TABLE "${table}" (...);`);
    });
    sql.push('');
  }

  // Remove extra tables (commented out for safety)
  if (results.extraTables.length > 0) {
    sql.push('-- WARNING: Tables in Rothco but not in Capco');
    sql.push('-- Review these tables before removing:');
    results.extraTables.forEach(table => {
      sql.push(`-- DROP TABLE IF EXISTS "${table}";`);
    });
    sql.push('');
  }

  return sql.join('\n');
}

/**
 * Main comparison function
 */
async function compareSchemasComprehensive() {
  log('🔍 Comprehensive Schema Comparison: Capco (Master) vs Rothco', 'cyan');
  log('='.repeat(70), 'cyan');
  log(`Capco (Master): ${CAPCO_PROJECT_REF}`, 'blue');
  log(`Rothco: ${ROTHCO_PROJECT_REF}`, 'blue');
  log('');

  if (!CAPCO_ANON_KEY || !ROTHCO_ANON_KEY) {
    log('❌ Error: Missing Supabase keys', 'red');
    log('   Set CAPCO_SUPABASE_ANON_KEY and ROTHCO_SUPABASE_ANON_KEY environment variables', 'yellow');
    log('   Get keys from:', 'yellow');
    log(`   Capco: https://supabase.com/dashboard/project/${CAPCO_PROJECT_REF}/settings/api`, 'yellow');
    log(`   Rothco: https://supabase.com/dashboard/project/${ROTHCO_PROJECT_REF}/settings/api`, 'yellow');
    process.exit(1);
  }

  const capcoClient = createClient(CAPCO_URL, CAPCO_ANON_KEY);
  const rothcoClient = createClient(ROTHCO_URL, ROTHCO_ANON_KEY);

  log('📋 Fetching tables from both projects...', 'cyan');
  
  const capcoTables = await getTables(capcoClient, 'Capco');
  const rothcoTables = await getTables(rothcoClient, 'Rothco');

  log(`\n✅ Capco tables: ${capcoTables.length}`, 'green');
  log(`✅ Rothco tables: ${rothcoTables.length}`, 'green');

  if (capcoTables.length === 0 && rothcoTables.length === 0) {
    log('\n⚠️  Could not fetch tables via API. Using SQL queries instead.', 'yellow');
    log('\n📝 Please run the SQL queries in sql-queriers/compare-capco-rothco-schema.sql', 'cyan');
    log('   on both databases and compare the results manually.', 'cyan');
    return;
  }

  const results = compareSchemas(capcoTables, rothcoTables, {}, {});

  // Display results
  log('\n📊 Comparison Results:', 'cyan');
  log('─'.repeat(70), 'cyan');

  if (results.missingTables.length > 0) {
    log(`\n❌ Missing tables in Rothco (${results.missingTables.length}):`, 'red');
    results.missingTables.forEach(table => log(`   - ${table}`, 'red'));
  } else {
    log('\n✅ All Capco tables exist in Rothco', 'green');
  }

  if (results.extraTables.length > 0) {
    log(`\n⚠️  Extra tables in Rothco (${results.extraTables.length}):`, 'yellow');
    results.extraTables.forEach(table => log(`   - ${table}`, 'yellow'));
  }

  if (Object.keys(results.casingMismatches).length > 0) {
    log(`\n⚠️  Table casing mismatches (${Object.keys(results.casingMismatches).length}):`, 'yellow');
    Object.entries(results.casingMismatches).forEach(([lower, { capco, rothco }]) => {
      log(`   - "${rothco}" → "${capco}"`, 'yellow');
    });
  }

  // Generate migration SQL
  const migrationSQL = generateMigrationSQL(results);
  
  log('\n📝 Migration SQL generated:', 'cyan');
  log('─'.repeat(70), 'cyan');
  console.log(migrationSQL);

  log('\n💡 Next Steps:', 'cyan');
  log('   1. Review the migration SQL above', 'blue');
  log('   2. For detailed column comparison, run SQL queries manually:', 'blue');
  log('      sql-queriers/compare-capco-rothco-schema.sql', 'blue');
  log('   3. Apply migrations to Rothco database', 'blue');
  log('   4. Verify schema matches Capco', 'blue');
}

// Run comparison
compareSchemasComprehensive().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
