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
  const redirectTo = formData.get("redirect")?.toString() || "/dashboard";

  // Check if this is a fetch request (JSON expected) vs form submission (redirect expected)
  const acceptsJson = request.headers.get("accept")?.includes("application/json");

  if (provider) {
    // IMPORTANT: OAuth must be initiated client-side for PKCE to work
    // Server-side OAuth initiation doesn't store code verifier in browser localStorage
    // Redirect to a client-side OAuth initiation page instead
    const baseUrl = getBaseUrl(request);
    const redirectUrl = `${baseUrl}/auth/callback`;

    console.log("[---AUTH-SIGNIN] OAuth provider requested:", provider);
    console.log("[---AUTH-SIGNIN] Redirecting to client-side OAuth initiation...");
    console.log("[---AUTH-SIGNIN] OAuth redirect URL:", redirectUrl);

    // Store provider in a temporary session/cookie so client-side can use it
    // Or redirect to a page that initiates OAuth client-side
    // For now, redirect to login page with provider parameter
    // The login page should handle client-side OAuth initiation
    return redirect(`/auth/login?provider=${provider}&oauth=true`);
  }

  if (!email || !password) {
    if (acceptsJson) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Please provide both email and password",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
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

    // Map Supabase errors to user-friendly messages (avoid leaking security info)
    const msg = error.message?.toLowerCase() || "";
    let userMessage = "Invalid email or password";
    if (msg.includes("email not confirmed")) {
      userMessage =
        "Please confirm your email address. Check your inbox for the confirmation link.";
    } else if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
      userMessage = "Invalid email or password";
    } else if (msg.includes("too many requests") || msg.includes("rate limit")) {
      userMessage = "Too many sign-in attempts. Please try again in a few minutes.";
    } else if (msg.includes("email rate limit") || msg.includes("email_not_confirmed")) {
      userMessage =
        "Please confirm your email address. Check your inbox for the confirmation link.";
    }

    // Return JSON error for fetch requests, redirect for form submissions
    if (acceptsJson) {
      return new Response(
        JSON.stringify({
          success: false,
          error: userMessage,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return redirect(
      `/auth/login?error=invalid_credentials&message=${encodeURIComponent(userMessage)}`
    );
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

  // Store Campfire auto-login flag for Staff and Admin users
  // We'll handle the actual Campfire login client-side to avoid cross-domain cookie issues
  try {
    const { shouldAutoAuthCampfire } = await import("../../../lib/campfire-auth");

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const userRole = profile?.role || data.user.user_metadata?.role || "Client";

    if (shouldAutoAuthCampfire(userRole)) {
      // Store a flag in a cookie that the client-side script can read
      // This tells the dashboard to attempt Campfire auto-login
      cookies.set("campfire-auto-login", "true", {
        path: "/",
        httpOnly: false, // Client-side script needs to read this
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: 300, // 5 minutes - just long enough for redirect
      });

      console.log(`✅ [AUTH-SIGNIN] Set Campfire auto-login flag for ${userRole} user`);
    }
  } catch (campfireError) {
    console.error(`❌ [AUTH-SIGNIN] Error setting Campfire auto-login flag:`, campfireError);
    // Don't fail the main login if this fails
  }

  // Return JSON response for fetch requests, redirect for form submissions
  if (acceptsJson) {
    return new Response(
      JSON.stringify({
        success: true,
        message: "Login successful",
        redirect: redirectTo,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  return redirect(redirectTo);
};
