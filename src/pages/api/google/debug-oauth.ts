import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const clientId = import.meta.env.GOOGLE_CLIENT_ID;
  const clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({
        error: "Google OAuth credentials not configured",
        message: "Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Build the Google OAuth URL with proper scopes
  const redirectUrl = `${url.origin}/api/google/oauth-callback`;
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
  googleAuthUrl.searchParams.set("state", "debug");

  return new Response(
    JSON.stringify({
      success: true,
      message: "OAuth configuration check",
      clientId: clientId.substring(0, 10) + "...", // Partial for security
      redirectUrl: redirectUrl,
      authUrl: googleAuthUrl.toString(),
      instructions: {
        step1: "Go to Google Cloud Console → APIs & Services → OAuth consent screen",
        step2: "Set User Type to 'External' (not Internal)",
        step3: "Add scope: https://www.googleapis.com/auth/contacts.readonly",
        step4: "If in Testing mode, add your email to Test Users",
        step5: "Make sure People API is enabled in APIs & Services → Library",
        step6: "Try the auth URL above to test OAuth flow",
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
