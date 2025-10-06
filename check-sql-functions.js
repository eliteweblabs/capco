#!/usr/bin/env node

/**
 * SQL Functions Checker
 * Scans for SQL functions, triggers, and database operations that use snake_case fields
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQL patterns to check for
const SQL_PATTERNS = [
  // Common SQL operations
  { pattern: /\.from\(["']([^"']+)["']\)/g, type: "table_reference" },
  { pattern: /\.select\(["']([^"']+)["']\)/g, type: "column_selection" },
  { pattern: /\.eq\(["']([^"']+)["']/g, type: "where_condition" },
  { pattern: /\.insert\(/g, type: "insert_operation" },
  { pattern: /\.update\(/g, type: "update_operation" },
  { pattern: /\.upsert\(/g, type: "upsert_operation" },
  { pattern: /\.delete\(/g, type: "delete_operation" },

  // SQL function patterns
  { pattern: /CREATE\s+FUNCTION\s+(\w+)/gi, type: "function_definition" },
  { pattern: /CREATE\s+TRIGGER\s+(\w+)/gi, type: "trigger_definition" },
  { pattern: /CREATE\s+OR\s+REPLACE\s+FUNCTION/gi, type: "function_definition" },

  // Field references in SQL
  {
    pattern:
      /\b(first_name|last_name|company_name|author_id|sq_ft|new_construction|file_name|file_path|file_type|file_size|uploaded_at|created_at|updated_at|mobile_carrier|sms_alerts)\b/g,
    type: "snake_case_field",
  },
];

// Files to scan for SQL
const SQL_SCAN_PATHS = [
  "src/pages/api",
  "src/lib",
  "supabase", // If you have SQL files in supabase folder
  "sql", // If you have SQL files in sql folder
];

const FILE_EXTENSIONS = [".ts", ".js", ".astro", ".sql"];

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

function checkFileForSQL(filePath) {
  const issues = [];

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for SQL operations
      for (const sqlPattern of SQL_PATTERNS) {
        const matches = [...line.matchAll(sqlPattern.pattern)];

        for (const match of matches) {
          if (sqlPattern.type === "snake_case_field") {
            issues.push({
              file: filePath,
              line: lineNumber,
              type: "snake_case_in_sql",
              message: `Found snake_case field '${match[0]}' in SQL operation`,
              code: line.trim(),
              field: match[0],
              suggestion: `Consider if this field needs to be updated in your database schema`,
            });
          } else {
            issues.push({
              file: filePath,
              line: lineNumber,
              type: sqlPattern.type,
              message: `Found ${sqlPattern.type}: ${match[0] || "operation"}`,
              code: line.trim(),
              operation: match[0] || "operation",
            });
          }
        }
      }

      // Check for specific Supabase operations that might need attention
      if (line.includes(".from(") || line.includes(".select(") || line.includes(".eq(")) {
        // Look for potential field mismatches in database operations
        const snakeCaseFields = line.match(
          /\b(first_name|last_name|company_name|author_id|sq_ft|new_construction|file_name|file_path|file_type|file_size|uploaded_at|created_at|updated_at|mobile_carrier|sms_alerts)\b/g
        );

        if (snakeCaseFields) {
          issues.push({
            file: filePath,
            line: lineNumber,
            type: "database_operation_with_snake_case",
            message: `Database operation contains snake_case fields: ${snakeCaseFields.join(", ")}`,
            code: line.trim(),
            fields: snakeCaseFields,
            suggestion: "Verify these fields exist in your database schema",
          });
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error.message);
  }

  return issues;
}

function generateSQLReport(issues) {
  console.log("\n📊 SQL FUNCTIONS REPORT");
  console.log("=".repeat(60));

  const totalIssues = issues.length;
  const filesWithIssues = [...new Set(issues.map((i) => i.file))].length;

  console.log(`Total SQL-related issues: ${totalIssues}`);
  console.log(`Files with SQL issues: ${filesWithIssues}`);

  // Group by issue type
  const issuesByType = {};
  issues.forEach((issue) => {
    if (!issuesByType[issue.type]) {
      issuesByType[issue.type] = [];
    }
    issuesByType[issue.type].push(issue);
  });

  console.log("\nIssue types:");
  Object.entries(issuesByType).forEach(([type, typeIssues]) => {
    console.log(`  ${type}: ${typeIssues.length} occurrences`);
  });

  // Group by field
  const fieldIssues = {};
  issues.forEach((issue) => {
    if (issue.fields) {
      issue.fields.forEach((field) => {
        if (!fieldIssues[field]) {
          fieldIssues[field] = 0;
        }
        fieldIssues[field]++;
      });
    }
  });

  if (Object.keys(fieldIssues).length > 0) {
    console.log("\nSnake_case fields found in SQL operations:");
    Object.entries(fieldIssues)
      .sort(([, a], [, b]) => b - a)
      .forEach(([field, count]) => {
        console.log(`  ${field}: ${count} occurrences`);
      });
  }
}

function main() {
  console.log("🔍 SQL Functions and Database Operations Checker");
  console.log("=".repeat(60));

  const allFiles = [];
  for (const scanPath of SQL_SCAN_PATHS) {
    if (fs.existsSync(scanPath)) {
      allFiles.push(...scanDirectory(scanPath));
    }
  }

  console.log(`📁 Found ${allFiles.length} files to scan\n`);

  const allIssues = [];

  for (const file of allFiles) {
    const issues = checkFileForSQL(file);
    allIssues.push(...issues);
  }

  if (allIssues.length === 0) {
    console.log("✅ No SQL-related issues found!");
    return;
  }

  console.log(`❌ Found ${allIssues.length} SQL-related issues:\n`);

  // Group issues by file
  const issuesByFile = {};
  for (const issue of allIssues) {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  }

  for (const [file, fileIssues] of Object.entries(issuesByFile)) {
    console.log(`📁 ${file}`);
    console.log("─".repeat(80));

    for (const issue of fileIssues) {
      console.log(`  Line ${issue.line}: ${issue.type}`);
      console.log(`  ${issue.message}`);
      console.log(`  Code: ${issue.code}`);
      if (issue.suggestion) {
        console.log(`  💡 ${issue.suggestion}`);
      }
      console.log("");
    }
    console.log("");
  }

  generateSQLReport(allIssues);

  console.log("\n💡 SQL Functions Recommendations:");
  console.log("  1. Check your Supabase database schema for field names");
  console.log("  2. Update any SQL functions/triggers that reference old field names");
  console.log("  3. Verify RLS policies use correct field names");
  console.log("  4. Check stored procedures and database functions");
  console.log("  5. Update any raw SQL queries in your application");
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkFileForSQL, generateSQLReport, main, scanDirectory };
