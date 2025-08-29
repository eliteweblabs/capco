import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set up session from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get files from database
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "active");

    if (filesError) {
      return new Response(JSON.stringify({ 
        error: "Failed to fetch files",
        details: filesError.message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      projectId,
      files: files || [],
      fileCount: files?.length || 0
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Debug files API error:", error);
    return new Response(JSON.stringify({
      error: "Debug failed",
      details: (error as Error).message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
