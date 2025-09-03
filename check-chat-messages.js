import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkChatMessages() {
  try {
    console.log("🔍 Checking chat_messages table...");

    // Check if table exists and has any messages
    const {
      data: messages,
      error,
      count,
    } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact" })
      .order("timestamp", { ascending: false })
      .limit(10);

    if (error) {
      console.error("❌ Error querying chat_messages:", error);
      return;
    }

    console.log(`✅ Found ${count || 0} messages in chat_messages table`);

    if (messages && messages.length > 0) {
      console.log("\n📝 Recent messages:");
      messages.forEach((msg, index) => {
        console.log(
          `${index + 1}. [${msg.timestamp}] ${msg.user_name} (${msg.user_role}): ${msg.message}`
        );
      });
    } else {
      console.log("📝 No messages found in the table");
    }

    // Check table structure
    console.log("\n🔍 Checking table structure...");
    const { data: tableInfo, error: tableError } = await supabase
      .from("chat_messages")
      .select("id, user_id, user_name, user_role, message, timestamp")
      .limit(1);

    if (tableError) {
      console.error("❌ Error checking table structure:", tableError);
    } else {
      console.log("✅ Table structure looks good");
    }
  } catch (error) {
    console.error("❌ Error checking chat messages:", error);
  }
}

checkChatMessages();
