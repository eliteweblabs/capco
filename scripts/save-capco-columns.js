#!/usr/bin/env node

/**
 * Save Capco columns JSON from stdin or file
 * Usage: 
 *   cat capco-columns-raw.json | node scripts/save-capco-columns.js > capco-columns.json
 *   OR: node scripts/save-capco-columns.js < capco-columns-raw.json > capco-columns.json
 */

import fs from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let input = '';
rl.on('line', (line) => {
  input += line + '\n';
});

rl.on('close', () => {
  try {
    const data = JSON.parse(input.trim());
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error parsing JSON:', e.message);
    process.exit(1);
  }
});
