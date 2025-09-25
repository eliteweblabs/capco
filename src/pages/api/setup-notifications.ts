import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabaseAdmin } from "../../lib/supabase-admin";

// API endpoint to set up notifications table
export const POST: APIRoute = async ({ cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    if (currentUser.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if notifications table exists
    const { data: tableExists, error: checkError } = await supabaseAdmin
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "notifications")
      .eq("table_schema", "public");

    if (checkError) {
      console.error("❌ [NOTIFICATIONS-SETUP] Error checking table existence:", checkError);
      return new Response(JSON.stringify({ error: "Failed to check table existence" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (tableExists && tableExists.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Notifications table already exists",
          tableExists: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Table doesn't exist, provide instructions
    return new Response(
      JSON.stringify({
        success: false,
        message: "Notifications table does not exist. Please run the SQL migration script.",
        instructions: [
          "1. Go to your Supabase dashboard",
          "2. Navigate to SQL Editor",
          "3. Run the SQL script from: sql-queriers/create-notifications-table.sql",
          "4. Or run the script directly via psql if you have database access",
        ],
        tableExists: false,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [NOTIFICATIONS-SETUP] Error in setup:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
