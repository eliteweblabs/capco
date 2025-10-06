#!/usr/bin/env node

/**
 * Automated Field Conversion Tool
 * Helps convert remaining snake_case to camelCase in a controlled way
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Field mappings - only the ones you haven't converted yet
const FIELD_CONVERSIONS = [
  // User/Profile fields
  { from: "first_name", to: "firstName" },
  { from: "last_name", to: "lastName" },
  { from: "company_name", to: "companyName" },
  { from: "mobile_carrier", to: "mobileCarrier" },
  { from: "sms_alerts", to: "smsAlerts" },
  { from: "created_at", to: "createdAt" },
  { from: "updated_at", to: "updatedAt" },

  // Project fields
  { from: "author_id", to: "authorId" },
  { from: "sq_ft", to: "squareFootage" },
  { from: "new_construction", to: "newConstruction" },

  // File fields
  { from: "file_name", to: "fileName" },
  { from: "file_path", to: "filePath" },
  { from: "file_type", to: "fileType" },
  { from: "file_size", to: "fileSize" },
  { from: "uploaded_at", to: "uploadedAt" },

  // Additional project fields from your schema
  { from: "featured_image_data", to: "featuredImageData" },
  { from: "due_date", to: "dueDate" },
  { from: "punchlist_count", to: "punchlistCount" },
  { from: "nfpa_version", to: "nfpaVersion" },
  { from: "exterior_beacon", to: "exteriorBeacon" },
  { from: "site_access", to: "siteAccess" },
  { from: "fire_sprinkler_installation", to: "fireSprinklerInstallation" },
  { from: "hazardous_material", to: "hazardousMaterial" },
  { from: "commencement_of_construction", to: "commencementOfConstruction" },
  { from: "suppression_detection_systems", to: "suppressionDetectionSystems" },

  // Project fields that are commonly used
  { from: "title", to: "projectTitle" },
  { from: "address", to: "projectAddress" },
];

// Files to process (exclude ones you've already converted)
const TARGET_PATHS = ["src/pages/api", "src/lib", "src/components", "src/pages"];

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

function convertFile(filePath, dryRun = true) {
  const changes = [];

  try {
    const content = fs.readFileSync(filePath, "utf8");
    let newContent = content;
    let hasChanges = false;

    // Apply each field conversion
    for (const conversion of FIELD_CONVERSIONS) {
      // Skip conversions that would break HTML tags, JavaScript APIs, template variables, or HTTP headers
      if (conversion.from === "title") {
        // Skip if file contains HTML title tags, JavaScript document.title, button.title, template variables, or HTTP headers
        if (
          content.includes("<title>") ||
          content.includes("</title>") ||
          content.includes("document.title") ||
          content.includes("button.title") ||
          content.includes('title="') ||
          content.includes("title:") ||
          content.includes("title,") ||
          content.includes('"title"') ||
          content.includes("'title'") ||
          content.includes("`title`") ||
          content.includes("{title}") ||
          content.includes("${title}") ||
          content.includes("title}") ||
          content.includes("{title") ||
          content.includes("x-") ||
          content.includes("headers.set") ||
          content.includes("headers.get")
        ) {
          continue;
        }
      }

      const regex = new RegExp(`\\b${conversion.from}\\b`, "g");
      const matches = content.match(regex);

      if (matches) {
        newContent = newContent.replace(regex, conversion.to);
        hasChanges = true;
        changes.push({
          from: conversion.from,
          to: conversion.to,
          count: matches.length,
        });
      }
    }

    if (hasChanges) {
      if (!dryRun) {
        // Create backup
        const backupPath = filePath + ".backup";
        fs.writeFileSync(backupPath, content);

        // Write converted content
        fs.writeFileSync(filePath, newContent);
        console.log(`✅ Converted: ${filePath}`);
      } else {
        console.log(`📝 Would convert: ${filePath}`);
      }

      return { filePath, changes, hasChanges };
    }

    return null;
  } catch (error) {
    console.warn(`Warning: Could not process file ${filePath}:`, error.message);
    return null;
  }
}

function generateReport(results) {
  const totalFiles = results.filter((r) => r).length;
  const totalChanges = results.reduce((sum, r) => sum + (r?.changes?.length || 0), 0);

  console.log("\n📊 CONVERSION REPORT");
  console.log("=".repeat(50));
  console.log(`Files to convert: ${totalFiles}`);
  console.log(`Total field changes: ${totalChanges}`);

  // Group by field type
  const fieldStats = {};
  results.forEach((result) => {
    if (result?.changes) {
      result.changes.forEach((change) => {
        if (!fieldStats[change.from]) {
          fieldStats[change.from] = 0;
        }
        fieldStats[change.from] += change.count;
      });
    }
  });

  console.log("\nField conversion summary:");
  Object.entries(fieldStats)
    .sort(([, a], [, b]) => b - a)
    .forEach(([field, count]) => {
      console.log(
        `  ${field} → ${FIELD_CONVERSIONS.find((f) => f.from === field)?.to}: ${count} occurrences`
      );
    });
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--apply");
  const specificFile = args.find((arg) => arg.startsWith("--file="))?.split("=")[1];

  console.log("🔄 Automated Field Conversion Tool");
  console.log("=".repeat(50));

  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No files will be modified");
    console.log("Use --apply to actually convert files");
  } else {
    console.log("⚠️  LIVE MODE - Files will be converted!");
    console.log("Backups will be created with .backup extension");
  }

  console.log("");

  let allFiles = [];

  if (specificFile) {
    if (fs.existsSync(specificFile)) {
      allFiles = [specificFile];
      console.log(`🎯 Processing specific file: ${specificFile}`);
    } else {
      console.error(`❌ File not found: ${specificFile}`);
      return;
    }
  } else {
    for (const scanPath of TARGET_PATHS) {
      if (fs.existsSync(scanPath)) {
        allFiles.push(...scanDirectory(scanPath));
      }
    }
    console.log(`📁 Found ${allFiles.length} files to scan`);
  }

  console.log("");

  const results = [];

  for (const file of allFiles) {
    const result = convertFile(file, dryRun);
    if (result) {
      results.push(result);

      if (dryRun) {
        console.log(
          `  Changes: ${result.changes.map((c) => `${c.from}→${c.to}(${c.count})`).join(", ")}`
        );
      }
    }
  }

  generateReport(results);

  if (dryRun && results.length > 0) {
    console.log("\n💡 To apply these changes, run:");
    console.log("   node automate-field-conversion.js --apply");
    console.log("\n💡 To convert a specific file:");
    console.log("   node automate-field-conversion.js --file=src/pages/api/example.ts --apply");
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { convertFile, generateReport, main, scanDirectory };
