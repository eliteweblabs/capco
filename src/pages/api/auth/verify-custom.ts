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
        await SimpleProjectLogger.logUserLogout(currentSession.user?.email || "Unknown", "magiclink_switch", {
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
    
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('magic_link_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .single();

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

    // Get or create user
    let user;
    try {
      // Try to get existing user
      const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      
      if (getUserError && getUserError.message !== "User not found") {
        console.error("🔐 [VERIFY-CUSTOM] Error getting user:", getUserError);
        return redirect("/login?error=user_error");
      }

      if (existingUser) {
        user = existingUser;
        console.log("🔐 [VERIFY-CUSTOM] Found existing user:", user.id);
      } else {
        // Create new user
        console.log("🔐 [VERIFY-CUSTOM] Creating new user for:", email);
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          email_confirm: true,
        });

        if (createError) {
          console.error("🔐 [VERIFY-CUSTOM] Error creating user:", createError);
          return redirect("/login?error=user_creation_failed");
        }

        user = newUser;
        console.log("🔐 [VERIFY-CUSTOM] Created new user:", user.id);
      }
    } catch (error) {
      console.error("🔐 [VERIFY-CUSTOM] Error in user management:", error);
      return redirect("/login?error=user_error");
    }

    // Create a session for the user
    console.log("🔐 [VERIFY-CUSTOM] Creating session for user:", user.id);
    
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo: `${process.env.PUBLIC_SUPABASE_URL || 'https://capcofire.com'}${redirectPath}`,
      },
    });

    if (sessionError) {
      console.error("🔐 [VERIFY-CUSTOM] Error creating session:", sessionError);
      return redirect("/login?error=session_error");
    }

    // Extract session tokens from the generated link
    const sessionUrl = sessionData.properties.action_link;
    const sessionUrlObj = new URL(sessionUrl);
    const accessToken = sessionUrlObj.searchParams.get("access_token");
    const refreshToken = sessionUrlObj.searchParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      console.error("🔐 [VERIFY-CUSTOM] Failed to extract session tokens");
      return redirect("/login?error=session_error");
    }

    // Set auth cookies
    console.log("🔐 [VERIFY-CUSTOM] Setting auth cookies for user:", email);
    setAuthCookies(cookies, accessToken, refreshToken);

    // Delete the used token
    await supabaseAdmin
      .from('magic_link_tokens')
      .delete()
      .eq('token', token);

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

    console.log("🔐 [VERIFY-CUSTOM] Custom magic link verification complete, redirecting to:", redirectPath);
    return redirect(`${redirectPath}?message=welcome`);
  } catch (error) {
    console.error("🔐 [VERIFY-CUSTOM] Unexpected error in custom magic link verification:", error);
    return redirect("/login?error=verification_error");
  }
};
