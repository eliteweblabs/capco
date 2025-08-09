import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { ensureUserProfile } from "../../../lib/auth-utils";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  console.log("Auth callback started");

  // Check if Supabase is configured
  if (!supabase) {
    console.error("Supabase is not configured");
    return new Response("Supabase is not configured", { status: 500 });
  }

  // Get the auth code from the URL
  const authCode = url.searchParams.get("code");
  console.log("Auth code received:", authCode ? "present" : "missing");

  if (!authCode) {
    console.log("No auth code provided, redirecting to home");
    return redirect("/");
  }

  try {
    console.log("Attempting to exchange code for session...");
    console.log("Full URL params:", Object.fromEntries(url.searchParams.entries()));

    // Exchange the code for a session
    const { data, error } =
      await supabase.auth.exchangeCodeForSession(authCode);

    if (error) {
      console.error("Auth callback error:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
      });
      
      // If it's a PKCE error, redirect to home with error message
      if (error.message.includes("code verifier")) {
        console.log("PKCE error detected, redirecting to home");
        return redirect("/?error=oauth_failed");
      }
      
      return new Response(`Authentication error: ${error.message}`, {
        status: 500,
      });
    }

    console.log("Session exchange successful:", !!data.session);

    if (!data.session) {
      return new Response("No session created", { status: 400 });
    }

    const { access_token, refresh_token } = data.session;
    console.log("Tokens received:", !!access_token, !!refresh_token);

    // Check if user has a profile, create one if not
    if (data.user) {
      console.log("Checking/creating profile for user:", data.user.id);
      await ensureUserProfile(data.user);
    }

    // Use shared utility for consistent cookie handling
    setAuthCookies(cookies, access_token, refresh_token);

    console.log("Cookies set, redirecting to dashboard");
    return redirect("/");
  } catch (error) {
    console.error("Unexpected error in auth callback:", error);
    return new Response(
      `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 },
    );
  }
};
