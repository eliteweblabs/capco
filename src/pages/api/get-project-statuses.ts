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

    // Fetch all project statuses from database
    const { data: statuses, error } = await supabase
      .from("project_statuses")
      .select("status_code, status_name, email_content, est_time, notify")
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

    // Convert array to object with status_code as key
    const statusesObject = statuses.reduce(
      (acc, status) => {
        acc[status.status_code] = {
          status_name: status.status_name,
          status_code: status.status_code,
          email_content: status.email_content,
          est_time: status.est_time,
          notify: status.notify || ["admin"],
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
