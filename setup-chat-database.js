import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables from .env file
dotenv.config();

// Read environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupChatDatabase() {
  try {
    console.log("🚀 Setting up chat messages table...");

    // Read the SQL file
    const sql = fs.readFileSync("setup-chat-messages-table.sql", "utf8");

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      console.error("❌ Error executing SQL:", error);

      // Try alternative approach - create table directly
      console.log("🔄 Trying alternative approach...");

      const { error: createError } = await supabase.from("chat_messages").select("id").limit(1);

      if (createError && createError.code === "42P01") {
        // Table doesn't exist, create it manually
        console.log("📋 Creating chat_messages table manually...");

        // Note: This is a simplified approach - you may need to run the SQL manually in Supabase dashboard
        console.log(
          "⚠️  Please run the SQL from setup-chat-messages-table.sql manually in your Supabase dashboard"
        );
        console.log("   or use the Supabase CLI to execute the SQL file");
      } else {
        console.log("✅ Table already exists or accessible");
      }
    } else {
      console.log("✅ Chat messages table setup completed successfully!");
    }
  } catch (error) {
    console.error("❌ Setup failed:", error);
    console.log("\n📋 Manual Setup Required:");
    console.log("1. Go to your Supabase dashboard");
    console.log("2. Navigate to SQL Editor");
    console.log("3. Copy and paste the contents of setup-chat-messages-table.sql");
    console.log("4. Execute the SQL");
  }
}

setupChatDatabase();
