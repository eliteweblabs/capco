import type { APIRoute } from "astro";
import { setAuthCookies, clearAuthCookies, getCurrentSession } from "../../../lib/auth-cookies";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { SimpleProjectLogger } from "../../../lib/simple-logging";

export const GET: APIRoute = async ({ url, cookies, redirect, request }) => {
  console.log("🔐 [VERIFY-CUSTOM] Custom magic link verification started");

  // Check if Supabase is configured
  if (!supabase) {
    console.error("🔐 [VERIFY-CUSTOM] Regular Supabase client not available");
    return redirect("/login?error=verification_error");
  }

  if (!supabaseAdmin) {
    console.error("🔐 [VERIFY-CUSTOM] Supabase admin client not available");
    return redirect("/login?error=verification_error");
  }

  try {
    // Get parameters from URL
    const token = url.searchParams.get("token");
    const email = url.searchParams.get("email");
    const redirectPath = url.searchParams.get("redirect") || "/dashboard";

    console.log("🔐 [VERIFY-CUSTOM] Verification parameters:", {
      hasToken: !!token,
      hasEmail: !!email,
      redirectPath,
    });

    if (!token || !email) {
      console.log("🔐 [VERIFY-CUSTOM] Missing required parameters");
      return redirect("/login?error=no_token");
    }

    // Check for existing session and log out if different user
    const currentSession = await getCurrentSession(cookies);

    console.log("🔐 [VERIFY-CUSTOM] Session management check:", {
      hasCurrentSession: !!currentSession,
      currentUserEmail: currentSession?.user?.email,
      newUserEmail: email,
      isDifferentUser: currentSession && currentSession.user?.email !== email,
    });

    if (currentSession && currentSession.user?.email !== email) {
      console.log("🔐 [VERIFY-CUSTOM] Different user detected, logging out previous session:", {
        previousUser: currentSession.user?.email,
        newUser: email,
      });

      // Log the logout of the previous user
      try {
        await SimpleProjectLogger.logUserLogout(currentSession.user?.email || "Unknown", {
          reason: "Different user logged in via magic link",
          newUser: email,
          timestamp: new Date().toISOString(),
        });
        console.log("✅ [VERIFY-CUSTOM] Previous user logout logged successfully");
      } catch (logError) {
        console.error("❌ [VERIFY-CUSTOM] Error logging previous user logout:", logError);
      }

      // Clear existing auth cookies
      clearAuthCookies(cookies);
      console.log("🔐 [VERIFY-CUSTOM] Cleared previous user's auth cookies");
    } else if (currentSession && currentSession.user?.email === email) {
      console.log("🔐 [VERIFY-CUSTOM] Same user detected, no logout needed:", {
        userEmail: email,
      });
    } else {
      console.log("🔐 [VERIFY-CUSTOM] No existing session found, proceeding with new login");
    }

    // Verify the custom token
    console.log("🔐 [VERIFY-CUSTOM] Verifying custom token...");
    console.log("🔐 [VERIFY-CUSTOM] Looking for token:", token);
    console.log("🔐 [VERIFY-CUSTOM] Looking for email:", email);

    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("magicLinkTokens")
      .select("*")
      .eq("token", token)
      .eq("email", email)
      .single();

    console.log("🔐 [VERIFY-CUSTOM] Token query result:", {
      hasData: !!tokenData,
      hasError: !!tokenError,
      errorMessage: tokenError?.message,
      tokenData: tokenData
        ? {
            id: tokenData.id,
            email: tokenData.email,
            expiresAt: tokenData.expiresAt,
            usedAt: tokenData.usedAt,
          }
        : null,
    });

    if (tokenError) {
      console.error("🔐 [VERIFY-CUSTOM] Token verification failed:", tokenError);
      return redirect("/login?error=invalid_token");
    }

    if (!tokenData) {
      console.log("🔐 [VERIFY-CUSTOM] Token not found");
      return redirect("/login?error=invalid_token");
    }

    // Check if token has already been used
    if (tokenData.usedAt) {
      console.log("🔐 [VERIFY-CUSTOM] Token has already been used:", tokenData.usedAt);
      return redirect("/login?error=token_already_used");
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);

    if (now > expiresAt) {
      console.log("🔐 [VERIFY-CUSTOM] Token has expired");
      return redirect("/login?error=token_expired");
    }

    console.log("🔐 [VERIFY-CUSTOM] Token is valid, proceeding with authentication");

    // Mark the token as used first
    const { error: updateError } = await supabaseAdmin
      .from("magicLinkTokens")
      .update({ usedAt: new Date().toISOString() })
      .eq("token", token);

    if (updateError) {
      console.error("🔐 [VERIFY-CUSTOM] Error marking token as used:", updateError);
    } else {
      console.log("🔐 [VERIFY-CUSTOM] Token marked as used");
    }

    // Custom authentication - create a session directly using Supabase admin
    console.log("🔐 [VERIFY-CUSTOM] Creating custom session for user...");

    // Get the current base URL for the redirect
    const { getBaseUrl } = await import("../../../lib/url-utils");
    const currentBaseUrl = getBaseUrl(request);

    // Get user data from Supabase using the correct admin API method
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      filter: { email: email },
    });

    if (userError || !userData.users || userData.users.length === 0) {
      console.error("🔐 [VERIFY-CUSTOM] Error getting user data:", userError);
      return redirect("/login?error=user_not_found");
    }

    const user = userData.users[0];
    console.log("🔐 [VERIFY-CUSTOM] User found, creating session...");

    // Create a custom session using Supabase admin - bypass magic link system entirely
    console.log("🔐 [VERIFY-CUSTOM] Creating custom session without magic links...");

    // Create custom session cookies
    const sessionToken = crypto.randomUUID();
    const sessionExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now

    // Set custom session cookies
    cookies.set("custom-session-token", sessionToken, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      expires: sessionExpiresAt,
    });

    cookies.set("custom-user-email", email, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      expires: sessionExpiresAt,
    });

    cookies.set("custom-user-id", user.id, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      expires: sessionExpiresAt,
    });

    console.log("🔐 [VERIFY-CUSTOM] Custom session cookies set successfully");

    // Redirect directly to the target URL
    const finalUrl = new URL(redirectPath, currentBaseUrl);
    console.log("🔐 [VERIFY-CUSTOM] Redirecting to:", finalUrl.toString());
    return redirect(finalUrl.toString());

    // Log the successful login
    try {
      await SimpleProjectLogger.logUserLogin(email, "magiclink_custom", {
        provider: "magiclink_custom",
        userAgent: request.headers.get("user-agent"),
        timestamp: new Date().toISOString(),
        redirectPath,
      });
      console.log("✅ [VERIFY-CUSTOM] Login event logged successfully");
    } catch (logError) {
      console.error("❌ [VERIFY-CUSTOM] Error logging login event:", logError);
    }

    console.log(
      "🔐 [VERIFY-CUSTOM] Custom magic link verification complete, redirecting to dashboard"
    );
    return redirect(finalUrl.toString());
  } catch (error) {
    console.error("🔐 [VERIFY-CUSTOM] Unexpected error in custom magic link verification:", error);
    return redirect("/login?error=verification_error");
  }
};
