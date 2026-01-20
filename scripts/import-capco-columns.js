#!/usr/bin/env node

/**
 * Import Capco columns JSON
 * Paste your JSON into this file between the START and END markers, then run:
 * node scripts/import-capco-columns.js
 */

import fs from 'fs';

// PASTE YOUR FULL CAPCO COLUMNS JSON HERE BETWEEN THE QUOTES:
const capcoColumnsJSON = `[]`;

try {
  const data = JSON.parse(capcoColumnsJSON);
  fs.writeFileSync('capco-columns.json', JSON.stringify(data, null, 2));
  console.log(`✅ Saved ${data.length} Capco columns to capco-columns.json`);
} catch (e) {
  console.error('❌ Error:', e.message);
  console.error('\nMake sure you pasted valid JSON between the quotes in this script.');
  process.exit(1);
}
