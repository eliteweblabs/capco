import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials from environment
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Missing Supabase credentials. Please set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSubjectCatalog() {
  try {
    console.log("🔧 Setting up subject_catalog table...");

    // Read the SQL file
    const sqlPath = join(__dirname, "sql-queriers", "setup-subject-catalog.sql");
    const sql = readFileSync(sqlPath, "utf8");

    // Split SQL into individual statements
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

        const { error } = await supabase.rpc("exec_sql", { sql: statement });

        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }

    console.log("🎉 Subject catalog setup completed!");
  } catch (error) {
    console.error("❌ Error setting up subject catalog:", error);
    process.exit(1);
  }
}

setupSubjectCatalog();
