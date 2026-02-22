import type { APIRoute } from "astro";

// Prefer request URL so localhost stays localhost; env only when request origin unavailable
function getOrigin(url: URL, request: Request): string {
  const forwardedProto =
    request.headers.get("x-forwarded-proto") || request.headers.get("x-forwarded-protocol");
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const host = forwardedHost || request.headers.get("host");
  const proto =
    forwardedProto ||
    (url.protocol === "https:" ? "https" : "http");

  if (host) {
    const origin = `${proto}://${host}`;
    try {
      new URL(origin);
      console.log("🔐 [GOOGLE-OAUTH] Using request-derived origin:", origin);
      return origin;
    } catch (e) {
      console.warn("⚠️ [GOOGLE-OAUTH] Invalid origin from headers, trying url.origin");
    }
  }

  if (url.origin && url.origin !== "null") {
    console.log("🔐 [GOOGLE-OAUTH] Using url.origin:", url.origin);
    return url.origin;
  }

  const productionUrl = import.meta.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL;
  if (productionUrl) {
    try {
      const prodUrl = new URL(productionUrl.startsWith("http") ? productionUrl : `https://${productionUrl}`);
      console.log("🔐 [GOOGLE-OAUTH] Using env fallback origin:", prodUrl.origin);
      return prodUrl.origin;
    } catch (e) {
      console.warn("⚠️ [GOOGLE-OAUTH] Invalid production URL in env");
    }
  }

  return url.origin || "http://localhost:4321";
}

export const GET: APIRoute = async ({ url, redirect, cookies, request }) => {
  // Google OAuth credentials from environment variables
  const clientId = import.meta.env.GOOGLE_PEOPLE_clientId;
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
  googleAuthUrl.searchParams.set("clientId", clientId);
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
