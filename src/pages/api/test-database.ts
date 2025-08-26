import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  try {
    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    const results: any = {
      supabaseConfigured: !!supabase,
      user: {
        exists: !!user,
        id: user?.id,
        email: user?.email,
        error: userError?.message,
      },
    };

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No authenticated user",
          results,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Test 1: Get user's own profile
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    results.userProfile = {
      exists: !!userProfile,
      data: userProfile,
      error: profileError?.message,
    };

    // Test 2: Try to get all profiles (should be blocked by RLS)
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from("profiles")
      .select("*");

    results.allProfiles = {
      count: allProfiles?.length || 0,
      data: allProfiles,
      error: allProfilesError?.message,
    };

    // Test 3: Try to get staff profiles specifically
    const { data: staffProfiles, error: staffError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "Staff");

    results.staffProfiles = {
      count: staffProfiles?.length || 0,
      data: staffProfiles,
      error: staffError?.message,
    };

    // Test 4: Try to get admin profiles
    const { data: adminProfiles, error: adminError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "Admin");

    results.adminProfiles = {
      count: adminProfiles?.length || 0,
      data: adminProfiles,
      error: adminError?.message,
    };

    // Test 5: Try to get client profiles
    const { data: clientProfiles, error: clientError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "Client");

    results.clientProfiles = {
      count: clientProfiles?.length || 0,
      data: clientProfiles,
      error: clientError?.message,
    };

    // Test 6: Try to get any profiles with any role
    const { data: anyProfiles, error: anyError } = await supabase
      .from("profiles")
      .select("id, role")
      .limit(10);

    results.anyProfiles = {
      count: anyProfiles?.length || 0,
      data: anyProfiles,
      error: anyError?.message,
    };

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: (error as Error)?.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
