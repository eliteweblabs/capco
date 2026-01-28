import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { checkAuth } from "../../../lib/auth";

// CORS headers for all responses
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

// Handle OPTIONS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ success: false, error: "Not authenticated" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const body = await request.json();
    const { projectIds } = body; // Array of project IDs to refresh

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Project IDs required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ success: false, error: "Database not available" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Fetch updated project data
    const { data: projects, error } = await supabase
      .from("projects")
      .select("id, updatedAt, status, dueDate, assignedToId, punchlistComplete, punchlistCount")
      .in("id", projectIds);

    if (error) {
      console.error("Error fetching projects:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch projects",
          details: error.message,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Return projects as-is (no transformation needed)
    return new Response(
      JSON.stringify({
        success: true,
        projects: projects || [],
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error in refresh endpoint:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};
