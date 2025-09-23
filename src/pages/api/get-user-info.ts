import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
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

    if (!supabaseAdmin) {
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

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, company_name, email, phone, role, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch user profile",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User profile not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build user info from profile data
    const userInfo = {
      id: profile.id,
      email: profile.email,
      phone: profile.phone,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      profile: profile,
      role: profile.role || "Unknown",
      company_name: profile.company_name || null,
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
    };

    // // // console.log("🔔 [USER-INFO] Fetched user info for:", userId);

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

    if (!supabaseAdmin) {
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

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, company_name, email, phone, role, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch user profile",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User profile not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build user info from profile data
    const userInfo = {
      id: profile.id,
      email: profile.email,
      phone: profile.phone,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      profile: profile,
      role: profile.role || "Unknown",
      company_name: profile.company_name || null,
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
    };

    // // // console.log("🔔 [USER-INFO] Fetched user info for:", userId);

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
