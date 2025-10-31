import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, redirect, cookies }) => {
  // Google OAuth credentials from environment variables
  const clientId = import.meta.env.GOOGLE_PEOPLE_CLIENT_ID;
  const clientSecret = import.meta.env.GOOGLE_PEOPLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Google OAuth credentials not configured");
    return new Response("Google OAuth not configured", { status: 500 });
  }

  // Get redirect URL from query parameter, or use referer from request
  const redirectTo = url.searchParams.get("redirect") || url.searchParams.get("return_to") || null;
  
  // Generate a random state parameter for security and encode redirect URL
  const randomState = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Encode redirect URL in state (base64 encode to preserve URL structure)
  const stateData = {
    random: randomState,
    redirect: redirectTo,
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");

  // Store state in a cookie for verification
  const redirectUrl = `${url.origin}/api/google/oauth-callback`;

  // Build Google OAuth URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUrl);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set(
    "scope",
    "openid email profile https://www.googleapis.com/auth/contacts.readonly"
  );
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "consent");
  googleAuthUrl.searchParams.set("state", state);

  console.log("🔐 [GOOGLE-OAUTH] Redirecting to Google OAuth:", googleAuthUrl.toString());

  // Redirect to Google OAuth
  return redirect(googleAuthUrl.toString());
};
