import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log("Debug admin endpoint called");

    // Check environment variables
    const envCheck = {
      SUPABASE_URL: import.meta.env.SUPABASE_URL ? "Set" : "Missing",
      SUPABASE_SERVICE_ROLE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Missing",
      SUPABASE_ANON_KEY: import.meta.env.SUPABASE_ANON_KEY ? "Set" : "Missing",
      PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL ? "Set" : "Missing",
      PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing",
    };

    // Check if supabaseAdmin is configured
    const adminClientStatus = supabaseAdmin ? "Configured" : "Not configured";

    // Test admin client if available
    let adminTest = null;
    if (supabaseAdmin) {
      try {
        // Try a simple admin operation
        const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
        adminTest = {
          success: !error,
          error: error?.message || null,
          buckets: buckets?.length || 0
        };
      } catch (testError) {
        adminTest = {
          success: false,
          error: testError instanceof Error ? testError.message : "Unknown error",
          buckets: 0
        };
      }
    }

    // Check regular supabase client
    const { supabase } = await import("../../lib/supabase");
    const regularClientStatus = supabase ? "Configured" : "Not configured";

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      adminClient: {
        status: adminClientStatus,
        test: adminTest
      },
      regularClient: {
        status: regularClientStatus
      },
      recommendations: [
        "If SUPABASE_SERVICE_ROLE_KEY is missing, add it to Railway environment variables",
        "If admin client is not configured, check that both URL and service role key are set",
        "Service role key should start with 'eyJ' and be from Supabase Settings → API → service_role"
      ]
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Debug admin error:", error);
    return new Response(JSON.stringify({ 
      error: "Debug endpoint failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
