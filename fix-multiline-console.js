#!/usr/bin/env node

/**
 * Fix multi-line console.log statements that were partially commented
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const processFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    let modified = false;
    let newContent = content;
    
    // Fix multi-line console.log statements
    // Pattern: // console.log(... followed by uncommented lines
    const multilineRegex = /\/\/\s*console\.log\([^)]*$/gm;
    
    newContent = newContent.replace(multilineRegex, (match) => {
      // Find the end of this console.log statement
      const startIndex = newContent.indexOf(match);
      const afterMatch = newContent.substring(startIndex + match.length);
      
      // Look for the closing ); and any following lines that should be commented
      const lines = afterMatch.split('\n');
      let result = match;
      let i = 0;
      
      // Continue until we find the closing );
      while (i < lines.length) {
        const line = lines[i];
        result += '\n' + line;
        
        // If this line ends with );, we're done
        if (line.trim().endsWith(');')) {
          break;
        }
        
        // If this line is not already commented and looks like part of console.log
        if (!line.trim().startsWith('//') && 
            (line.includes('projectId') || line.includes('currentUser') || 
             line.includes('userEmail') || line.includes('userId') ||
             line.includes('userRole') || line.includes('userName') ||
             line.includes('file') || line.includes('data') ||
             line.includes('response') || line.includes('status') ||
             line.includes('error') || line.includes('success'))) {
          // Comment out this line
          result = result.replace(/\n([^/].*)$/, '\n// $1');
        }
        
        i++;
      }
      
      modified = true;
      return result;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed multi-line console.log in: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
};

// Process the FileManager.astro file specifically
const filePath = path.join(__dirname, 'src/components/project/FileManager.astro');
processFile(filePath);
console.log('✅ Fixed multi-line console.log statements!');
