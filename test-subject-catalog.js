import { createClient } from "@supabase/supabase-js";

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

async function testSubjectCatalog() {
  try {
    console.log("🔍 Testing subject_catalog table...");

    // Try to query the table
    const { data, error } = await supabase.from("subject_catalog").select("*").limit(5);

    if (error) {
      console.error("❌ Error querying subject_catalog:", error);
      console.log("📝 This means the table does not exist or has permission issues");
      return;
    }

    console.log("✅ Table exists and is accessible");
    console.log("📊 Found", data.length, "subjects");
    console.log("📝 Sample data:", data);
  } catch (error) {
    console.error("❌ Error testing subject catalog:", error);
  }
}

testSubjectCatalog();
