import type { APIRoute } from "astro";
import { apiCache } from "../../lib/api-cache";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  try {
    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user role from headers
    const userRole = request.headers.get("role") || "Client";

    // Check for cache-busting parameter
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";

    // Define cache key for later use
    const cacheKey = `project-statuses-${userRole}`;

    // Check cache first (statuses don't change often) - unless force refresh
    if (!forceRefresh) {
      const cachedStatuses = apiCache.get(cacheKey);

      if (cachedStatuses) {
        return new Response(
          JSON.stringify({
            success: true,
            statuses: cachedStatuses,
            cached: true,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Fetch all project statuses from database (excluding status 0)
    console.log("🔍 [GET-PROJECT-STATUSES] Fetching statuses from database...");

    // Try with project_action first, fallback to without it if column doesn't exist
    let { data: statuses, error } = await supabase
      .from("project_statuses")
      .select("status_code, status_name, client_visible, admin_visible, project_action")
      .neq("status_code", 0)
      .order("status_code");

    // If project_action column doesn't exist, try without it
    if (error && error.message.includes("project_action")) {
      console.log(
        "🔍 [GET-PROJECT-STATUSES] project_action column not found, trying without it..."
      );
      const fallbackResult = await supabase
        .from("project_statuses")
        .select("status_code, status_name, client_visible, admin_visible")
        .neq("status_code", 0)
        .order("status_code");

      // Add project_action: null to each status for consistency
      statuses =
        fallbackResult.data?.map((status) => ({ ...status, project_action: null })) || null;
      error = fallbackResult.error;
    }

    console.log("🔍 [GET-PROJECT-STATUSES] Database response:", { statuses, error });

    if (error) {
      console.error("Error fetching project statuses:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Convert array to object with status_code as key (no filtering - return all statuses)
    console.log("🔍 [GET-PROJECT-STATUSES] Converting statuses to object...");
    const statusesObject = (statuses || []).reduce(
      (acc, status) => {
        console.log(`🔍 [GET-PROJECT-STATUSES] Processing status ${status.status_code}:`, {
          status_name: status.status_name,
          project_action: status.project_action || null,
        });
        acc[status.status_code] = {
          status_name: status.status_name,
          status_code: status.status_code,
          admin_visible: status.admin_visible,
          client_visible: status.client_visible,
          project_action: status.project_action || null,
        };
        return acc;
      },
      {} as Record<
        number,
        {
          status_name: string;
          status_code: number;
          client_visible: boolean;
          admin_visible: boolean;
          project_action: string | null;
        }
      >
    );

    console.log("🔍 [GET-PROJECT-STATUSES] Final statusesObject:", statusesObject);

    // Cache the result for 10 minutes (statuses rarely change)
    apiCache.set(cacheKey, statusesObject, 10);

    return new Response(
      JSON.stringify({
        success: true,
        statuses: statusesObject,
        count: statuses?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get project statuses error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch project statuses",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
