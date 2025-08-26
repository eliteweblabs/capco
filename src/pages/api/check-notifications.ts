import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get project and its status
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, status")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("Error fetching project:", projectError);
      return new Response(JSON.stringify({ error: "Failed to fetch project" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get notification settings for the project's status
    const { data: statusData, error: statusError } = await supabase
      .from("project_statuses")
      .select("status_code, notify")
      .eq("status_code", project.status)
      .single();

    if (statusError) {
      console.error("Error fetching status notifications:", statusError);
      return new Response(JSON.stringify({ error: "Failed to fetch status notifications" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the notify array from JSONB (Supabase automatically converts JSONB to array)
    let notifyTargets: string[] = statusData.notify || ["admin"]; // Default to admin

    return new Response(
      JSON.stringify({
        success: true,
        projectId,
        status: project.status,
        notify: notifyTargets,
        shouldNotifyAdmin: notifyTargets.includes("admin"),
        shouldNotifyClient: notifyTargets.includes("client"),
        shouldNotifyStaff: notifyTargets.includes("staff"),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Check notifications API error:", error);
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
