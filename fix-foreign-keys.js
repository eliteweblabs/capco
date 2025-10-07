const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

// Load environment variables
require("dotenv").config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixForeignKeys() {
  try {
    console.log("🔧 Fixing discussion -> projects foreign key relationship...");

    // Read the SQL file
    const sql = fs.readFileSync("./sql-queriers/fix-discussion-projects-relationship.sql", "utf8");

    // Execute the SQL
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      console.error("Error executing SQL:", error);
      return;
    }

    console.log("✅ Foreign key relationship fixed successfully!");
    console.log("📊 Result:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

fixForeignKeys();
