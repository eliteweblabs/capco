import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const role = url.searchParams.get("role") || "Client";
    const clientId = url.searchParams.get("id");
    const searchQuery = url.searchParams.get("input");

    console.log(
      `📡 [API] Fetching clients with role: ${role}${clientId ? `, specific ID: ${clientId}` : ""}${searchQuery ? `, search: ${searchQuery}` : ""}`
    );

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let query = supabase
      .from("profiles")
      .select("id, first_name, last_name, company_name, email, role")
      .eq("role", role);

    // If a specific client ID is provided, filter by that ID
    if (clientId) {
      query = query.eq("id", clientId);
    } else {
      // If a search query is provided, filter by company name, first name, last name, or email
      if (searchQuery) {
        query = query.or(
          `company_name.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
        );
      }
      // Only order by company_name if we're fetching all clients
      query = query.order("company_name", { ascending: true });
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error("❌ [API] Error fetching clients:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch clients",
          details: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log(`✅ [API] Found ${profiles?.length || 0} clients`);

    // Return the raw profile data
    const clients = profiles || [];

    return new Response(
      JSON.stringify({
        success: true,
        clients: clients,
        count: clients.length,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ [API] Unexpected error in clients endpoint:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
