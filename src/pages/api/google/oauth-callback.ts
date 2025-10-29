import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("❌ [GOOGLE-OAUTH] OAuth error:", error);
    return redirect("/?error=oauth_error");
  }

  if (!code) {
    console.error("❌ [GOOGLE-OAUTH] No authorization code received");
    return redirect("/?error=no_code");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: import.meta.env.GOOGLE_CONTACTS_CLIENT_ID,
        client_secret: import.meta.env.GOOGLE_CONTACTS_CLIENT_SECRET,
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

    // Store tokens in cookies (in production, use secure, httpOnly cookies)
    cookies.set("google_access_token", tokenData.access_token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    });

    if (tokenData.refresh_token) {
      cookies.set("google_refresh_token", tokenData.refresh_token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        secure: true,
        httpOnly: true,
        sameSite: "lax",
      });
    }

    // Store user info in cookies
    cookies.set("google_user_info", JSON.stringify(userData), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    });

    console.log("✅ [GOOGLE-OAUTH] OAuth flow completed successfully");

    // Redirect to success page or back to the app
    return redirect("/?google_auth=success");
  } catch (error) {
    console.error("❌ [GOOGLE-OAUTH] OAuth callback error:", error);
    return redirect("/?error=oauth_callback_error");
  }
};
