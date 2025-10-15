#!/usr/bin/env node

/**
 * Script to fix common TypeScript errors automatically
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

// Common fixes for TypeScript errors
const fixes = [
  // Fix null assertion issues
  {
    pattern: /supabaseAdmin\./g,
    replacement: "supabaseAdmin!.",
    description: "Add null assertion to supabaseAdmin",
  },
  {
    pattern: /supabase\./g,
    replacement: "supabase!.",
    description: "Add null assertion to supabase",
  },
  // Fix undefined parameter issues
  {
    pattern: /filters\.offset/g,
    replacement: "filters.offset || 0",
    description: "Add default value for offset",
  },
  {
    pattern: /filters\.limit/g,
    replacement: "filters.limit || 20",
    description: "Add default value for limit",
  },
  // Fix unknown error types
  {
    pattern: /catch \(error\)/g,
    replacement: "catch (error: any)",
    description: "Add type annotation to error",
  },
];

// Files to process
const filesToProcess = [
  "src/pages/api/appointments/availability.ts",
  "src/pages/api/appointments/upsert.ts",
  "src/pages/api/cal-webhook.ts",
  "src/pages/api/cal/webhook.ts",
  "src/pages/api/cal/webhook-simple.ts",
  "src/pages/api/discussions/get.ts",
  "src/pages/api/files/get.ts",
  "src/pages/api/global/activity-feed.ts",
  "src/pages/api/global/analytics.ts",
  "src/pages/api/payments.ts",
  "src/pages/api/users/get.ts",
  "src/pages/api/vapi/appointments.ts",
  "src/pages/api/webhook/cal.ts",
  "src/pages/api/webhook/n8n-response.ts",
  "src/pages/api/webhook/twilio-get-old.ts",
];

function fixFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, "utf8");
  let modified = false;

  fixes.forEach((fix) => {
    const newContent = content.replace(fix.pattern, fix.replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
      console.log(`✅ Applied fix: ${fix.description} in ${filePath}`);
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`📝 Updated: ${filePath}`);
    return true;
  }

  return false;
}

function main() {
  console.log("🔧 Fixing TypeScript errors...\n");

  let fixedCount = 0;

  filesToProcess.forEach((filePath) => {
    if (fixFile(filePath)) {
      fixedCount++;
    }
  });

  console.log(`\n✅ Fixed ${fixedCount} files`);
  console.log("🎉 TypeScript error fixes complete!");
}

main();
