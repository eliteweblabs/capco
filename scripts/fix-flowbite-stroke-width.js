#!/usr/bin/env node
/**
 * Script to fix stroke-width in Flowbite icons
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICON_DATA_PATH = path.join(__dirname, '../src/lib/icon-data.json');

// Load icons
const icons = JSON.parse(fs.readFileSync(ICON_DATA_PATH, 'utf-8'));
let fixedCount = 0;

// Fix stroke-width in all icons
for (const [name, svg] of Object.entries(icons)) {
  if (typeof svg === 'string' && svg.includes('stroke-width="16"')) {
    const fixed = svg
      .replace(/stroke-width="16"/g, 'stroke-width="2"')
      .replace(/\n\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    icons[name] = fixed;
    fixedCount++;
    console.log(`Fixed: ${name}`);
  }
}

// Write back
fs.writeFileSync(ICON_DATA_PATH, JSON.stringify(icons, null, 2));

console.log(`\n✨ Fixed ${fixedCount} icons`);

