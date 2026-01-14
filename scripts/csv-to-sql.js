#!/usr/bin/env node

/**
 * Convert CSV export from Supabase SQL Editor to executable SQL
 * Takes CSV files and converts them to CREATE statements
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
const csvFile = process.argv[2];

if (!csvFile || !fs.existsSync(csvFile)) {
  log('❌ CSV file not found', 'red');
  log('');
  log('Usage:', 'yellow');
  log('  node scripts/csv-to-sql.js <csv-file>', 'yellow');
  log('');
  log('Or provide multiple CSV files:', 'yellow');
  log('  node scripts/csv-to-sql.js tables.csv functions.csv triggers.csv', 'yellow');
  process.exit(1);
}

const csvFiles = process.argv.slice(2);
const outputFile = path.join(process.cwd(), `schema-import-${Date.now()}.sql`);

log('🔄 Converting CSV to SQL', 'green');
log('====================================', 'green');
log('');

let allSQL = '-- =====================================================\n';
allSQL += '-- SCHEMA IMPORT - Generated from CSV export\n';
allSQL += `-- Generated: ${new Date().toISOString()}\n`;
allSQL += '-- =====================================================\n\n';

csvFiles.forEach((csvFile, index) => {
  if (!fs.existsSync(csvFile)) {
    log(`⚠️  File not found: ${csvFile}`, 'yellow');
    return;
  }

  log(`Processing: ${csvFile}`, 'blue');
  
  const content = fs.readFileSync(csvFile, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    log(`  ⚠️  Empty file`, 'yellow');
    return;
  }

  // Skip header row if present
  let startIndex = 0;
  if (lines[0].toLowerCase().includes('create') || lines[0].toLowerCase().includes('definition')) {
    startIndex = 1; // Skip header
  }

  // Extract SQL statements from CSV
  // CSV format: usually has quotes around values, and CREATE statements are in one column
  lines.slice(startIndex).forEach((line, lineNum) => {
    // Remove CSV quotes and extract the SQL statement
    // Handle both quoted and unquoted CSV formats
    let sql = line.trim();
    
    // If line starts with quote, remove surrounding quotes
    if (sql.startsWith('"') && sql.endsWith('"')) {
      sql = sql.slice(1, -1);
    }
    
    // Unescape CSV quotes ("" becomes ")
    sql = sql.replace(/""/g, '"');
    
    // Remove CSV column separators if present (keep only first column which should be SQL)
    const firstComma = sql.indexOf(',');
    if (firstComma > 0 && !sql.trim().startsWith('CREATE') && !sql.trim().startsWith('--')) {
      // Might be CSV with multiple columns, take first one
      sql = sql.substring(0, firstComma).trim();
      if (sql.startsWith('"') && sql.endsWith('"')) {
        sql = sql.slice(1, -1);
      }
    }
    
    // Skip empty lines and non-SQL lines
    if (!sql || sql.length < 5) return;
    
    // Only include lines that look like SQL
    if (sql.toUpperCase().includes('CREATE') || 
        sql.toUpperCase().includes('ALTER') ||
        sql.toUpperCase().includes('--') ||
        sql.toUpperCase().includes('SELECT') ||
        sql.toUpperCase().includes('INSERT')) {
      
      // Clean up the SQL statement
      sql = sql.trim();
      
      // Ensure it ends with semicolon if it's a CREATE/ALTER statement
      if ((sql.toUpperCase().startsWith('CREATE') || sql.toUpperCase().startsWith('ALTER')) && !sql.endsWith(';')) {
        sql += ';';
      }
      
      allSQL += sql + '\n';
    }
  });
  
  log(`  ✅ Processed ${lines.length - startIndex} lines`, 'green');
  allSQL += '\n';
});

// Write output
fs.writeFileSync(outputFile, allSQL);

log('');
log('✅ Conversion complete!', 'green');
log(`📄 Output file: ${outputFile}`, 'blue');
log('');
log('Next steps:', 'yellow');
log('1. Review the SQL file', 'yellow');
log('2. Go to target project SQL Editor:', 'yellow');
log('   https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/sql', 'yellow');
log('3. Copy and paste the SQL statements', 'yellow');
log('4. Run the SQL', 'yellow');
