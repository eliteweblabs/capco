import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async () => {
  try {
    // Get a sample project to see what columns exist
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch project schema",
          details: error.message,
          code: error.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        projectColumns: Object.keys(project || {}),
        sampleProject: project,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Get project schema error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
