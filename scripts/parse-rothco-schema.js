#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Parse Rothco schema columns from a raw export file and update site-config-rothco-built.json
 * Usage:
 *   node scripts/parse-rothco-schema.js rothco-raw.json
 */
const configPath = path.join(process.cwd(), 'site-config-rothco-built.json');
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node scripts/parse-rothco-schema.js <path-to-raw-export.json>');
  process.exit(1);
}
const content = fs.readFileSync(inputFile, 'utf8');

let data;
try {
  const parsed = JSON.parse(content);
  if (typeof parsed === 'string') {
    data = JSON.parse(parsed);
  } else if (Array.isArray(parsed)) {
    data = parsed;
  } else {
    throw new Error('Unexpected format');
  }
} catch (e) {
  const match = content.match(/\[[\s\S]*\]/);
  if (match) {
    data = JSON.parse(match[0]);
  } else {
    console.error('❌ Could not parse JSON:', e.message);
    process.exit(1);
  }
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
config.schemaColumns = data;
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log('✅ Parsed and saved Rothco columns to site-config-rothco-built.json (schemaColumns)');
console.log(`📊 Total columns: ${data.length}`);
console.log(`📊 Unique tables: ${new Set(data.map(c => c.table_name)).size}`);
