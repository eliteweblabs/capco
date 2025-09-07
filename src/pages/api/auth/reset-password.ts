import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { supabase } from "../../../lib/supabase";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { ensureUserProfile } from "../../../lib/auth-utils";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { password, accessToken, refreshToken } = await request.json();

    if (!password || !accessToken) {
      return new Response(JSON.stringify({ error: "Password and access token are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters long" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!supabaseAdmin || !supabase) {
      console.error("Supabase clients not available");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user from the access token
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      console.error("Error getting user from token:", userError);
      return new Response(JSON.stringify({ error: "Invalid or expired reset link" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update the user's password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: password,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update password" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create a fresh session using the new password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      console.error("Error creating fresh session:", signInError);
      return new Response(JSON.stringify({ error: "Failed to create session with new password" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Ensure user profile exists
    if (signInData.user) {
      await ensureUserProfile(signInData.user);
    }

    // Set session cookies with the fresh session tokens
    const { access_token, refresh_token } = signInData.session;
    setAuthCookies(cookies, access_token, refresh_token);

    return new Response(
      JSON.stringify({
        message: "Password updated successfully and session created",
        user: signInData.user,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
