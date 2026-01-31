import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

/**
 * Verify Password API
 *
 * Re-authenticates the user by verifying their password.
 * Used for sensitive operations like starting the voice assistant.
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { password } = await request.json();

    if (!password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Password is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get current user's email from session
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[AUTH-VERIFY] Supabase configuration missing");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get session from cookie
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Not authenticated",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Set session
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !user?.email) {
      console.error("[AUTH-VERIFY] Session error:", sessionError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid session",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify password by attempting to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });

    if (signInError || !signInData.user) {
      console.log("[AUTH-VERIFY] Password verification failed for user:", user.email);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid password",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Password verified successfully
    console.log("[AUTH-VERIFY] Password verified for user:", user.email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password verified",
        verifiedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[AUTH-VERIFY] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Verification failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
