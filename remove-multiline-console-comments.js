#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function removeMultilineConsoleComments(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixed = content;
    let changes = 0;

    // Pattern to match multi-line commented console.log statements
    // This matches: // console.log( followed by commented lines until // );
    const multilinePattern = /\/\/ console\.log\(\s*\n((?:\s*\/\/[^\n]*\n)*)\s*\/\/ \);?/gm;
    
    fixed = fixed.replace(multilinePattern, (match) => {
      changes++;
      return ''; // Remove the entire multi-line commented console.log
    });

    // Also handle patterns like: // console.log("text", \n //   param \n // );
    const multilinePattern2 = /\/\/ console\.log\([^)]*\n((?:\s*\/\/[^\n]*\n)*)\s*\/\/ \);?/gm;
    
    fixed = fixed.replace(multilinePattern2, (match) => {
      changes++;
      return ''; // Remove the entire multi-line commented console.log
    });

    // Clean up any resulting empty lines (more than 2 consecutive)
    fixed = fixed.replace(/\n\s*\n\s*\n+/g, '\n\n');

    if (changes > 0) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`✅ Removed ${changes} multi-line commented console.log statements from ${filePath}`);
      return changes;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
  return 0;
}

function findFiles(dir, extensions = ['.ts', '.js', '.astro']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Main execution
const srcDir = path.join(process.cwd(), 'src');
const files = findFiles(srcDir);

console.log(`🔍 Found ${files.length} files to check...`);

let totalChanges = 0;
for (const file of files) {
  totalChanges += removeMultilineConsoleComments(file);
}

if (totalChanges === 0) {
  console.log('✨ No multi-line commented console.log statements found to remove');
} else {
  console.log(`\n✨ Total: Removed ${totalChanges} multi-line commented console.log statements`);
}
