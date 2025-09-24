import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User ID is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("👤 [GET-USER-PROFILE] Fetching profile for user:", userId);

    // Get user profile from Supabase
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
      });
    }
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, company_name, email, phone, role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("👤 [GET-USER-PROFILE] Error fetching profile:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch user profile",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User profile not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("👤 [GET-USER-PROFILE] Profile fetched successfully:", {
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      company: profile.company_name,
      email: profile.email,
    });

    return new Response(
      JSON.stringify({
        success: true,
        profile: profile,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("👤 [GET-USER-PROFILE] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
