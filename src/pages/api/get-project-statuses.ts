import type { APIRoute } from "astro";
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

    // Fetch all project statuses from database (excluding status 0)
    const { data: statuses, error } = await supabase
      .from("project_statuses")
      .select(
        "status_code, status_name, email_content, est_time, notify, els_to_show, trigger, display_in_nav, client_visible"
      )
      .neq("status_code", 0)
      .order("status_code");

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

    // Filter statuses based on user role FIRST, then convert to object
    const filteredStatuses = statuses.filter((status) => {
      // Admin and Staff can see all statuses
      if (userRole === "Admin" || userRole === "Staff") {
        return true;
      }
      
      // For clients, only show statuses that are client_visible
      if (userRole === "Client") {
        return status.client_visible !== undefined ? status.client_visible : true; // Default to true for backward compatibility
      }
      
      // For other roles, show all by default (backward compatibility)
      return true;
    });

    // Convert filtered array to object with status_code as key
    const statusesObject = filteredStatuses.reduce(
      (acc, status) => {
        acc[status.status_code] = {
          status_name: status.status_name,
          status_code: status.status_code,
          email_content: status.email_content,
          est_time: status.est_time,
          notify: status.notify || ["admin"],
          els_to_show: status.els_to_show || [],
          trigger: status.trigger || [],
          display_in_nav: status.display_in_nav || false,
          client_visible: status.client_visible !== undefined ? status.client_visible : true, // Default to true
        };
        return acc;
      },
      {} as Record<
        number,
        {
          status_name: string;
          status_code: number;
          email_content: string;
          est_time: string;
          notify: string[];
          els_to_show: string[];
          trigger: string[];
          display_in_nav: boolean;
          client_visible: boolean;
        }
      >
    );

    return new Response(
      JSON.stringify({
        success: true,
        statuses: statusesObject,
        count: filteredStatuses.length,
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
