#!/usr/bin/env node

/**
 * Script to create the projectItemTemplates table in Supabase
 * This fixes the "Failed to Load Templates" error
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

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env file");
  console.error("   Required: PUBLIC_SUPABASE_URL and SUPABASE_SECRET");
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTemplatesTable() {
  try {
    console.log("🔧 Creating projectItemTemplates table...");

    // Read the SQL file
    const sqlFilePath = join(
      __dirname,
      "..",
      "sql-queriers",
      "create-project-item-templates-table.sql"
    );
    const sql = readFileSync(sqlFilePath, "utf-8");

    // Execute the SQL using the Supabase REST API
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      // Try alternative method: direct SQL execution via pg client
      console.log("⚠️  First method failed, trying direct execution...");

      // Split SQL into individual statements
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const statement of statements) {
        if (statement.toLowerCase().includes("select")) {
          // Skip SELECT statements for now
          continue;
        }

        console.log(`   Executing: ${statement.substring(0, 50)}...`);

        // Use the service role to execute raw SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ query: statement }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`   ❌ Error: ${errorText}`);
        }
      }

      console.log("\n✅ Table creation attempted via direct execution");
      console.log("📝 Please manually run the SQL file in Supabase dashboard:");
      console.log("   1. Go to https://qudlxlryegnainztkrtk.supabase.co/project/_/sql");
      console.log(
        "   2. Paste the contents of sql-queriers/create-project-item-templates-table.sql"
      );
      console.log('   3. Click "Run"');
      return;
    }

    console.log("✅ projectItemTemplates table created successfully!");
    console.log("   Templates have been populated with default data.");
  } catch (error) {
    console.error("❌ Error creating templates table:", error.message);
    console.log("\n📝 Manual setup required:");
    console.log("   1. Go to https://qudlxlryegnainztkrtk.supabase.co/project/_/sql");
    console.log("   2. Open: sql-queriers/create-project-item-templates-table.sql");
    console.log("   3. Copy and paste the SQL into the Supabase SQL editor");
    console.log('   4. Click "Run" to execute');
    process.exit(1);
  }
}

// Run the script
createTemplatesTable();
