import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);

    if (!isAuth || !currentUser) {
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

    if (!supabase || !supabaseAdmin) {
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

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user metadata from auth.users table
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError) {
      console.error("Error fetching auth user:", authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch user authentication data",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!authUser.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Combine auth user data with profile data
    const userInfo = {
      id: authUser.user.id,
      email: authUser.user.email,
      email_confirmed_at: authUser.user.email_confirmed_at,
      phone: authUser.user.phone,
      phone_confirmed_at: authUser.user.phone_confirmed_at,
      created_at: authUser.user.created_at,
      updated_at: authUser.user.updated_at,
      last_sign_in_at: authUser.user.last_sign_in_at,
      user_metadata: authUser.user.user_metadata,
      app_metadata: authUser.user.app_metadata,
      profile: profile || null,
      // Computed fields for easy access
      display_name:
        profile?.company_name ||
        profile?.name ||
        authUser.user.user_metadata?.full_name ||
        authUser.user.email?.split("@")[0] ||
        "Unknown User",
      role: profile?.role || "Unknown",
      company: profile?.company_name || null,
    };

    console.log("🔔 [USER-INFO] Fetched user info for:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        user: userInfo,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get user info error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch user information",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Also support GET method for convenience
export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);

    if (!isAuth || !currentUser) {
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

    if (!supabase || !supabaseAdmin) {
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

    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User ID is required as query parameter",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user metadata from auth.users table
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError) {
      console.error("Error fetching auth user:", authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch user authentication data",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!authUser.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Combine auth user data with profile data
    const userInfo = {
      id: authUser.user.id,
      email: authUser.user.email,
      email_confirmed_at: authUser.user.email_confirmed_at,
      phone: authUser.user.phone,
      phone_confirmed_at: authUser.user.phone_confirmed_at,
      created_at: authUser.user.created_at,
      updated_at: authUser.user.updated_at,
      last_sign_in_at: authUser.user.last_sign_in_at,
      user_metadata: authUser.user.user_metadata,
      app_metadata: authUser.user.app_metadata,
      profile: profile || null,
      // Computed fields for easy access
      display_name:
        profile?.company_name ||
        profile?.name ||
        authUser.user.user_metadata?.full_name ||
        authUser.user.email?.split("@")[0] ||
        "Unknown User",
      role: profile?.role || "Unknown",
      company: profile?.company_name || null,
    };

    console.log("🔔 [USER-INFO] Fetched user info for:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        user: userInfo,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get user info error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch user information",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
