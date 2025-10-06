#!/usr/bin/env node

/**
 * SQL Migration Helper
 * Generates SQL commands to update database schema and functions
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Field mappings for SQL migrations
const SQL_FIELD_MAPPINGS = [
  { snakeCase: "first_name", camelCase: "firstName", type: "TEXT" },
  { snakeCase: "last_name", camelCase: "lastName", type: "TEXT" },
  { snakeCase: "company_name", camelCase: "companyName", type: "TEXT" },
  { snakeCase: "mobile_carrier", camelCase: "mobileCarrier", type: "TEXT" },
  { snakeCase: "sms_alerts", camelCase: "smsAlerts", type: "BOOLEAN" },
  { snakeCase: "created_at", camelCase: "createdAt", type: "TIMESTAMP" },
  { snakeCase: "updated_at", camelCase: "updatedAt", type: "TIMESTAMP" },
  { snakeCase: "author_id", camelCase: "authorId", type: "UUID" },
  { snakeCase: "sq_ft", camelCase: "squareFootage", type: "INTEGER" },
  { snakeCase: "new_construction", camelCase: "newConstruction", type: "BOOLEAN" },
  { snakeCase: "file_name", camelCase: "fileName", type: "TEXT" },
  { snakeCase: "file_path", camelCase: "filePath", type: "TEXT" },
  { snakeCase: "file_type", camelCase: "fileType", type: "TEXT" },
  { snakeCase: "file_size", camelCase: "fileSize", type: "INTEGER" },
  { snakeCase: "uploaded_at", camelCase: "uploadedAt", type: "TIMESTAMP" },

  // Additional straggler fields from your database schema
  { snakeCase: "featured_image_data", camelCase: "featuredImageData", type: "JSONB" },
  { snakeCase: "due_date", camelCase: "dueDate", type: "TIMESTAMPTZ" },
  { snakeCase: "punchlist_count", camelCase: "punchlistCount", type: "INT8" },
  { snakeCase: "nfpa_version", camelCase: "nfpaVersion", type: "TEXT" },
  { snakeCase: "exterior_beacon", camelCase: "exteriorBeacon", type: "TEXT" },
  { snakeCase: "site_access", camelCase: "siteAccess", type: "TEXT" },
  {
    snakeCase: "fire_sprinkler_installation",
    camelCase: "fireSprinklerInstallation",
    type: "TEXT",
  },
  { snakeCase: "hazardous_material", camelCase: "hazardousMaterial", type: "TEXT" },
  {
    snakeCase: "commencement_of_construction",
    camelCase: "commencementOfConstruction",
    type: "TEXT",
  },
  {
    snakeCase: "suppression_detection_systems",
    camelCase: "suppressionDetectionSystems",
    type: "TEXT",
  },
];

// Common tables that might need updates
const COMMON_TABLES = [
  "profiles",
  "projects",
  "files",
  "discussions",
  "punchlist_items",
  "notifications",
  "file_versions",
];

function generateColumnRenameSQL() {
  console.log("-- SQL Column Rename Commands");
  console.log("-- Run these commands in your Supabase SQL editor");
  console.log("-- WARNING: This will rename columns in your database!");
  console.log("");

  for (const table of COMMON_TABLES) {
    console.log(`-- Rename columns in ${table} table`);

    for (const mapping of SQL_FIELD_MAPPINGS) {
      console.log(
        `ALTER TABLE ${table} RENAME COLUMN ${mapping.snakeCase} TO ${mapping.camelCase};`
      );
    }
    console.log("");
  }
}

function generateFunctionUpdateSQL() {
  console.log("-- SQL Function Updates");
  console.log("-- Update any functions that reference old column names");
  console.log("");

  console.log("-- Example: Update a function that uses first_name");
  console.log("CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)");
  console.log("RETURNS TABLE(");
  console.log("  id UUID,");
  console.log("  firstName TEXT,");
  console.log("  lastName TEXT,");
  console.log("  companyName TEXT");
  console.log(") AS $$");
  console.log("BEGIN");
  console.log("  RETURN QUERY");
  console.log("  SELECT p.id, p.firstName, p.lastName, p.companyName");
  console.log("  FROM profiles p");
  console.log("  WHERE p.id = user_id;");
  console.log("END;");
  console.log("$$ LANGUAGE plpgsql;");
  console.log("");
}

function generateRLSPolicyUpdateSQL() {
  console.log("-- RLS Policy Updates");
  console.log("-- Update RLS policies that reference old column names");
  console.log("");

  console.log("-- Example: Update RLS policy for profiles");
  console.log('DROP POLICY IF EXISTS "Users can view own profile" ON profiles;');
  console.log('CREATE POLICY "Users can view own profile" ON profiles');
  console.log("  FOR SELECT USING (auth.uid() = id);");
  console.log("");

  console.log("-- Example: Update RLS policy for projects");
  console.log('DROP POLICY IF EXISTS "Users can view own projects" ON projects;');
  console.log('CREATE POLICY "Users can view own projects" ON projects');
  console.log("  FOR SELECT USING (auth.uid() = authorId);");
  console.log("");
}

function generateTriggerUpdateSQL() {
  console.log("-- Trigger Updates");
  console.log("-- Update any triggers that reference old column names");
  console.log("");

  console.log("-- Example: Update trigger for updated_at timestamp");
  console.log("CREATE OR REPLACE FUNCTION update_updated_at_column()");
  console.log("RETURNS TRIGGER AS $$");
  console.log("BEGIN");
  console.log("  NEW.updatedAt = NOW();");
  console.log("  RETURN NEW;");
  console.log("END;");
  console.log("$$ LANGUAGE plpgsql;");
  console.log("");

  console.log("-- Apply trigger to tables");
  for (const table of COMMON_TABLES) {
    console.log(`DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};`);
    console.log(`CREATE TRIGGER update_${table}_updated_at`);
    console.log(`  BEFORE UPDATE ON ${table}`);
    console.log(`  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`);
    console.log("");
  }
}

function generateIndexUpdateSQL() {
  console.log("-- Index Updates");
  console.log("-- Update indexes that reference old column names");
  console.log("");

  for (const table of COMMON_TABLES) {
    console.log(`-- Indexes for ${table} table`);

    // Common indexes
    if (table === "profiles") {
      console.log(`CREATE INDEX IF NOT EXISTS idx_${table}_email ON ${table}(email);`);
      console.log(`CREATE INDEX IF NOT EXISTS idx_${table}_role ON ${table}(role);`);
    }

    if (table === "projects") {
      console.log(`CREATE INDEX IF NOT EXISTS idx_${table}_authorId ON ${table}(authorId);`);
      console.log(`CREATE INDEX IF NOT EXISTS idx_${table}_status ON ${table}(status);`);
    }

    if (table === "files") {
      console.log(`CREATE INDEX IF NOT EXISTS idx_${table}_projectId ON ${table}(project_id);`);
      console.log(`CREATE INDEX IF NOT EXISTS idx_${table}_authorId ON ${table}(authorId);`);
    }

    console.log("");
  }
}

function generateMigrationScript() {
  console.log("-- Complete Migration Script");
  console.log("-- This script will rename all columns and update related objects");
  console.log("");

  console.log("BEGIN;");
  console.log("");

  // Add column rename commands
  generateColumnRenameSQL();

  // Add function updates
  generateFunctionUpdateSQL();

  // Add RLS policy updates
  generateRLSPolicyUpdateSQL();

  // Add trigger updates
  generateTriggerUpdateSQL();

  // Add index updates
  generateIndexUpdateSQL();

  console.log("COMMIT;");
  console.log("");
  console.log("-- Migration completed successfully!");
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("🗄️  SQL Migration Helper");
  console.log("=".repeat(50));

  switch (command) {
    case "columns":
      generateColumnRenameSQL();
      break;
    case "functions":
      generateFunctionUpdateSQL();
      break;
    case "policies":
      generateRLSPolicyUpdateSQL();
      break;
    case "triggers":
      generateTriggerUpdateSQL();
      break;
    case "indexes":
      generateIndexUpdateSQL();
      break;
    case "all":
    default:
      generateMigrationScript();
      break;
  }

  console.log("\n💡 Usage:");
  console.log("  node sql-migration-helper.js columns   - Generate column rename SQL");
  console.log("  node sql-migration-helper.js functions - Generate function update SQL");
  console.log("  node sql-migration-helper.js policies  - Generate RLS policy update SQL");
  console.log("  node sql-migration-helper.js triggers  - Generate trigger update SQL");
  console.log("  node sql-migration-helper.js indexes   - Generate index update SQL");
  console.log("  node sql-migration-helper.js all       - Generate complete migration script");
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  generateColumnRenameSQL,
  generateFunctionUpdateSQL,
  generateMigrationScript,
  generateRLSPolicyUpdateSQL,
  generateTriggerUpdateSQL,
};
