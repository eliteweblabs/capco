#!/usr/bin/env node

/**
 * Convert CSV export from Supabase SQL Editor to executable SQL
 * Handles multi-line SQL statements properly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get CSV file path
const csvFiles = process.argv.slice(2);

if (csvFiles.length === 0) {
  log('❌ No CSV files provided', 'red');
  log('');
  log('Usage:', 'yellow');
  log('  node scripts/csv-to-sql-fixed.js <csv-file> [csv-file-2] ...', 'yellow');
  log('');
  log('Example:', 'yellow');
  log('  node scripts/csv-to-sql-fixed.js tables.csv functions.csv', 'yellow');
  process.exit(1);
}

const outputFile = path.join(process.cwd(), `schema-import-complete-${Date.now()}.sql`);

log('🔄 Converting CSV to SQL (Fixed Parser)', 'green');
log('==========================================', 'green');
log('');

let allSQL = '-- =====================================================\n';
allSQL += '-- SCHEMA IMPORT - Generated from CSV export\n';
allSQL += `-- Generated: ${new Date().toISOString()}\n`;
allSQL += '-- =====================================================\n\n';

csvFiles.forEach((csvFile) => {
  if (!fs.existsSync(csvFile)) {
    log(`⚠️  File not found: ${csvFile}`, 'yellow');
    return;
  }

  log(`Processing: ${csvFile}`, 'blue');
  
  const content = fs.readFileSync(csvFile, 'utf-8');
  
  // Parse CSV properly - handle multi-line values
  const lines = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentLine += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if (char === '\n' && !inQuotes) {
      // End of line (not in quotes)
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  
  // Add last line if exists
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }
  
  if (lines.length === 0) {
    log(`  ⚠️  Empty file`, 'yellow');
    return;
  }

  // Skip header row
  let startIndex = 0;
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('definition') || firstLine.includes('create_statement') || firstLine.includes('foreign_key')) {
    startIndex = 1;
    log(`  📋 Skipping header row`, 'yellow');
  }

  let sqlCount = 0;
  
  // Process each line
  lines.slice(startIndex).forEach((line) => {
    // Extract SQL from CSV - get first column (the SQL statement)
    let sql = line;
    
    // Remove CSV column header if it's still there
    if (sql.startsWith('foreign_key_definition') || sql.startsWith('create_statement')) {
      return; // Skip header lines
    }
    
    // If line starts with quote, it's a CSV quoted value
    if (sql.startsWith('"')) {
      // Find the closing quote (handling escaped quotes)
      let endQuote = -1;
      for (let i = 1; i < sql.length; i++) {
        if (sql[i] === '"' && sql[i + 1] !== '"' && sql[i + 1] !== ',') {
          endQuote = i;
          break;
        }
        if (sql[i] === '"' && sql[i + 1] === '"') {
          i++; // Skip escaped quote
        }
      }
      
      if (endQuote > 0) {
        sql = sql.substring(1, endQuote);
        // Unescape CSV quotes
        sql = sql.replace(/""/g, '"');
      }
    }
    
    // Remove everything after first comma (other CSV columns)
    const firstComma = sql.indexOf(',');
    if (firstComma > 0) {
      sql = sql.substring(0, firstComma);
      // Remove trailing quote if present
      if (sql.endsWith('"')) {
        sql = sql.slice(0, -1);
      }
    }
    
    // Clean up SQL
    sql = sql.trim();
    
    // Skip empty or very short lines
    if (!sql || sql.length < 5) return;
    
    // Only include SQL statements
    const upperSql = sql.toUpperCase();
    if (upperSql.includes('CREATE') || 
        upperSql.includes('ALTER') ||
        upperSql.startsWith('--')) {
      
      // Ensure proper semicolon
      if ((upperSql.startsWith('CREATE') || upperSql.startsWith('ALTER')) && !sql.endsWith(';')) {
        sql += ';';
      }
      
      allSQL += sql + '\n';
      sqlCount++;
    }
  });
  
  log(`  ✅ Extracted ${sqlCount} SQL statements`, 'green');
  allSQL += '\n';
});

// Write output
fs.writeFileSync(outputFile, allSQL);

log('');
log('✅ Conversion complete!', 'green');
log(`📄 Output file: ${outputFile}`, 'blue');
log('');

// Check what we got
const hasTables = allSQL.includes('CREATE TABLE');
const hasFunctions = allSQL.includes('CREATE FUNCTION') || allSQL.includes('CREATE OR REPLACE FUNCTION');
const hasTriggers = allSQL.includes('CREATE TRIGGER');
const hasPolicies = allSQL.includes('CREATE POLICY');
const hasForeignKeys = allSQL.includes('ALTER TABLE') && allSQL.includes('FOREIGN KEY');

log('📊 Summary:', 'blue');
if (hasTables) log('  ✅ CREATE TABLE statements', 'green');
else log('  ❌ Missing CREATE TABLE statements', 'red');
if (hasFunctions) log('  ✅ CREATE FUNCTION statements', 'green');
else log('  ⚠️  No CREATE FUNCTION statements', 'yellow');
if (hasTriggers) log('  ✅ CREATE TRIGGER statements', 'green');
else log('  ⚠️  No CREATE TRIGGER statements', 'yellow');
if (hasPolicies) log('  ✅ CREATE POLICY statements', 'green');
else log('  ⚠️  No CREATE POLICY statements', 'yellow');
if (hasForeignKeys) log('  ✅ ALTER TABLE (Foreign Keys)', 'green');
else log('  ⚠️  No Foreign Key constraints', 'yellow');

log('');
if (!hasTables) {
  log('⚠️  WARNING: Missing CREATE TABLE statements!', 'red');
  log('');
  log('You need to export PART 1 (tables) from the export script:', 'yellow');
  log('  sql-queriers/export-complete-schema.sql', 'yellow');
  log('');
  log('Run PART 1 in your source project SQL Editor and export as CSV.', 'yellow');
}

log('Next steps:', 'yellow');
log('1. Review the SQL file', 'yellow');
log('2. If missing tables, export PART 1 from export-complete-schema.sql', 'yellow');
log('3. Go to target project SQL Editor:', 'yellow');
log('   https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/sql', 'yellow');
log('4. Copy and paste the SQL statements', 'yellow');
log('5. Run the SQL', 'yellow');
