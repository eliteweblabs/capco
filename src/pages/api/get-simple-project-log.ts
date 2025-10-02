import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const projectId = parseInt(url.searchParams.get("projectId") || "0");

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Authentication and session setup
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set session for RLS policies
    const { data: session, error: sessionError } = await supabase!.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session.session?.user) {
      console.error("Session error:", sessionError);
      return new Response(
        JSON.stringify({
          error: "Invalid session",
          details: sessionError?.message || "No session data",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the project log directly with authenticated session
    const { data: project, error } = await supabase!
      .from("projects")
      .select("log")
      .eq("id", projectId)
      .single();

    if (error) {
      console.error("Error fetching project log:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch project log",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const log = project?.log || [];

    return new Response(
      JSON.stringify({
        success: true,
        log,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in get-simple-project-log:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
