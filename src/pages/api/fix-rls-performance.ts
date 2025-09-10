import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async () => {
  // console.log("🔧 [RLS-FIX] Attempting to fix project_statuses RLS performance...");

  try {
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({
          error: "Admin client not available",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Disable RLS on project_statuses table
    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      sql: "ALTER TABLE project_statuses DISABLE ROW LEVEL SECURITY;",
    });

    if (error) {
      console.error("🔧 [RLS-FIX] Failed to disable RLS:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to disable RLS",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // console.log("🔧 [RLS-FIX] RLS disabled successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Project statuses RLS disabled - performance issue resolved!",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("🔧 [RLS-FIX] RLS fix failed:", error);
    return new Response(
      JSON.stringify({
        error: "RLS fix failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
