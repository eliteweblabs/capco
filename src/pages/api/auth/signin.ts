import type { Provider } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { supabase } from "../../../lib/supabase";
import { getBaseUrl } from "../../../lib/url-utils";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Check if Supabase is configured
  if (!supabase) {
    console.error("[---AUTH-SIGNIN] Supabase is not configured - check [---SUPABASE-CLIENT] logs");
    return new Response("Supabase is not configured", { status: 500 });
  }

  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const provider = formData.get("provider")?.toString();

  if (provider) {
    // Use getBaseUrl to ensure we use the custom domain (capcofire.com) instead of Supabase URL
    // This ensures the redirect URL shown in Google's sign-in prompt uses your custom domain
    // Redirect directly to client-side callback for PKCE (code verifier is in localStorage)
    const baseUrl = getBaseUrl(request);
    const redirectUrl = `${baseUrl}/auth/callback`;
    console.log("[---AUTH-SIGNIN] OAuth redirect URL:", redirectUrl);
    console.log("[---AUTH-SIGNIN] Base URL:", baseUrl);

    console.log("[---AUTH-SIGNIN] Request URL:", request.url);
    console.log("[---AUTH-SIGNIN] Request hostname:", request.url ? new URL(request.url).hostname : "unknown");
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
          // Note: contacts.readonly scope is ONLY for standalone PDF system (/api/google/signin)
          // Regular authentication does NOT need contacts access
          scope: "openid email profile",
        },
      },
    });
    
    console.log("[---AUTH-SIGNIN] Supabase OAuth response URL:", data?.url);

    if (error) {
      // Log failed OAuth login attempt
      try {
        await SimpleProjectLogger.addLogEntry(
          0, // System log
          "error",
          `OAuth ${provider} failed: ${error.message}`,
          { provider, error: error.message }
        );
      } catch (logError) {
        console.error("[---AUTH-SIGNIN] Error logging failed OAuth login:", logError);
      }

      return new Response(error.message, { status: 500 });
    }

    // Log OAuth login initiation (we'll log success in the callback)
    try {
      await SimpleProjectLogger.addLogEntry(
        0, // System log
        "userLogin",
        `User logged in via OAuth ${provider} ${email || "oauth_user"}`,
        { provider, initiated: true }
      );
    } catch (logError) {
      console.error("[---AUTH-SIGNIN] Error logging OAuth login initiation:", logError);
    }

    return redirect(data.url);
  }

  if (!email || !password) {
    return redirect("/auth/login?error=invalid_credentials");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Log failed login attempt
    try {
      await SimpleProjectLogger.addLogEntry(
        0, // System log
        "error",
        `Password login failed: ${error.message} | ${email || "unknown"}`,
        { error: error.message, email: email || "unknown" }
      );
    } catch (logError) {
      console.error("[---AUTH-SIGNIN] Error logging failed login:", logError);
    }

    // Redirect to login page with error parameter
    return redirect("/auth/login?error=invalid_credentials");
  }

  // Profile will be automatically created by database trigger

  // Log successful login
  try {
    await SimpleProjectLogger.addLogEntry(
      0, // System log
      "userLogin",
      `User logged in via password ${data.user.email || email}`,
      {
        userId: data.user.id,
        userAgent: request.headers.get("user-agent"),
        ip: request.headers.get("x-forwarded-for") || "unknown",
        email: data.user.email || email,
      }
    );
  } catch (logError) {
    console.error("[---AUTH-SIGNIN] Error logging successful login:", logError);
  }

  const { access_token, refresh_token } = data.session;

  // Use shared utility for consistent cookie handling
  setAuthCookies(cookies, access_token, refresh_token);

  return redirect("/dashboard");
};
