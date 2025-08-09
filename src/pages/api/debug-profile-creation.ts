import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("Debug profile creation API called");

    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Current user:", {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata,
      rawMetadata: user.raw_user_meta_data,
    });

    // Check if profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log("Existing profile check:", { existingProfile, profileCheckError });

    if (existingProfile) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Profile already exists",
          profile: existingProfile,
          user: {
            id: user.id,
            email: user.email,
            metadata: user.user_metadata,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Try to create profile manually
    const profileName = 
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.raw_user_meta_data?.name ||
      user.raw_user_meta_data?.full_name ||
      user.email ||
      "User";

    console.log("Attempting to create profile with name:", profileName);

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        name: profileName,
        role: "Client",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating profile:", createError);
      return new Response(
        JSON.stringify({
          error: "Failed to create profile",
          details: createError.message,
          user: {
            id: user.id,
            email: user.email,
            metadata: user.user_metadata,
          },
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
        message: "Profile created successfully",
        profile: newProfile,
        user: {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  } catch (error) {
    console.error("Error in debug profile creation:", error);
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
