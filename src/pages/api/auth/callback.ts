import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { supabase } from "../../../lib/supabase";
import { SimpleProjectLogger } from "../../../lib/simple-logging";

// GET handler - Legacy fallback for old redirect URLs
// OAuth should now redirect directly to /auth/callback (client-side)
// This handler redirects any requests that still hit /api/auth/callback to the client-side handler
export const GET: APIRoute = async ({ url, redirect }) => {
  console.log(
    "[---AUTH-CALLBACK] GET callback received (legacy redirect - should use /auth/callback directly)"
  );

  // Preserve all URL parameters and redirect to client-side callback
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
