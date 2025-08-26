import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

    return new Response(
      JSON.stringify({
        success: true,
        environment: {
          supabaseUrl: supabaseUrl ? "Set" : "Not set",
          supabaseServiceKey: supabaseServiceKey ? "Set" : "Not set",
          supabaseAnonKey: supabaseAnonKey ? "Set" : "Not set",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in check-env API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
