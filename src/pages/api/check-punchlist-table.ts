import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { currentUser, currentRole } = await checkAuth(cookies);

    // Only allow admin/staff to check database schema
    if (!currentUser || !["Admin", "Staff"].includes(currentRole || "Client")) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Try to query the punchlist table to see if it exists
      const { data, error } = await supabase.from("punchlist").select("id").limit(1);

      if (error) {
        // Check if it's a "table does not exist" error
        if (error.message.includes("does not exist") || error.code === "42P01") {
          return new Response(
            JSON.stringify({
              success: false,
              table_exists: false,
              error: "Punchlist table does not exist",
              message: "Please run the SQL script: sql-queriers/create-punchlist-table.sql",
              sql_file: "sql-queriers/create-punchlist-table.sql",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Other database error
        throw error;
      }

      // Table exists
      return new Response(
        JSON.stringify({
          success: true,
          table_exists: true,
          message: "Punchlist table exists and is accessible",
          record_count: data ? data.length : 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (dbError: any) {
      console.error("Database punchlist table check error:", dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to check punchlist table",
          details: dbError.message,
          table_exists: false,
          migration_needed: true,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Check punchlist table error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
