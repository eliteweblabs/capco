import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async () => {
  try {
    // Get all project statuses
    const { data: statuses, error } = await supabase
      .from("project_statuses")
      .select("*")
      .order("status_code");

    if (error) {
      console.error("Error fetching project statuses:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch project statuses" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        statuses,
        count: statuses?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Test project statuses API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}; 