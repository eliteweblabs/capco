import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  if (!supabase) {
    return new Response(
      JSON.stringify({
        error: "Supabase not configured",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Get current user from session
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({
          error: "Not authenticated",
          details: authError?.message,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const user = authData.user;
    console.log("Creating profile for OAuth user:", user.id, user.email);

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Profile already exists",
          profile: existingProfile,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Extract name from OAuth metadata
    const name =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User";

    console.log("Creating profile with name:", name);

    // Create new profile for OAuth user
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        name: name,
        role: "Client",
      })
      .select()
      .single();

    if (createError) {
      console.error("Profile creation error:", createError);
      return new Response(
        JSON.stringify({
          error: "Failed to create profile",
          details: createError.message,
          code: createError.code,
          hint: createError.hint,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.log("Profile created successfully:", newProfile);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile created successfully for OAuth user",
        profile: newProfile,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Unexpected error creating OAuth profile:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
