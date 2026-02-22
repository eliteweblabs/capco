import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { SimpleProjectLogger } from "../../../lib/simple-logging";

// GET handler - Handles both Supabase OAuth and Google People API OAuth
export const GET: APIRoute = async ({ url, redirect, cookies }) => {
  console.log("[---AUTH-CALLBACK] GET callback received");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Check if this is a Google People API OAuth callback
  // We can detect this by checking if GOOGLE_PEOPLE_clientId is configured
  // and if the state contains our encoded redirect data
  const googlePeopleClientId = import.meta.env.GOOGLE_PEOPLE_clientId;
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
  // Preserve full query string (code, state, redirect, etc.) so callback page gets everything
  console.log("[---AUTH-CALLBACK] Supabase OAuth detected, redirecting to client-side handler");
  const query = url.search ? (url.search.startsWith("?") ? url.search : `?${url.search}`) : "";
  if (query) {
    return redirect(`/auth/callback${query}`);
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
        // Call save-avatar function directly instead of HTTP request to avoid SSL issues
        const { saveAvatarDirect } = await import("./save-avatar");
        const result = await saveAvatarDirect(data.user.id, googleAvatarUrl);

        if (result.success) {
          console.log("[---AUTH-CALLBACK] Avatar saved successfully:", result.avatarUrl);
        } else {
          console.error("[---AUTH-CALLBACK] Failed to save avatar:", result.error);
        }
      } catch (avatarError) {
        // Don't fail the login if avatar saving fails
        console.error("[---AUTH-CALLBACK] Avatar save error:", avatarError);
      }
    }

    // Ensure user has a profile row (handles Google OAuth users who don't have one)
    if (data.user?.id && supabaseAdmin) {
      console.log("[---AUTH-CALLBACK] Checking if profile exists for user:", data.user.id);

      const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (profileCheckError && profileCheckError.code === "PGRST116") {
        // Profile doesn't exist, create it
        console.log("[---AUTH-CALLBACK] No profile found, creating one for:", data.user.email);

        const metadata = data.user.user_metadata || {};

        // Extract user info from metadata (handle different OAuth providers)
        const firstName =
          metadata.firstName ||
          metadata.first_name ||
          metadata.given_name || // Google OAuth
          "";

        const lastName =
          metadata.lastName ||
          metadata.last_name ||
          metadata.family_name || // Google OAuth
          "";

        const companyName =
          metadata.companyName ||
          metadata.companyName ||
          metadata.name || // Google OAuth full name
          metadata.full_name ||
          data.user.email?.split("@")[0] ||
          "Unknown Company";

        const avatarUrl =
          metadata.avatarUrl ||
          metadata.avatar_url ||
          metadata.picture || // Google OAuth
          null;

        const { error: createProfileError } = await supabaseAdmin.from("profiles").insert({
          id: data.user.id,
          email: data.user.email,
          companyName: companyName,
          role: "Client",
          firstName: firstName,
          lastName: lastName,
          avatarUrl: avatarUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        if (createProfileError) {
          console.error("[---AUTH-CALLBACK] Error creating profile:", createProfileError);
        } else {
          console.log("[---AUTH-CALLBACK] ✅ Profile created successfully for:", data.user.email);
        }
      } else if (existingProfile) {
        console.log("[---AUTH-CALLBACK] Profile already exists for:", data.user.email);
      } else if (profileCheckError) {
        console.error("[---AUTH-CALLBACK] Error checking profile:", profileCheckError);
      }
    } else if (!supabaseAdmin) {
      console.error(
        "[---AUTH-CALLBACK] supabaseAdmin not available - check SUPABASE_SECRET env var"
      );
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
