import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    const { currentUser } = await checkAuth(cookies);
    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get query parameters
    const type = url.searchParams.get("type"); // 'punchlist' or 'discussion'
    const includeDisabled = url.searchParams.get("includeDisabled") === "true";

    // Build query
    let query = supabaseAdmin
      .from("projectItemTemplates")
      .select("*")
      .order("orderIndex", { ascending: true });

    // Filter by type if specified
    if (type) {
      query = query.eq("type", type);
    }

    // Filter by enabled status unless includeDisabled is true
    if (!includeDisabled) {
      query = query.eq("enabled", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[project-templates] Error fetching templates:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch templates" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, templates: data || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[project-templates] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
