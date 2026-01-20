#!/usr/bin/env node

import fs from 'fs';

const content = fs.readFileSync('rothco-schema-columns.json', 'utf8');

// The file contains escaped JSON string like: [{\"table_name\":...}]
// Need to unescape it
let data;
try {
  // Try parsing as JSON string first (unescapes it)
  const parsed = JSON.parse(content);
  if (typeof parsed === 'string') {
    // It's a double-encoded JSON string
    data = JSON.parse(parsed);
  } else if (Array.isArray(parsed)) {
    // Already an array
    data = parsed;
  } else {
    throw new Error('Unexpected format');
  }
} catch (e) {
  // Try to extract JSON array directly
  const match = content.match(/\[[\s\S]*\]/);
  if (match) {
    data = JSON.parse(match[0]);
  } else {
    console.error('❌ Could not parse JSON:', e.message);
    process.exit(1);
  }
}

// Save properly formatted JSON
fs.writeFileSync('rothco-schema-columns.json', JSON.stringify(data, null, 2));

console.log('✅ Parsed and saved Rothco columns schema');
console.log(`📊 Total columns: ${data.length}`);
console.log(`📊 Unique tables: ${new Set(data.map(c => c.table_name)).size}`);
