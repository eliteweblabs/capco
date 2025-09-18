import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
console.log("🚧 [DEAD-STOP-2024-12-19] get-project-statuses.ts accessed - may be unused");

export const GET: APIRoute = async ({ request }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch project statuses directly from database
    const { data: statusesData, error: statusesError } = await supabaseAdmin
      .from("project_statuses")
      .select(
        "status_code, admin_status_name, project_action, client_status_name, client_status_tab, admin_status_tab, status_color"
      )
      .neq("status_code", 0)
      .order("status_code");

    if (statusesError) {
      console.error("🏗️ [API] Statuses database error:", statusesError);
      return new Response(JSON.stringify({ error: "Failed to fetch statuses" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert array to object for easier lookup
    const statusLabels = (statusesData || []).reduce((acc: any, status: any) => {
      acc[status.status_code] = status;
      return acc;
    }, {});

    // Return both array and object formats
    return new Response(
      JSON.stringify({
        statuses: statusesData || [],
        statusLabels,
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("🏗️ [API] Error fetching statuses:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
