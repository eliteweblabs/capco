import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { setAuthCookies } from "../../../lib/auth-cookies";

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
    return new Response("No authorization code provided", { status: 400 });
  }

  try {
    console.log("Attempting to exchange code for session...");

    // Exchange the code for a session
    const { data, error } =
      await supabase.auth.exchangeCodeForSession(authCode);

    if (error) {
      console.error("Auth callback error:", error);
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
