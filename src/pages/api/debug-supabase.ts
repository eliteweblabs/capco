import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    // Check all Supabase environment variables
    const envCheck = {
      // Server-side (import.meta.env)
      SUPABASE_URL: !!import.meta.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!import.meta.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // Client-side (PUBLIC_ prefixed)
      PUBLIC_SUPABASE_URL: !!import.meta.env.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      
      // Values (masked for security)
      SUPABASE_URL_VALUE: import.meta.env.SUPABASE_URL ? 
        `${import.meta.env.SUPABASE_URL.substring(0, 20)}...` : "Not set",
      PUBLIC_SUPABASE_URL_VALUE: import.meta.env.PUBLIC_SUPABASE_URL ? 
        `${import.meta.env.PUBLIC_SUPABASE_URL.substring(0, 20)}...` : "Not set",
      
      // Environment info
      NODE_ENV: process.env.NODE_ENV || import.meta.env.NODE_ENV,
      BUILD_TIME: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        environment: envCheck,
        recommendations: {
          missing: Object.entries(envCheck)
            .filter(([key, value]) => !value && !key.includes("VALUE") && !key.includes("NODE_ENV") && !key.includes("BUILD_TIME"))
            .map(([key]) => key),
          next_steps: [
            "Set missing environment variables in Railway dashboard",
            "Ensure PUBLIC_ prefixed variables are set for client-side access",
            "Verify SUPABASE_SERVICE_ROLE_KEY is set for admin operations",
            "Redeploy after setting environment variables"
          ]
        }
      }, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in debug-supabase API:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error",
        message: (error as Error).message 
      }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
