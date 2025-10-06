import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // console.log("👥 [GET-CLIENTS] Fetching all client profiles...");

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
      });
    }
    // Get all client profiles from Supabase
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, firstName, lastName, companyName, email, phone, role")
      .eq("role", "Client")
      // .order("companyName", { ascending: true, nullsLast: true })
      .order("companyName", { ascending: true })
      .order("firstName", { ascending: true });

    if (error) {
      console.error("👥 [GET-CLIENTS] Error fetching profiles:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch client profiles",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // console.log("👥 [GET-CLIENTS] Fetched profiles:", profiles?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        clients: profiles || [],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("👥 [GET-CLIENTS] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
