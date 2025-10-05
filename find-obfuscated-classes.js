#!/usr/bin/env node

/**
 * Find Obfuscated Classes - Scan your project for obfuscated CSS classes
 *
 * This script helps you find all obfuscated classes used in your project
 * so you can systematically replace them with Tailwind classes
 */

import fs from "fs";
import { glob } from "glob";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pattern to match obfuscated classes (starts with underscore, contains random chars)
// More specific pattern to avoid catching JavaScript keywords
const obfuscatedClassPattern = /class\s*=\s*["'][^"']*[A-Za-z0-9_]{8,}[^"']*["']/g;

async function findObfuscatedClasses() {
  console.log("🔍 Scanning project for obfuscated CSS classes...\n");

  // Get all source files
  const files = await glob("src/**/*.{astro,js,ts,jsx,tsx,vue,svelte}", {
    cwd: __dirname,
    ignore: ["**/node_modules/**", "**/dist/**"],
  });

  const classUsage = new Map();
  const totalFiles = files.length;
  let processedFiles = 0;

  console.log(`📁 Found ${totalFiles} files to scan\n`);

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(__dirname, file), "utf8");
      const matches = content.match(obfuscatedClassPattern);

      if (matches) {
        matches.forEach((match) => {
          // Extract the class name from the match
          const classMatch = match.match(/class\s*=\s*["']([^"']*)["']/);
          if (classMatch) {
            const classString = classMatch[1];
            // Split by spaces to get individual classes
            const classes = classString.split(/\s+/);
            classes.forEach((className) => {
              // Only consider classes that look obfuscated (8+ chars, mixed case/numbers)
              if (className.length >= 8 && /[A-Za-z0-9_]{8,}/.test(className)) {
                if (!classUsage.has(className)) {
                  classUsage.set(className, []);
                }
                classUsage.get(className).push(file);
              }
            });
          }
        });
      }

      processedFiles++;
      if (processedFiles % 10 === 0) {
        console.log(`⏳ Processed ${processedFiles}/${totalFiles} files...`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not read ${file}: ${error.message}`);
    }
  }

  console.log(`\n✅ Scan complete! Found ${classUsage.size} unique obfuscated classes\n`);

  // Sort by usage frequency
  const sortedClasses = Array.from(classUsage.entries()).sort((a, b) => b[1].length - a[1].length);

  console.log("📊 Most frequently used obfuscated classes:\n");

  sortedClasses.slice(0, 20).forEach(([className, files], index) => {
    console.log(`${index + 1}. ${className} (used in ${files.length} files)`);
    if (files.length <= 5) {
      console.log(`   Files: ${files.join(", ")}`);
    } else {
      console.log(`   Files: ${files.slice(0, 3).join(", ")} and ${files.length - 3} more...`);
    }
    console.log("");
  });

  // Generate replacement commands
  console.log("\n🛠️  Suggested replacement commands:\n");

  sortedClasses.slice(0, 10).forEach(([className, files]) => {
    console.log(`# Replace ${className} in ${files.length} files:`);
    console.log(`node class-mapper.js ${className}`);
    console.log("");
  });

  // Save results to file
  const results = {
    totalClasses: classUsage.size,
    totalFiles: totalFiles,
    classes: sortedClasses.map(([className, files]) => ({
      className,
      usageCount: files.length,
      files: files.slice(0, 10), // Limit to first 10 files
    })),
  };

  fs.writeFileSync(
    path.join(__dirname, "obfuscated-classes-report.json"),
    JSON.stringify(results, null, 2)
  );

  console.log("📄 Detailed report saved to: obfuscated-classes-report.json");
}

// Run the scan
findObfuscatedClasses().catch(console.error);
