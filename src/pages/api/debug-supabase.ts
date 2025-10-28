import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const GET: APIRoute = async () => {
  try {
    // Check environment variables
    const envCheck = {
      supabaseUrl: import.meta.env.SUPABASE_URL ? "present" : "missing",
      supabaseServiceRoleKey: import.meta.env.SUPABASE_SERVICE_ROLE_KEY ? "present" : "missing",
      supabaseAdminClient: supabaseAdmin ? "initialized" : "null",
      timestamp: new Date().toISOString(),
    };

    // If we have the admin client, test a simple query
    let testResult = null;
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from("profiles").select("count").limit(1);
        testResult = {
          success: !error,
          error: error?.message || null,
        };
      } catch (testError) {
        testResult = {
          success: false,
          error: testError instanceof Error ? testError.message : "Unknown error",
        };
      }
    }

    return new Response(
      JSON.stringify({
        environment: envCheck,
        testResult,
        deployment: {
          commit: "ee067d46", // The commit with our fix
          message: "Update environment variable definitions: Add SUPABASE_SERVICE_ROLE_KEY",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
