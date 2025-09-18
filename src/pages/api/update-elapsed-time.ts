import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
      });
    }

    // Call the PostgreSQL function to update elapsed_time for all projects
    const { data, error } = await supabaseAdmin.rpc("update_project_elapsed_time");

    if (error) {
      console.error("Error updating elapsed time:", error);
      return new Response(JSON.stringify({ error: "Failed to update elapsed time" }), {
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Elapsed time updated successfully",
        data,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in update-elapsed-time API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};

// Also support GET for manual testing
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      message: "Use POST method to update elapsed time",
      endpoint: "/api/update-elapsed-time",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
