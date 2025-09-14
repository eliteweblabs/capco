import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const GET: APIRoute = async ({ request }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch client profiles for dropdowns and forms
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, company_name, role")
      .eq("role", "Client")
      .order("company_name");

    if (profilesError) {
      console.error("👥 [API] Client profiles database error:", profilesError);
      return new Response(JSON.stringify({ error: "Failed to fetch client profiles" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        profiles: profiles || [],
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("👥 [API] Error fetching client profiles:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
