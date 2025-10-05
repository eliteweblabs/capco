#!/usr/bin/env node

/**
 * Replace Class - Replace obfuscated classes with Tailwind classes
 * 
 * Usage: node replace-class.js [old-class] [new-class] [file-pattern]
 * Example: node replace-class.js _LPVUrp9Uina5fcERqWC fixed "src/**/*.astro"
 */

import fs from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function replaceClass(oldClass, newClass, pattern = 'src/**/*.{astro,js,ts,jsx,tsx}') {
  console.log(`🔄 Replacing "${oldClass}" with "${newClass}" in files matching "${pattern}"\n`);
  
  const files = await glob(pattern, {
    cwd: __dirname,
    ignore: ['**/node_modules/**', '**/dist/**']
  });
  
  let totalReplacements = 0;
  let filesModified = 0;
  
  for (const file of files) {
    try {
      const filePath = path.join(__dirname, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Count occurrences
      const occurrences = (content.match(new RegExp(oldClass, 'g')) || []).length;
      
      if (occurrences > 0) {
        const newContent = content.replace(new RegExp(oldClass, 'g'), newClass);
        fs.writeFileSync(filePath, newContent);
        
        console.log(`✅ ${file}: ${occurrences} replacements`);
        totalReplacements += occurrences;
        filesModified++;
      }
    } catch (error) {
      console.warn(`⚠️  Could not process ${file}: ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Replacement complete!`);
  console.log(`📊 Modified ${filesModified} files`);
  console.log(`🔄 Made ${totalReplacements} total replacements`);
}

// Get command line arguments
const [oldClass, newClass, pattern] = process.argv.slice(2);

if (!oldClass || !newClass) {
  console.log(`
🔄 Class Replacement Tool

Usage: node replace-class.js [old-class] [new-class] [file-pattern]

Examples:
  node replace-class.js _LPVUrp9Uina5fcERqWC fixed
  node replace-class.js smkr9JarUQxXDNNOXpIs static "src/**/*.astro"
  node replace-class.js pq2JRWtiWcwYnw3xueNl "bg-white text-black"

This tool will:
1. Find all files matching the pattern
2. Replace the old class with the new class
3. Show you how many replacements were made
`);
  process.exit(1);
}

replaceClass(oldClass, newClass, pattern).catch(console.error);
