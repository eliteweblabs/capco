#!/usr/bin/env node

/**
 * Comprehensive Schema Sync: Make Rothco match Capco (Master)
 * 
 * This script:
 * 1. Queries both Capco and Rothco databases via Supabase SQL
 * 2. Compares tables and columns (including casing)
 * 3. Generates migration SQL to make Rothco match Capco exactly
 * 
 * Usage:
 *   # First, export schemas from both databases using SQL queries
 *   # Then run this script to compare and generate migrations
 *   
 *   node scripts/sync-rothco-to-capco-schema.js \
 *     --capco-tables capco-tables.json \
 *     --capco-columns capco-columns.json \
 *     --rothco-tables rothco-tables.json \
 *     --rothco-columns rothco-columns.json \
 *     --output sync-migration.sql
 * 
 * OR use Supabase MCP tools to query both databases directly
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const CAPCO_PROJECT_REF = 'qudlxlryegnainztkrtk';
const ROTHCO_PROJECT_REF = 'fhqglhcjlkusrykqnoel';

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
  console.error(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Get all tables from a database using Supabase MCP execute_sql
 * This function should be called via MCP tools
 */
async function getTablesViaSQL(supabaseClient) {
  const query = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  
  // This would need to be called via MCP tools
  // For now, return empty and use file-based approach
  return [];
}

/**
 * Get all columns for all tables
 */
async function getColumnsViaSQL(supabaseClient) {
  const query = `
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
      c.ordinal_position
    FROM information_schema.tables t
    JOIN information_schema.columns c 
      ON t.table_name = c.table_name 
      AND t.table_schema = c.table_schema
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position;
  `;
  
  return [];
}

/**
 * Compare two schemas and generate migration SQL
 */
function compareAndGenerateMigration(capcoSchema, rothcoSchema) {
  const migration = [];
  const issues = {
    missingTables: [],
    extraTables: [],
    tableCasingMismatches: [],
    missingColumns: {},
    extraColumns: {},
    columnCasingMismatches: {},
    typeMismatches: {},
  };

  migration.push('-- ============================================================================');
  migration.push('-- Migration SQL: Make Rothco match Capco (Master) schema');
  migration.push(`-- Generated: ${new Date().toISOString()}`);
  migration.push('-- ============================================================================\n');

  // Compare tables
  const capcoTables = new Set(capcoSchema.tables.map(t => t.table_name));
  const rothcoTables = new Set(rothcoSchema.tables.map(t => t.table_name));
  
  // Find missing tables
  capcoSchema.tables.forEach(table => {
    if (!rothcoTables.has(table.table_name)) {
      issues.missingTables.push(table.table_name);
    }
  });

  // Find extra tables
  rothcoSchema.tables.forEach(table => {
    if (!capcoTables.has(table.table_name)) {
      issues.extraTables.push(table.table_name);
    }
  });

  // Find casing mismatches (case-insensitive match but different casing)
  const capcoTableMap = new Map(capcoSchema.tables.map(t => [t.table_name.toLowerCase(), t.table_name]));
  const rothcoTableMap = new Map(rothcoSchema.tables.map(t => [t.table_name.toLowerCase(), t.table_name]));
  
  capcoTableMap.forEach((capcoTable, lowerKey) => {
    const rothcoTable = rothcoTableMap.get(lowerKey);
    if (rothcoTable && capcoTable !== rothcoTable) {
      issues.tableCasingMismatches.push({
        capco: capcoTable,
        rothco: rothcoTable,
      });
    }
  });

  // Generate SQL for table renames
  if (issues.tableCasingMismatches.length > 0) {
    migration.push('-- ============================================================================');
    migration.push('-- STEP 1: Rename tables to match Capco casing');
    migration.push('-- ============================================================================\n');
    
    issues.tableCasingMismatches.forEach(({ capco, rothco }) => {
      migration.push(`ALTER TABLE IF EXISTS "${rothco}" RENAME TO "${capco}";`);
    });
    migration.push('');
  }

  // Compare columns for each table
  const capcoColumnsByTable = new Map();
  capcoSchema.columns.forEach(col => {
    if (!capcoColumnsByTable.has(col.table_name)) {
      capcoColumnsByTable.set(col.table_name, []);
    }
    capcoColumnsByTable.get(col.table_name).push(col);
  });

  const rothcoColumnsByTable = new Map();
  rothcoSchema.columns.forEach(col => {
    if (!rothcoColumnsByTable.has(col.table_name)) {
      rothcoColumnsByTable.set(col.table_name, []);
    }
    rothcoColumnsByTable.get(col.table_name).push(col);
  });

  // Compare columns for each table that exists in both
  migration.push('-- ============================================================================');
  migration.push('-- STEP 2: Fix column differences');
  migration.push('-- ============================================================================\n');

  capcoColumnsByTable.forEach((capcoCols, tableName) => {
    if (!rothcoColumnsByTable.has(tableName)) {
      return; // Table doesn't exist in Rothco, will be handled separately
    }

    const rothcoCols = rothcoColumnsByTable.get(tableName);
    const capcoColMap = new Map(capcoCols.map(c => [c.column_name.toLowerCase(), c]));
    const rothcoColMap = new Map(rothcoCols.map(c => [c.column_name.toLowerCase(), c]));

    // Find missing columns
    capcoCols.forEach(capcoCol => {
      const rothcoCol = rothcoColMap.get(capcoCol.column_name.toLowerCase());
      if (!rothcoCol) {
        if (!issues.missingColumns[tableName]) {
          issues.missingColumns[tableName] = [];
        }
        issues.missingColumns[tableName].push(capcoCol);
      } else if (capcoCol.column_name !== rothcoCol.column_name) {
        // Casing mismatch
        if (!issues.columnCasingMismatches[tableName]) {
          issues.columnCasingMismatches[tableName] = [];
        }
        issues.columnCasingMismatches[tableName].push({
          capco: capcoCol.column_name,
          rothco: rothcoCol.column_name,
        });
      }
    });
  });

  // Generate SQL for column renames
  Object.entries(issues.columnCasingMismatches).forEach(([tableName, mismatches]) => {
    migration.push(`-- Fix column casing in table "${tableName}"`);
    mismatches.forEach(({ capco, rothco }) => {
      migration.push(`ALTER TABLE "${tableName}" RENAME COLUMN "${rothco}" TO "${capco}";`);
    });
    migration.push('');
  });

  // Generate SQL for missing columns
  Object.entries(issues.missingColumns).forEach(([tableName, columns]) => {
    migration.push(`-- Add missing columns to table "${tableName}"`);
    columns.forEach(col => {
      const dataType = getPostgresType(col);
      const nullable = col.is_nullable === 'YES' ? '' : 'NOT NULL';
      const defaultValue = col.column_default ? `DEFAULT ${col.column_default}` : '';
      migration.push(`ALTER TABLE "${tableName}" ADD COLUMN "${col.column_name}" ${dataType} ${nullable} ${defaultValue};`.trim());
    });
    migration.push('');
  });

  // Missing tables (need CREATE TABLE statements - simplified)
  if (issues.missingTables.length > 0) {
    migration.push('-- ============================================================================');
    migration.push('-- STEP 3: Create missing tables');
    migration.push('-- ============================================================================');
    migration.push('-- WARNING: These tables need to be created manually based on Capco schema');
    migration.push('-- Export CREATE TABLE statements from Capco and run them here\n');
    issues.missingTables.forEach(tableName => {
      migration.push(`-- CREATE TABLE "${tableName}" (...);`);
    });
    migration.push('');
  }

  // Extra tables (commented out for safety)
  if (issues.extraTables.length > 0) {
    migration.push('-- ============================================================================');
    migration.push('-- STEP 4: Extra tables in Rothco (review before removing)');
    migration.push('-- ============================================================================\n');
    issues.extraTables.forEach(tableName => {
      migration.push(`-- DROP TABLE IF EXISTS "${tableName}";`);
    });
    migration.push('');
  }

  return {
    migrationSQL: migration.join('\n'),
    issues,
  };
}

/**
 * Convert column metadata to PostgreSQL type definition
 */
function getPostgresType(column) {
  let type = column.udt_name || column.data_type;
  
  // Handle specific types
  if (type === 'varchar' && column.character_maximum_length) {
    type = `varchar(${column.character_maximum_length})`;
  } else if (type === 'numeric' && column.numeric_precision) {
    type = `numeric(${column.numeric_precision}${column.numeric_scale ? ',' + column.numeric_scale : ''})`;
  } else if (type === '_text') {
    type = 'text[]';
  }
  
  return type;
}

/**
 * Main function
 */
async function main() {
  log('🔍 Comprehensive Schema Comparison: Capco (Master) vs Rothco', 'cyan');
  log('='.repeat(70), 'cyan');
  
  // Check if we have file inputs or need to query databases
  const args = process.argv.slice(2);
  const capcoTablesFile = args.find(arg => arg.startsWith('--capco-tables='))?.split('=')[1];
  const capcoColumnsFile = args.find(arg => arg.startsWith('--capco-columns='))?.split('=')[1];
  const rothcoTablesFile = args.find(arg => arg.startsWith('--rothco-tables='))?.split('=')[1];
  const rothcoColumnsFile = args.find(arg => arg.startsWith('--rothco-columns='))?.split('=')[1];
  const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'sync-migration.sql';

  if (capcoTablesFile && capcoColumnsFile && rothcoTablesFile && rothcoColumnsFile) {
    // Load from files
    log('📂 Loading schemas from files...', 'cyan');
    const capcoTables = JSON.parse(fs.readFileSync(capcoTablesFile, 'utf8'));
    const capcoColumns = JSON.parse(fs.readFileSync(capcoColumnsFile, 'utf8'));
    const rothcoTables = JSON.parse(fs.readFileSync(rothcoTablesFile, 'utf8'));
    const rothcoColumns = JSON.parse(fs.readFileSync(rothcoColumnsFile, 'utf8'));

    const capcoSchema = { tables: capcoTables, columns: capcoColumns };
    const rothcoSchema = { tables: rothcoTables, columns: rothcoColumns };

    const { migrationSQL, issues } = compareAndGenerateMigration(capcoSchema, rothcoSchema);

    // Write migration SQL
    fs.writeFileSync(outputFile, migrationSQL);
    log(`\n✅ Migration SQL written to: ${outputFile}`, 'green');

    // Print summary
    log('\n📊 Comparison Summary:', 'cyan');
    log(`   Missing tables: ${issues.missingTables.length}`, issues.missingTables.length > 0 ? 'red' : 'green');
    log(`   Extra tables: ${issues.extraTables.length}`, issues.extraTables.length > 0 ? 'yellow' : 'green');
    log(`   Table casing mismatches: ${issues.tableCasingMismatches.length}`, issues.tableCasingMismatches.length > 0 ? 'yellow' : 'green');
    log(`   Tables with missing columns: ${Object.keys(issues.missingColumns).length}`, Object.keys(issues.missingColumns).length > 0 ? 'red' : 'green');
    log(`   Tables with column casing mismatches: ${Object.keys(issues.columnCasingMismatches).length}`, Object.keys(issues.columnCasingMismatches).length > 0 ? 'yellow' : 'green');

  } else {
    // Need to query databases - provide instructions
    log('\n📝 To use this script:', 'cyan');
    log('   1. Export schemas from both databases using SQL queries', 'blue');
    log('   2. Run this script with file paths:', 'blue');
    log('      node scripts/sync-rothco-to-capco-schema.js \\', 'blue');
    log('        --capco-tables capco-tables.json \\', 'blue');
    log('        --capco-columns capco-columns.json \\', 'blue');
    log('        --rothco-tables rothco-tables.json \\', 'blue');
    log('        --rothco-columns rothco-columns.json \\', 'blue');
    log('        --output sync-migration.sql', 'blue');
    log('\n   Or use the SQL queries in sql-queriers/compare-capco-rothco-schema.sql', 'cyan');
  }
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
