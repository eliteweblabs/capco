#!/usr/bin/env node

/**
 * Database Field Checker
 * Scans the codebase for potential camelCase/snake_case mismatches
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common database field patterns to check
const DATABASE_PATTERNS = [
  // User/Profile fields
  { camelCase: "firstName", snakeCase: "first_name" },
  { camelCase: "lastName", snakeCase: "last_name" },
  { camelCase: "companyName", snakeCase: "company_name" },
  { camelCase: "mobileCarrier", snakeCase: "mobile_carrier" },
  { camelCase: "smsAlerts", snakeCase: "sms_alerts" },
  { camelCase: "createdAt", snakeCase: "created_at" },
  { camelCase: "updatedAt", snakeCase: "updated_at" },

  // Project fields
  { camelCase: "projectTitle", snakeCase: "title" },
  { camelCase: "projectAddress", snakeCase: "address" },
  { camelCase: "squareFootage", snakeCase: "sq_ft" },
  { camelCase: "newConstruction", snakeCase: "new_construction" },
  { camelCase: "authorId", snakeCase: "author_id" },

  // File fields
  { camelCase: "fileName", snakeCase: "file_name" },
  { camelCase: "fileType", snakeCase: "file_type" },
  { camelCase: "fileSize", snakeCase: "file_size" },
  { camelCase: "filePath", snakeCase: "file_path" },
  { camelCase: "uploadedAt", snakeCase: "uploaded_at" },
];

// Files to scan
const SCAN_PATHS = ["src/pages/api", "src/lib", "src/components", "src/pages"];

// File extensions to check
const FILE_EXTENSIONS = [".ts", ".js", ".astro"];

function scanDirectory(dir) {
  const results = [];

  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        results.push(...scanDirectory(fullPath));
      } else if (FILE_EXTENSIONS.some((ext) => file.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dir}:`, error.message);
  }

  return results;
}

function checkFile(filePath) {
  const issues = [];

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for potential mismatches
      for (const pattern of DATABASE_PATTERNS) {
        // Look for camelCase in database operations
        if (
          line.includes(`.${pattern.camelCase}`) &&
          (line.includes(".from(") ||
            line.includes(".insert(") ||
            line.includes(".update(") ||
            line.includes(".upsert("))
        ) {
          issues.push({
            file: filePath,
            line: lineNumber,
            type: "camelCase in database operation",
            message: `Found ${pattern.camelCase} in database operation, should be ${pattern.snakeCase}`,
            code: line.trim(),
            suggestion: line.replace(pattern.camelCase, pattern.snakeCase),
          });
        }

        // Look for snake_case in application code
        if (
          line.includes(`.${pattern.snakeCase}`) &&
          !line.includes(".from(") &&
          !line.includes(".insert(") &&
          !line.includes(".update(") &&
          !line.includes(".upsert(")
        ) {
          issues.push({
            file: filePath,
            line: lineNumber,
            type: "snake_case in application code",
            message: `Found ${pattern.snakeCase} in application code, should be ${pattern.camelCase}`,
            code: line.trim(),
            suggestion: line.replace(pattern.snakeCase, pattern.camelCase),
          });
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error.message);
  }

  return issues;
}

function main() {
  console.log("🔍 Scanning codebase for database field mismatches...\n");

  const allFiles = [];
  for (const scanPath of SCAN_PATHS) {
    if (fs.existsSync(scanPath)) {
      allFiles.push(...scanDirectory(scanPath));
    }
  }

  console.log(`Found ${allFiles.length} files to scan\n`);

  const allIssues = [];

  for (const file of allFiles) {
    const issues = checkFile(file);
    allIssues.push(...issues);
  }

  if (allIssues.length === 0) {
    console.log("✅ No database field mismatches found!");
    return;
  }

  console.log(`❌ Found ${allIssues.length} potential issues:\n`);

  // Group issues by file
  const issuesByFile = {};
  for (const issue of allIssues) {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  }

  for (const [file, issues] of Object.entries(issuesByFile)) {
    console.log(`📁 ${file}`);
    console.log("─".repeat(80));

    for (const issue of issues) {
      console.log(`  Line ${issue.line}: ${issue.type}`);
      console.log(`  ${issue.message}`);
      console.log(`  Current: ${issue.code}`);
      console.log(`  Suggested: ${issue.suggestion}`);
      console.log("");
    }
    console.log("");
  }

  console.log("💡 Tips:");
  console.log("  - Use the database-field-mapper.ts utility for consistent conversions");
  console.log("  - Database operations should use snake_case");
  console.log("  - Application code should use camelCase");
  console.log("  - Use toDatabaseFields() before database operations");
  console.log("  - Use fromDatabaseFields() after database queries");
}

// Run the main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkFile, main, scanDirectory };
