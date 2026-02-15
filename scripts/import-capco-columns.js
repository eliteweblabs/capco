#!/usr/bin/env node

/**
 * Import Capco columns JSON into site-config-capco-design-group.json
 * Paste your JSON into this file between the quotes, then run:
 * node scripts/import-capco-columns.js
 */

import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'site-config-capco-design-group.json');

// PASTE YOUR FULL CAPCO COLUMNS JSON HERE BETWEEN THE QUOTES:
const capcoColumnsJSON = `[]`;

try {
  const data = JSON.parse(capcoColumnsJSON);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.schemaColumns = data;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Saved ${data.length} Capco columns to site-config-capco-design-group.json (schemaColumns)`);
} catch (e) {
  console.error('❌ Error:', e.message);
  console.error('\nMake sure you pasted valid JSON between the quotes in this script.');
  process.exit(1);
}
