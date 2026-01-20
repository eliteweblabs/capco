#!/usr/bin/env node

/**
 * Generate CREATE TABLE statements for missing tables from Capco schema
 */

const fs = require('fs');

const capcoColumns = JSON.parse(fs.readFileSync('capco-columns.json', 'utf8'));

const missingTables = [
  'cmsPages',
  'directMessages',
  'documentComponents',
  'documentTemplates',
  'filesGlobal',
  'globalSettings'
];

function getPostgresType(col) {
  let type = col.udt_name || col.data_type;
  
  if (type === 'varchar' || type === 'character varying') {
    if (col.character_maximum_length) {
      type = `varchar(${col.character_maximum_length})`;
    } else {
      type = 'varchar';
    }
  } else if (type === 'numeric') {
    if (col.numeric_precision) {
      type = `numeric(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})`;
    } else {
      type = 'numeric';
    }
  } else if (type === 'int4') {
    type = 'integer';
  } else if (type === 'int8') {
    type = 'bigint';
  } else if (type === 'timestamptz') {
    type = 'timestamptz';
  } else if (type === 'timestamp with time zone') {
    type = 'timestamptz';
  } else if (type === 'text') {
    type = 'text';
  } else if (type === 'uuid') {
    type = 'uuid';
  } else if (type === 'jsonb') {
    type = 'jsonb';
  } else if (type === 'boolean') {
    type = 'boolean';
  }
  
  return type;
}

const createStatements = [];

missingTables.forEach(tableName => {
  const tableColumns = capcoColumns.filter(col => col.table_name === tableName);
  
  if (tableColumns.length === 0) {
    console.error(`⚠️  No columns found for table: ${tableName}`);
    return;
  }
  
  // Sort by ordinal_position
  tableColumns.sort((a, b) => a.ordinal_position - b.ordinal_position);
  
  const columnDefs = tableColumns.map(col => {
    const type = getPostgresType(col);
    const nullable = col.is_nullable === 'NO' ? ' NOT NULL' : '';
    let defaultValue = '';
    
    if (col.column_default) {
      // Handle function defaults
      if (col.column_default.includes('uuid_generate_v4()')) {
        defaultValue = ' DEFAULT uuid_generate_v4()';
      } else if (col.column_default.includes('now()')) {
        defaultValue = ' DEFAULT now()';
      } else if (col.column_default.includes('nextval')) {
        defaultValue = ` DEFAULT ${col.column_default}`;
      } else {
        defaultValue = ` DEFAULT ${col.column_default}`;
      }
    }
    
    return `    "${col.column_name}" ${type}${nullable}${defaultValue}`;
  });
  
  const createSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n${columnDefs.join(',\n')}\n);`;
  
  createStatements.push(`-- Table: ${tableName}`);
  createStatements.push(createSQL);
  createStatements.push('');
});

const output = createStatements.join('\n');
fs.writeFileSync('create-missing-tables.sql', output);

console.log('✅ Generated CREATE TABLE statements for missing tables:');
missingTables.forEach(t => console.log(`   - ${t}`));
console.log(`\n📝 SQL written to: create-missing-tables.sql`);
