import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  console.log("🔍 [GOOGLE-OAUTH] OAuth callback received:", {
    fullUrl: url.toString(),
    pathname: url.pathname,
    searchParams: url.search,
    hasCode: url.searchParams.has("code"),
    hasState: url.searchParams.has("state"),
    hasError: url.searchParams.has("error"),
  });

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Decode redirect URL from state
  let redirectTo = null;
  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
      redirectTo = stateData.redirect || null;
    } catch (e) {
      console.warn("⚠️ [GOOGLE-OAUTH] Failed to decode state, using default redirect");
    }
  }

  if (error) {
    console.error("❌ [GOOGLE-OAUTH] OAuth error:", error);
    return redirect(redirectTo || "/?error=oauth_error");
  }

  if (!code) {
    console.error("❌ [GOOGLE-OAUTH] No authorization code received");
    console.error("🔍 [GOOGLE-OAUTH] URL details:", {
      href: url.href,
      search: url.search,
      searchParams: Object.fromEntries(url.searchParams.entries()),
      origin: url.origin,
      pathname: url.pathname,
    });
    return redirect(redirectTo || "/?error=no_code");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: import.meta.env.GOOGLE_PEOPLE_CLIENT_ID,
        client_secret: import.meta.env.GOOGLE_PEOPLE_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: `${url.origin}/api/google/oauth-callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("❌ [GOOGLE-OAUTH] Token exchange failed:", tokenData);
      return redirect("/?error=token_exchange_failed");
    }

    console.log("✅ [GOOGLE-OAUTH] Token exchange successful");

    // Get user info
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
    );
    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error("❌ [GOOGLE-OAUTH] User info fetch failed:", userData);
      return redirect("/?error=user_info_failed");
    }

    console.log("✅ [GOOGLE-OAUTH] User info retrieved:", userData.email);

    // Store tokens in cookies (use same pattern as other auth system)
    const isDev = !import.meta.env.PROD;
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      secure: !isDev, // Only secure in production (matches auth-cookies.ts pattern)
    };

    cookies.set("google_access_token", tokenData.access_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    if (tokenData.refresh_token) {
      cookies.set("google_refresh_token", tokenData.refresh_token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // Store user info in cookies
    cookies.set("google_user_info", JSON.stringify(userData), {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log("✅ [GOOGLE-OAUTH] Cookies set:", {
      isDev,
      secure: !isDev,
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      origin: url.origin,
    });

    console.log("✅ [GOOGLE-OAUTH] OAuth flow completed successfully");

    // Redirect back to the page that initiated the auth, or to success page
    // If redirectTo was decoded from state, use it; otherwise use query param or default
    const finalRedirect = redirectTo || url.searchParams.get("redirect") || "/?google_auth=success";
    return redirect(finalRedirect);
  } catch (error) {
    console.error("❌ [GOOGLE-OAUTH] OAuth callback error:", error);
    // Decode redirect URL from state for error redirect too
    let errorRedirect = null;
    const state = url.searchParams.get("state");
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
        errorRedirect = stateData.redirect || null;
      } catch (e) {
        // Ignore decode errors
      }
    }
    return redirect(errorRedirect || "/?error=oauth_callback_error");
  }
};
