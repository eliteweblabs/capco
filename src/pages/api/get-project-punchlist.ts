import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { currentUser, currentRole } = await checkAuth(cookies);
    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get projectId from query parameters
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // console.log(
    //   "🔍 [GET-PROJECT-PUNCHLIST] Fetching punchlist for project:",
    //   projectId,
    //   "User role:",
    //   currentRole
    // );

    // First, let's test if we can access the punchlist table at all
    // console.log("🔍 [GET-PROJECT-PUNCHLIST] Testing punchlist table access...");

    try {
      const testQuery = await supabase.from("punchlist").select("count", { count: "exact" });

      // console.log("🔍 [GET-PROJECT-PUNCHLIST] Table access test result:", testQuery);
    } catch (testError) {
      console.error("🔍 [GET-PROJECT-PUNCHLIST] Table access test failed:", testError);
    }

    // Build query based on user role - simplified to avoid foreign key issues
    let query = supabase
      .from("punchlist")
      .select("*")
      .eq("projectId", projectId)
      .order("createdAt", { ascending: true });

    // For clients, filter out internal items unless they are the author
    if (currentRole === "Client") {
      query = query.or(`internal.eq.false,authorId.eq.${currentUser.id}`);
    }

    const { data: punchlistData, error: punchlistError } = await query;

    if (punchlistError) {
      console.error("❌ [GET-PROJECT-PUNCHLIST] Database error:", punchlistError);

      // Check if it's a "table does not exist" error
      if (punchlistError.message.includes("does not exist") || punchlistError.code === "42P01") {
        return new Response(
          JSON.stringify({
            error: "Punchlist table does not exist",
            details:
              "Please run the SQL script: sql-queriers/create-punchlist-table.sql in your Supabase SQL Editor to create the punchlist table.",
            sql_file: "sql-queriers/create-punchlist-table.sql",
            migration_needed: true,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Failed to fetch punchlist items",
          details: punchlistError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Process the punchlist data to ensure proper structure
    const processedPunchlist = (punchlistData || []).map((item) => ({
      ...item,
      // Ensure companyName is available - it should be stored directly in the punchlist table
      companyName: item.companyName || "Unknown User",
    }));

    // console.log(
    //   "✅ [GET-PROJECT-PUNCHLIST] Retrieved",
    //   processedPunchlist.length,
    //   "punchlist items"
    // );

    return new Response(
      JSON.stringify({
        success: true,
        punchlist: processedPunchlist,
        count: processedPunchlist.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [GET-PROJECT-PUNCHLIST] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
