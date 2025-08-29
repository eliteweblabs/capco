import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { setAuthCookies } from "../../../lib/auth-cookies";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { password, accessToken, refreshToken } = await request.json();

    if (!password || !accessToken) {
      return new Response(
        JSON.stringify({ error: "Password and access token are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters long" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!supabaseAdmin) {
      console.error("Supabase admin client not available");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user from the access token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      console.error("Error getting user from token:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset link" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update the user's password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: password,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update password" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Set session cookies using the proper auth-cookies function
    // These tokens are valid and can be used to establish a session
    if (accessToken && refreshToken) {
      setAuthCookies(cookies, accessToken, refreshToken);

      return new Response(
        JSON.stringify({ 
          message: "Password updated successfully and session created",
          user: user 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: "Password updated successfully",
        user: user 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Reset password error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
