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
        "status_code, status_name, client_visible, admin_visible, notify, email_content, button_text, button_link, est_time, project_action"
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

    // Convert array to object with status_code as key (no filtering - return all statuses)
    const statusesObject = statuses.reduce(
      (acc, status) => {
        acc[status.status_code] = {
          status_name: status.status_name,
          status_code: status.status_code,
          admin_visible: status.admin_visible,
          client_visible: status.client_visible,
          notify: status.notify,
          email_content: status.email_content,
          button_text: status.button_text,
          button_link: status.button_link,
          est_time: status.est_time,
          project_action: status.project_action,
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
          notify: any;
          email_content: any;
          button_text: any;
          button_link: any;
          est_time: any;
          project_action: any;
        }
      >
    );

    return new Response(
      JSON.stringify({
        success: true,
        statuses: statusesObject,
        count: statuses.length,
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
