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
        await SimpleProjectLogger.logUserLogout(
          currentSession.user?.email || "Unknown",
          "magiclink_switch",
          {
            reason: "Different user logged in via magic link",
            newUser: email,
            timestamp: new Date().toISOString(),
          }
        );
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
      .from("magic_link_tokens")
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
            expires_at: tokenData.expires_at,
            used_at: tokenData.used_at,
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

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (now > expiresAt) {
      console.log("🔐 [VERIFY-CUSTOM] Token has expired");
      return redirect("/login?error=token_expired");
    }

    console.log("🔐 [VERIFY-CUSTOM] Token is valid, proceeding with authentication");

    // Use Supabase's built-in magic link system but with our custom token validation
    console.log("🔐 [VERIFY-CUSTOM] Generating Supabase magic link for authentication...");

    const { data: magicLinkData, error: magicLinkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email,
        options: {
          redirectTo: `${process.env.PUBLIC_SUPABASE_URL || "https://capcofire.com"}${redirectPath}`,
        },
      });

    if (magicLinkError) {
      console.error("🔐 [VERIFY-CUSTOM] Error generating magic link:", magicLinkError);
      return redirect("/login?error=session_error");
    }

    console.log("🔐 [VERIFY-CUSTOM] Magic link generated successfully");

    // Extract the actual magic link URL and redirect to it
    const magicLinkUrl = magicLinkData.properties.action_link;
    console.log("🔐 [VERIFY-CUSTOM] Redirecting to Supabase magic link:", magicLinkUrl);

    // Delete the used token before redirecting
    await supabaseAdmin.from("magic_link_tokens").delete().eq("token", token);

    console.log("🔐 [VERIFY-CUSTOM] Deleted used token");

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
      "🔐 [VERIFY-CUSTOM] Custom magic link verification complete, redirecting to Supabase magic link"
    );
    return redirect(magicLinkUrl);
  } catch (error) {
    console.error("🔐 [VERIFY-CUSTOM] Unexpected error in custom magic link verification:", error);
    return redirect("/login?error=verification_error");
  }
};
