#!/usr/bin/env node

/**
 * Save JSON from stdin to a file
 * Usage: cat your-json.txt | node scripts/save-json-from-stdin.js output.json
 */

import fs from 'fs';
import { createInterface } from 'readline';

const outputFile = process.argv[2] || 'output.json';

const rl = createInterface({
  input: process.stdin,
  terminal: false
});

let input = '';
rl.on('line', (line) => {
  input += line + '\n';
});

rl.on('close', () => {
  try {
    const data = JSON.parse(input.trim());
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`✅ Saved ${Array.isArray(data) ? data.length : 'data'} items to ${outputFile}`);
  } catch (e) {
    console.error('❌ Error parsing JSON:', e.message);
    process.exit(1);
  }
});
