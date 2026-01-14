import type { APIRoute } from "astro";

// Helper function to get the correct origin in production (handles proxy/load balancer)
function getOrigin(url: URL, request: Request): string {
  // Check for explicit production URL environment variable first
  const productionUrl = import.meta.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL;
  if (productionUrl) {
    try {
      const prodUrl = new URL(productionUrl);
      console.log("🔐 [GOOGLE-OAUTH] Using production URL from env:", prodUrl.origin);
      return prodUrl.origin;
    } catch (e) {
      console.warn("⚠️ [GOOGLE-OAUTH] Invalid production URL in env, falling back to header detection");
    }
  }

  // In production, use forwarded headers if available (Railway/Cloudflare/etc)
  if (import.meta.env.PROD) {
    const forwardedProto = request.headers.get("x-forwarded-proto") || request.headers.get("x-forwarded-protocol");
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
    
    if (forwardedProto && forwardedHost) {
      const origin = `${forwardedProto}://${forwardedHost}`;
      console.log("🔐 [GOOGLE-OAUTH] Using forwarded headers origin:", origin);
      return origin;
    }
    
    // Fallback: use host header with https in production
    const host = request.headers.get("host");
    if (host) {
      const origin = `https://${host}`;
      console.log("🔐 [GOOGLE-OAUTH] Using host header origin:", origin);
      return origin;
    }
  }

  // Development fallback
  console.log("🔐 [GOOGLE-OAUTH] Using url.origin fallback:", url.origin);
  return url.origin;
}

export const GET: APIRoute = async ({ url, redirect, cookies, request }) => {
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
  const randomState =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // Encode redirect URL in state (base64 encode to preserve URL structure)
  const stateData = {
    random: randomState,
    redirect: redirectTo,
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");

  // Store state in a cookie for verification
  // Use /api/auth/callback so the GET handler can process Google OAuth server-side
  const origin = getOrigin(url, request);
  const redirectUrl = `${origin}/api/auth/callback`;
  
  console.log("🔐 [GOOGLE-OAUTH] Redirect URL:", redirectUrl);
  console.log("🔐 [GOOGLE-OAUTH] Request headers:", {
    host: request.headers.get("host"),
    "x-forwarded-host": request.headers.get("x-forwarded-host"),
    "x-forwarded-proto": request.headers.get("x-forwarded-proto"),
    origin: request.headers.get("origin"),
  });

  // Build Google OAuth URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUrl);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "consent");
  googleAuthUrl.searchParams.set("state", state);

  console.log("🔐 [GOOGLE-OAUTH] Redirecting to Google OAuth:", googleAuthUrl.toString());

  // Redirect to Google OAuth
  return redirect(googleAuthUrl.toString());
};
