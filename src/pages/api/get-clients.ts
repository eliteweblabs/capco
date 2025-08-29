import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Get user from session
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    // Set session
    const { data: session, error: sessionError } = await supabase!.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session.session?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
      });
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase!
      .from("profiles")
      .select("role")
      .eq("id", session.session.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "Failed to verify user permissions" }), {
        status: 500,
      });
    }

    const userRole = profile?.role?.toLowerCase();

    // Only admin and staff can fetch clients
    if (userRole !== "admin" && userRole !== "staff") {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
      });
    }

    // Fetch all users with role 'client'
    const { data: clients, error } = await supabase!
      .from("profiles")
      .select("id, company_name, email")
      .eq("role", "Client")
      .order("company_name");

    if (error) {
      console.error("Error fetching clients:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(clients), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in get-clients:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
