import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { supabase } from "../../../lib/supabase";
import { SimpleProjectLogger } from "../../../lib/simple-logging";

// GET handler - Handles both Supabase OAuth and Google People API OAuth
export const GET: APIRoute = async ({ url, redirect, cookies }) => {
  console.log("[---AUTH-CALLBACK] GET callback received");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Check if this is a Google People API OAuth callback
  // We can detect this by checking if GOOGLE_PEOPLE_CLIENT_ID is configured
  // and if the state contains our encoded redirect data
  const googlePeopleClientId = import.meta.env.GOOGLE_PEOPLE_CLIENT_ID;
  const googlePeopleClientSecret = import.meta.env.GOOGLE_PEOPLE_CLIENT_SECRET;

  if (googlePeopleClientId && googlePeopleClientSecret && code) {
    // Try to decode state to see if it's our Google People API OAuth
    let isGooglePeopleOAuth = false;
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
        // If state has a redirect field, it's likely our Google People API OAuth
        if (stateData.redirect) {
          isGooglePeopleOAuth = true;
        }
      } catch (e) {
        // Not our state format, probably Supabase
      }
    }

    if (isGooglePeopleOAuth) {
      console.log("[---AUTH-CALLBACK] Detected Google People API OAuth, processing...");
      // Import and use the Google OAuth callback logic
      const { GET: googleOAuthCallback } = await import("../google/____oauth-callback");
      return googleOAuthCallback({ url, cookies, redirect } as any);
    }
  }

  // Otherwise, this is Supabase OAuth - redirect to client-side handler
  console.log("[---AUTH-CALLBACK] Supabase OAuth detected, redirecting to client-side handler");
  const params = new URLSearchParams(url.search);
  if (params.toString()) {
    return redirect(`/auth/callback?${params.toString()}`);
  }

  // No parameters, redirect to home
  return redirect("/");
};

export const POST: APIRoute = async ({ request, cookies, url }) => {
  console.log(
    "[---AUTH-CALLBACK] POST callback started - receiving tokens from client-side PKCE exchange"
  );

  // Check if Supabase is configured
  if (!supabase) {
    console.error("[---AUTH-CALLBACK] Supabase is not configured");
    return new Response(JSON.stringify({ error: "Supabase is not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { access_token, refresh_token, expires_in, token_type } = body;

    console.log("[---AUTH-CALLBACK] Received tokens from client-side:", {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
      expiresIn: expires_in,
      tokenType: token_type,
    });

    if (!access_token || !refresh_token) {
      console.error("[---AUTH-CALLBACK] Missing required tokens");
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
      console.error("[---AUTH-CALLBACK] Session verification error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data.session) {
      console.error("[---AUTH-CALLBACK] No session created");
      return new Response(JSON.stringify({ error: "Failed to create session" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[---AUTH-CALLBACK] Session verified for user:", data.user?.email);
    console.log("[---AUTH-CALLBACK] Session data:", {
      hasSession: !!data.session,
      hasProviderToken: !!data.session?.provider_token,
      providerToken: data.session?.provider_token ? "present" : "missing",
      userMetadata: data.user?.user_metadata,
    });

    // Download and save Google avatar if present
    const googleAvatarUrl =
      data.user?.user_metadata?.avatarUrl || data.user?.user_metadata?.picture;

    if (googleAvatarUrl && data.user?.id) {
      console.log("[---AUTH-CALLBACK] Google avatar detected, saving to storage");
      try {
        const baseUrl = url.origin;
        const saveAvatarResponse = await fetch(`${baseUrl}/api/auth/save-avatar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.user.id,
            avatarUrl: googleAvatarUrl,
          }),
        });

        if (saveAvatarResponse.ok) {
          const result = await saveAvatarResponse.json();
          console.log("[---AUTH-CALLBACK] Avatar saved successfully:", result.avatarUrl);
        } else {
          const errorText = await saveAvatarResponse.text();
          console.error(
            "[---AUTH-CALLBACK] Failed to save avatar:",
            saveAvatarResponse.status,
            errorText
          );
        }
      } catch (avatarError) {
        // Don't fail the login if avatar saving fails
        console.error("[---AUTH-CALLBACK] Avatar save error:", avatarError);
      }
    }

    // Set auth cookies using the verified session tokens
    setAuthCookies(cookies, data.session.access_token, data.session.refresh_token);

    // Log the successful login
    try {
      await SimpleProjectLogger.logUserLogin(data.user?.email || "Unknown", "google", {
        provider: "google",
        userAgent: request.headers.get("user-agent"),
        timestamp: new Date().toISOString(),
      });
      console.log("[---AUTH-CALLBACK] Login event logged successfully");
    } catch (logError) {
      console.error("[---AUTH-CALLBACK] Error logging login event:", logError);
      // Don't fail the auth flow if logging fails
    }

    console.log("[---AUTH-CALLBACK] Auth cookies set successfully");
    console.log("[---AUTH-CALLBACK] Cookie details:", {
      hasAccessToken: !!cookies.get("sb-access-token"),
      hasRefreshToken: !!cookies.get("sb-refresh-token"),
      accessTokenValue: cookies.get("sb-access-token")?.value?.substring(0, 20) + "...",
      refreshTokenValue: cookies.get("sb-refresh-token")?.value?.substring(0, 20) + "...",
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: data.user?.email,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Ensure cookies are sent with the response
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[---AUTH-CALLBACK] Unexpected error:", error);
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
