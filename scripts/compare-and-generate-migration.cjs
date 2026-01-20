#!/usr/bin/env node

/**
 * Compare Capco and Rothco schemas and generate migration SQL
 * Uses CommonJS for compatibility
 */

const fs = require('fs');

// Load schemas
const capcoTables = JSON.parse(fs.readFileSync('capco-tables.json', 'utf8'));
const capcoColumns = JSON.parse(fs.readFileSync('capco-columns.json', 'utf8'));
const rothcoTables = JSON.parse(fs.readFileSync('rothco-schema-tables.json', 'utf8'));
const rothcoColumns = JSON.parse(fs.readFileSync('rothco-schema-columns.json', 'utf8'));

console.log('🔍 Comprehensive Schema Comparison: Capco (Master) vs Rothco');
console.log('='.repeat(70));
console.log(`Capco: ${capcoTables.length} tables, ${capcoColumns.length} columns`);
console.log(`Rothco: ${rothcoTables.length} tables, ${rothcoColumns.length} columns`);
console.log('');

// Compare tables
const capcoTableNames = new Set(capcoTables.map(t => t.table_name));
const rothcoTableNames = new Set(rothcoTables.map(t => t.table_name));

const missingTables = [...capcoTableNames].filter(t => !rothcoTableNames.has(t));
const extraTables = [...rothcoTableNames].filter(t => !capcoTableNames.has(t));

// Case-insensitive comparison for casing mismatches
const capcoTableMap = new Map([...capcoTableNames].map(t => [t.toLowerCase(), t]));
const rothcoTableMap = new Map([...rothcoTableNames].map(t => [t.toLowerCase(), t]));

const tableCasingMismatches = [];
capcoTableMap.forEach((capcoTable, lower) => {
  const rothcoTable = rothcoTableMap.get(lower);
  if (rothcoTable && capcoTable !== rothcoTable) {
    tableCasingMismatches.push({ capco: capcoTable, rothco: rothcoTable });
  }
});

// Organize columns by table
const capcoColumnsByTable = new Map();
capcoColumns.forEach(col => {
  if (!capcoColumnsByTable.has(col.table_name)) {
    capcoColumnsByTable.set(col.table_name, []);
  }
  capcoColumnsByTable.get(col.table_name).push(col);
});

const rothcoColumnsByTable = new Map();
rothcoColumns.forEach(col => {
  if (!rothcoColumnsByTable.has(col.table_name)) {
    rothcoColumnsByTable.set(col.table_name, []);
  }
  rothcoColumnsByTable.get(col.table_name).push(col);
});

// Compare columns for each table
const missingColumns = {};
const extraColumns = {};
const columnCasingMismatches = {};
const typeMismatches = {};

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
      if (!missingColumns[tableName]) {
        missingColumns[tableName] = [];
      }
      missingColumns[tableName].push(capcoCol);
    } else if (capcoCol.column_name !== rothcoCol.column_name) {
      // Casing mismatch
      if (!columnCasingMismatches[tableName]) {
        columnCasingMismatches[tableName] = [];
      }
      columnCasingMismatches[tableName].push({
        capco: capcoCol.column_name,
        rothco: rothcoCol.column_name,
      });
    } else {
      // Check for type mismatches
      const capcoType = getPostgresType(capcoCol);
      const rothcoType = getPostgresType(rothcoCol);
      if (capcoType !== rothcoType) {
        if (!typeMismatches[tableName]) {
          typeMismatches[tableName] = [];
        }
        typeMismatches[tableName].push({
          column: capcoCol.column_name,
          capco: capcoType,
          rothco: rothcoType,
        });
      }
    }
  });

  // Find extra columns
  rothcoCols.forEach(rothcoCol => {
    const capcoCol = capcoColMap.get(rothcoCol.column_name.toLowerCase());
    if (!capcoCol) {
      if (!extraColumns[tableName]) {
        extraColumns[tableName] = [];
      }
      extraColumns[tableName].push(rothcoCol);
    }
  });
});

function getPostgresType(column) {
  let type = column.udt_name || column.data_type;
  
  if (type === 'varchar' && column.character_maximum_length) {
    type = `varchar(${column.character_maximum_length})`;
  } else if (type === 'numeric' && column.numeric_precision) {
    type = `numeric(${column.numeric_precision}${column.numeric_scale ? ',' + column.numeric_scale : ''})`;
  } else if (type === '_text') {
    type = 'text[]';
  }
  
  return type;
}

// Generate migration SQL
const migration = [];

migration.push('-- ============================================================================');
migration.push('-- Migration SQL: Make Rothco match Capco (Master) schema');
migration.push(`-- Generated: ${new Date().toISOString()}`);
migration.push('-- ============================================================================\n');

// STEP 1: Rename tables with casing mismatches
if (tableCasingMismatches.length > 0) {
  migration.push('-- ============================================================================');
  migration.push('-- STEP 1: Rename tables to match Capco casing');
  migration.push('-- ============================================================================\n');
  
  tableCasingMismatches.forEach(({ capco, rothco }) => {
    migration.push(`ALTER TABLE IF EXISTS "${rothco}" RENAME TO "${capco}";`);
  });
  migration.push('');
}

// STEP 2: Fix column differences
migration.push('-- ============================================================================');
migration.push('-- STEP 2: Fix column differences');
migration.push('-- ============================================================================\n');

// Column renames (casing)
Object.entries(columnCasingMismatches).forEach(([tableName, mismatches]) => {
  migration.push(`-- Fix column casing in table "${tableName}"`);
  mismatches.forEach(({ capco, rothco }) => {
    migration.push(`ALTER TABLE "${tableName}" RENAME COLUMN "${rothco}" TO "${capco}";`);
  });
  migration.push('');
});

// Missing columns
Object.entries(missingColumns).forEach(([tableName, columns]) => {
  migration.push(`-- Add missing columns to table "${tableName}"`);
  columns.forEach(col => {
    const dataType = getPostgresType(col);
    const nullable = col.is_nullable === 'YES' ? '' : 'NOT NULL';
    const defaultValue = col.column_default ? `DEFAULT ${col.column_default}` : '';
    const parts = [`ALTER TABLE "${tableName}" ADD COLUMN "${col.column_name}" ${dataType}`];
    if (nullable) parts.push(nullable);
    if (defaultValue) parts.push(defaultValue);
    migration.push(parts.join(' ') + ';');
  });
  migration.push('');
});

// Type mismatches (warnings)
if (Object.keys(typeMismatches).length > 0) {
  migration.push('-- ============================================================================');
  migration.push('-- STEP 3: Type mismatches (REVIEW CAREFULLY - may require data migration)');
  migration.push('-- ============================================================================\n');
  Object.entries(typeMismatches).forEach(([tableName, mismatches]) => {
    migration.push(`-- Type mismatches in table "${tableName}":`);
    mismatches.forEach(({ column, capco, rothco }) => {
      migration.push(`--   "${column}": Rothco has ${rothco}, Capco has ${capco}`);
      migration.push(`--   ALTER TABLE "${tableName}" ALTER COLUMN "${column}" TYPE ${capco}; -- REVIEW: May need USING clause`);
    });
    migration.push('');
  });
}

// Missing tables
if (missingTables.length > 0) {
  migration.push('-- ============================================================================');
  migration.push('-- STEP 4: Create missing tables');
  migration.push('-- ============================================================================');
  migration.push('-- WARNING: These tables need to be created manually based on Capco schema');
  migration.push('-- Export CREATE TABLE statements from Capco and run them here\n');
  missingTables.forEach(tableName => {
    migration.push(`-- CREATE TABLE "${tableName}" (...);`);
  });
  migration.push('');
}

// Extra tables (commented out for safety)
if (extraTables.length > 0) {
  migration.push('-- ============================================================================');
  migration.push('-- STEP 5: Extra tables in Rothco (review before removing)');
  migration.push('-- ============================================================================\n');
  extraTables.forEach(tableName => {
    migration.push(`-- DROP TABLE IF EXISTS "${tableName}";`);
  });
  migration.push('');
}

// Write migration SQL
const migrationSQL = migration.join('\n');
fs.writeFileSync('sync-rothco-to-capco.sql', migrationSQL);

// Print summary
console.log('📊 Comparison Summary:');
console.log(`   Missing tables: ${missingTables.length}`, missingTables.length > 0 ? '❌' : '✅');
if (missingTables.length > 0) {
  missingTables.forEach(t => console.log(`      - ${t}`));
}

console.log(`   Extra tables: ${extraTables.length}`, extraTables.length > 0 ? '⚠️' : '✅');
if (extraTables.length > 0 && extraTables.length <= 10) {
  extraTables.forEach(t => console.log(`      - ${t}`));
} else if (extraTables.length > 10) {
  console.log(`      (showing first 10 of ${extraTables.length})`);
  extraTables.slice(0, 10).forEach(t => console.log(`      - ${t}`));
}

console.log(`   Table casing mismatches: ${tableCasingMismatches.length}`, tableCasingMismatches.length > 0 ? '⚠️' : '✅');
if (tableCasingMismatches.length > 0) {
  tableCasingMismatches.forEach(({capco, rothco}) => console.log(`      - "${rothco}" → "${capco}"`));
}

console.log(`   Tables with missing columns: ${Object.keys(missingColumns).length}`, Object.keys(missingColumns).length > 0 ? '❌' : '✅');
if (Object.keys(missingColumns).length > 0) {
  Object.entries(missingColumns).forEach(([table, cols]) => {
    console.log(`      - "${table}": ${cols.length} missing columns`);
  });
}

console.log(`   Tables with column casing mismatches: ${Object.keys(columnCasingMismatches).length}`, Object.keys(columnCasingMismatches).length > 0 ? '⚠️' : '✅');
if (Object.keys(columnCasingMismatches).length > 0) {
  Object.entries(columnCasingMismatches).forEach(([table, mismatches]) => {
    console.log(`      - "${table}": ${mismatches.length} casing mismatches`);
  });
}

console.log(`   Tables with type mismatches: ${Object.keys(typeMismatches).length}`, Object.keys(typeMismatches).length > 0 ? '⚠️' : '✅');

console.log(`\n✅ Migration SQL written to: sync-rothco-to-capco.sql`);
