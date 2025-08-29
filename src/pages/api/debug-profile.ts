import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Get the access token from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "No access token found" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid access token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ 
        error: "Failed to fetch profile",
        details: profileError 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      },
      profile: profile,
      phone_debug: {
        raw_value: profile.phone,
        type: typeof profile.phone,
        is_null: profile.phone === null,
        is_undefined: profile.phone === undefined,
        string_length: profile.phone ? String(profile.phone).length : 0
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Debug profile error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
