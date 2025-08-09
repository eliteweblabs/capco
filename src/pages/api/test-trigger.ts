import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("Test trigger API called");

    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if trigger exists
    const { data: triggers, error: triggerError } = await supabase
      .from("information_schema.triggers")
      .select("*")
      .eq("trigger_name", "on_auth_user_created");

    console.log("Trigger check:", { triggers, triggerError });

    // Check if function exists
    const { data: functions, error: functionError } = await supabase
      .rpc("check_function_exists", { function_name: "handle_new_user" })
      .single();

    console.log("Function check:", { functions, functionError });

    // Get current user to check auth
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

    // Check user's profile status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log("Profile status:", { profile, profileError });

    // Get count of profiles to see if any exist
    const { count: profileCount, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    console.log("Total profiles count:", { profileCount, countError });

    return new Response(
      JSON.stringify({
        success: true,
        triggerExists: triggers && triggers.length > 0,
        functionExists: !functionError,
        currentUser: {
          id: user.id,
          email: user.email,
          hasProfile: !!profile,
          profileError: profileError?.message,
        },
        totalProfiles: profileCount,
        debug: {
          triggers,
          functions,
          profile,
          profileError,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  } catch (error) {
    console.error("Error in test trigger API:", error);
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
