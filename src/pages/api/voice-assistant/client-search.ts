import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Search API for Voice Assistant
 * Searches for clients in the database by name, company name, or email
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const { query, limit = 10 } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Search query is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key (for voice assistant)
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SECRET ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.PUBLIC_SUPABASE_PUBLISHABLE;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [VOICE-ASSISTANT-CLIENT-SEARCH] Supabase not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("🔍 [VOICE-ASSISTANT-CLIENT-SEARCH] Searching for clients:", query);

    // Search for clients (role = 'Client')
    const searchQuery = supabase
      .from("profiles")
      .select("id, firstName, lastName, companyName, email, phone, role")
      .eq("role", "Client")
      .or(
        `firstName.ilike.%${query}%,lastName.ilike.%${query}%,companyName.ilike.%${query}%,email.ilike.%${query}%`
      )
      .limit(limit)
      .order("companyName", { ascending: true });

    const { data: clients, error } = await searchQuery;

    if (error) {
      console.error("❌ [VOICE-ASSISTANT-CLIENT-SEARCH] Error searching clients:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to search clients",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [VOICE-ASSISTANT-CLIENT-SEARCH] Found ${clients?.length || 0} clients`);

    // Format results for easier use
    const formattedClients = (clients || []).map((client) => ({
      id: client.id,
      name:
        client.companyName ||
        `${client.firstName || ""} ${client.lastName || ""}`.trim() ||
        "Unknown",
      firstName: client.firstName,
      lastName: client.lastName,
      companyName: client.companyName,
      email: client.email,
      phone: client.phone,
      displayName: client.companyName
        ? `${client.companyName}${client.firstName ? ` (${client.firstName} ${client.lastName})` : ""}`
        : `${client.firstName || ""} ${client.lastName || ""}`.trim(),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        clients: formattedClients,
        count: formattedClients.length,
        query,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [VOICE-ASSISTANT-CLIENT-SEARCH] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
