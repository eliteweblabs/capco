import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  try {
    const debugInfo: any = {
      supabaseConfigured: !!supabase,
      timestamp: new Date().toISOString(),
    };

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase not configured",
          debugInfo,
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

    debugInfo.user = {
      exists: !!user,
      id: user?.id,
      email: user?.email,
      userError: userError?.message,
    };

    if (userError || !user) {
      debugInfo.message = "No authenticated user";
      return new Response(
        JSON.stringify({
          success: false,
          error: "No authenticated user",
          debugInfo,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    debugInfo.profile = {
      exists: !!profile,
      data: profile,
      error: profileError?.message,
    };

    // Check all profiles in database
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from("profiles")
      .select("*");

    debugInfo.allProfiles = {
      count: allProfiles?.length || 0,
      profiles: allProfiles,
      error: allProfilesError?.message,
    };

    // Check staff profiles specifically
    const { data: staffProfiles, error: staffError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "Staff");

    debugInfo.staffProfiles = {
      count: staffProfiles?.length || 0,
      profiles: staffProfiles,
      error: staffError?.message,
    };

    // Try a direct query using RPC function to bypass RLS
    const { data: rpcStaffProfiles, error: rpcStaffError } = await supabase.rpc("get_staff_users");

    debugInfo.rpcStaffProfiles = {
      count: rpcStaffProfiles?.length || 0,
      profiles: rpcStaffProfiles,
      error: rpcStaffError?.message,
    };

    // Also try to get all profiles to see what's in the table
    const { data: allProfilesRpc, error: allProfilesRpcError } =
      await supabase.rpc("get_all_profiles");

    debugInfo.allProfilesRpc = {
      count: allProfilesRpc?.length || 0,
      profiles: allProfilesRpc,
      error: allProfilesRpcError?.message,
    };

    // Check admin profiles
    const { data: adminProfiles, error: adminError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "Admin");

    debugInfo.adminProfiles = {
      count: adminProfiles?.length || 0,
      profiles: adminProfiles,
      error: adminError?.message,
    };

    return new Response(
      JSON.stringify({
        success: true,
        debugInfo,
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
