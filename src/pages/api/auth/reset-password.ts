import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { supabase } from "../../../lib/supabase";

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

    // Create a new session for the user using the client-side supabase
    if (supabase) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "",
      });

      if (sessionError) {
        console.error("Error setting session:", sessionError);
        return new Response(
          JSON.stringify({ error: "Failed to create session" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      // Set session cookies
      if (sessionData.session) {
        const { access_token, refresh_token } = sessionData.session;
        
        // Set cookies with proper security settings
        cookies.set("sb-access-token", access_token, {
          path: "/",
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        cookies.set("sb-refresh-token", refresh_token, {
          path: "/",
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return new Response(
          JSON.stringify({ 
            message: "Password updated successfully and session created",
            user: user 
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
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
