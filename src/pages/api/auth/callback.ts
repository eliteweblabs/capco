import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  // // // console.log("Auth callback started");

  // Check if Supabase is configured
  if (!supabase) {
    console.error("Supabase is not configured");
    return new Response("Supabase is not configured", { status: 500 });
  }

  // Get the auth code from the URL
  const authCode = url.searchParams.get("code");
  // // // console.log("Auth code received:", authCode ? "present" : "missing");

  if (!authCode) {
    // // // console.log("No auth code provided, redirecting to home");
    return redirect("/");
  }

  try {
    // // // console.log("Attempting to exchange code for session...");
    // // console.log("Full URL params:", Object.fromEntries(url.searchParams.entries()));

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

    if (error) {
      console.error("Auth callback error:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
      });

      // If it's a PKCE error, redirect to home with error message
      if (error.message.includes("code verifier")) {
        // // // console.log("PKCE error detected, redirecting to home");
        return redirect("/?error=oauth_failed");
      }

      return new Response(`Authentication error: ${error.message}`, {
        status: 500,
      });
    }

    // // // console.log("Session exchange successful:", !!data.session);

    if (!data.session) {
      return new Response("No session created", { status: 400 });
    }

    const { access_token, refresh_token } = data.session;
    // // // console.log("Tokens received:", !!access_token, !!refresh_token);

    // Profile will be automatically created by database trigger

    // Use shared utility for consistent cookie handling
    setAuthCookies(cookies, access_token, refresh_token);

    // // // console.log("Cookies set, redirecting to dashboard");
    return redirect("/dashboard");
  } catch (error) {
    console.error("Unexpected error in auth callback:", error);
    return new Response(
      `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  // // // console.log("🔐 [MAGIC-LINK] POST callback started");

  // Check if Supabase is configured
  if (!supabase) {
    console.error("❌ [MAGIC-LINK] Supabase is not configured");
    return new Response(JSON.stringify({ error: "Supabase is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { access_token, refresh_token, expires_in, token_type } = body;

    // // // console.log("🔐 [MAGIC-LINK] Received tokens:", {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
      expiresIn: expires_in,
      tokenType: token_type,
    });

    if (!access_token || !refresh_token) {
      console.error("❌ [MAGIC-LINK] Missing required tokens");
      return new Response(JSON.stringify({ error: "Missing access_token or refresh_token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify the session with Supabase
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error("❌ [MAGIC-LINK] Session verification error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data.session) {
      console.error("❌ [MAGIC-LINK] No session created");
      return new Response(JSON.stringify({ error: "Failed to create session" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // // // console.log("✅ [MAGIC-LINK] Session verified for user:", data.user?.email);

    // Set auth cookies using the verified session tokens
    setAuthCookies(cookies, data.session.access_token, data.session.refresh_token);

    // // // console.log("✅ [MAGIC-LINK] Auth cookies set successfully");

    return new Response(
      JSON.stringify({
        success: true,
        user: data.user?.email,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [MAGIC-LINK] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
