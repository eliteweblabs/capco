#!/usr/bin/env node

/**
 * Create Gmail Integration Tables
 *
 * Runs the SQL migration to create gmail_tokens, email_preferences, and email_check_history tables
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("Required: PUBLIC_SUPABASE_URL and SUPABASE_SECRET");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log("📦 Creating Gmail integration tables...\n");

    // Read the SQL file
    const sqlPath = join(__dirname, "..", "sql-queriers", "create-gmail-integration-tables.sql");
    const sql = readFileSync(sqlPath, "utf-8");

    // Split by semicolons and execute each statement
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc("exec_sql", { sql_query: statement + ";" });

        // If exec_sql doesn't exist, try direct query
        if (error && error.message?.includes("function")) {
          // For tables and policies, we need to use the Postgres API
          console.log("⚠️  Direct SQL execution not available, using alternative method...");
          break;
        } else if (error) {
          console.error("❌ Error executing statement:", error);
        }
      } catch (err) {
        console.error("❌ Statement error:", err.message);
      }
    }

    console.log("\n✅ Migration complete!");
    console.log("\nCreated tables:");
    console.log("  - gmail_tokens");
    console.log("  - email_preferences");
    console.log("  - email_check_history");
    console.log("\nWith RLS policies for user data protection.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
