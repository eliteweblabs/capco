import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async () => {
  try {
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Database not available" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: statuses, error } = await supabase
      .from("project_statuses")
      .select("status_code, status_name, email_content, est_time, notify")
      .order("status_code");

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch statuses" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert to the format expected by the client
    const statusesMap = (statuses || []).reduce((acc, status) => {
      acc[status.status_code] = {
        status_name: status.status_name,
        email_content: status.email_content,
        est_time: status.est_time,
        notify: status.notify || ["admin"],
      };
      return acc;
    }, {} as Record<number, any>);

    return new Response(
      JSON.stringify({ statuses: statusesMap }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
