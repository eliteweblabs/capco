import type { APIRoute } from "astro";

/**
 * Refresh Google Access Token
 * Uses refresh token to get a new access token when it expires
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const refreshToken = cookies.get("google_refresh_token")?.value;

    if (!refreshToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No refresh token available. Please re-authenticate with Google.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const clientId = import.meta.env.GOOGLE_PEOPLE_CLIENT_ID;
    const clientSecret = import.meta.env.GOOGLE_PEOPLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Google OAuth not configured",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Exchange refresh token for new access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("❌ [GOOGLE-REFRESH] Token refresh failed:", tokenData);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to refresh token",
          details: tokenData.error_description || tokenData.error,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update access token in cookie
    const isDev = !import.meta.env.PROD;
    cookies.set("google_access_token", tokenData.access_token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: !isDev,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log("✅ [GOOGLE-REFRESH] Token refreshed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [GOOGLE-REFRESH] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
