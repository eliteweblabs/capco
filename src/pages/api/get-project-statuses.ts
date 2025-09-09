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
    // console.log("🔍 [GET-PROJECT-STATUSES] Fetching statuses from database...");

    // Try with project_action, client_status_name, and client_status_tab first, fallback to without them if columns don't exist
    let { data: statuses, error } = await supabase
      .from("project_statuses")
      .select(
        "status_code, admin_status_name, project_action, client_status_name, client_status_tab"
      )
      .neq("status_code", 0)
      .order("status_code");

    // If project_action, client_status_name, or client_status_tab columns don't exist, try without them
    if (
      error &&
      (error.message.includes("project_action") ||
        error.message.includes("client_status_name") ||
        error.message.includes("client_status_tab"))
    ) {
      // console.log(
      //   "🔍 [GET-PROJECT-STATUSES] project_action, client_status_name, or client_status_tab column not found, trying without them..."
      // );
      // const fallbackResult = await supabase
      //   .from("project_statuses")
      //   .select("status_code, admin_status_name")
      //   .neq("status_code", 0)
      //   .order("status_code");
      // // Add project_action, client_status_name, and client_status_tab: null to each status for consistency
      // statuses =
      //   fallbackResult.data?.map((status) => ({
      //     ...status,
      //     project_action: null,
      //     client_status_name: null,
      //     client_status_tab: null,
      //   })) || null;
      // error = fallbackResult.error;
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

    // Helper function to get status color based on status code
    const getStatusColor = (statusCode: number): string => {
      if (statusCode <= 50) return "blue"; // Early stages
      if (statusCode <= 100) return "yellow"; // Invoice stages
      if (statusCode <= 140) return "purple"; // Submittals
      if (statusCode <= 180) return "orange"; // Final invoice
      if (statusCode <= 220) return "green"; // Deliverables and complete
      return "gray"; // Default fallback
    };

    // Convert array to object with status_code as key (no filtering - return all statuses)
    // console.log("🔍 [GET-PROJECT-STATUSES] Converting statuses to object...");
    const statusesObject = (statuses || []).reduce(
      (acc, status) => {
        const statusColor = getStatusColor(status.status_code);
        console.log(`🔍 [GET-PROJECT-STATUSES] Processing status ${status.status_code}:`, {
          admin_status_name: status.admin_status_name,
          project_action: status.project_action || null,
          client_status_name: status.client_status_name || null,
          client_status_tab: status.client_status_tab || null,
          status_color: statusColor,
        });
        acc[status.status_code] = {
          admin_status_name: status.admin_status_name,
          status_code: status.status_code,
          project_action: status.project_action || null,
          client_status_name: status.client_status_name || null,
          client_status_tab: status.client_status_tab || null,
          status_color: statusColor,
        };
        return acc;
      },
      {} as Record<
        number,
        {
          admin_status_name: string;
          status_code: number;
          project_action: string | null;
          client_status_name: string | null;
          client_status_tab: string | null;
          status_color: string;
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
