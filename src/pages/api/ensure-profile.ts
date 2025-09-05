import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, user } = await checkAuth(cookies);

    if (!isAuth || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id, company_name, email, role")
      .eq("id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error checking profile:", checkError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to check profile",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (existingProfile) {
      console.log("🔔 [PROFILE] Profile already exists:", existingProfile);
      return new Response(
        JSON.stringify({
          success: true,
          profile: existingProfile,
          message: "Profile already exists",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create profile if it doesn't exist
    console.log("🔔 [PROFILE] Creating profile for user:", user.id);

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        company_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Unknown User",
        email: user.email,
        role: "Admin", // Default to Admin for now
      })
      .select("id, company_name, email, role")
      .single();

    if (createError) {
      console.error("Error creating profile:", createError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create profile",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔔 [PROFILE] Profile created:", newProfile);

    return new Response(
      JSON.stringify({
        success: true,
        profile: newProfile,
        message: "Profile created successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Ensure profile error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to ensure profile",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
