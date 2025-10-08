import type { APIRoute } from "astro";
import { setAuthCookies, clearAuthCookies, getCurrentSession } from "../../../lib/auth-cookies";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { SimpleProjectLogger } from "../../../lib/simple-logging";

export const GET: APIRoute = async ({ url, cookies, redirect, request }) => {
  console.log("🔐 [VERIFY] Email verification started");

  // Check if Supabase is configured
  if (!supabase) {
    console.error("🔐 [VERIFY] Regular Supabase client not available");
    return redirect("/login?error=verification_error");
  }

  // Check if Supabase admin is configured
  if (!supabaseAdmin) {
    console.error("🔐 [VERIFY] Supabase admin client not available");
    console.error("🔐 [VERIFY] Environment check:", {
      hasSupabaseUrl: !!import.meta.env.SUPABASE_URL,
      hasServiceRoleKey: !!import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: import.meta.env.SUPABASE_URL ? "present" : "missing",
      serviceRoleKey: import.meta.env.SUPABASE_SERVICE_ROLE_KEY ? "present" : "missing",
    });
    return redirect("/login?error=verification_error");
  }

  // Get the verification parameters from the URL
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const token = url.searchParams.get("token");
  const type = url.searchParams.get("type");
  const email = url.searchParams.get("email");
  const redirectPath = url.searchParams.get("redirect") || "/dashboard";

  console.log("🔐 [VERIFY] Verification params:", {
    hasCode: !!code,
    hasTokenHash: !!token_hash,
    hasToken: !!token,
    type,
    redirectPath,
  });

  if (!code && !token_hash && !token) {
    console.log("🔐 [VERIFY] No verification code, token hash, or token provided");
    return redirect("/login?error=no_token");
  }

  try {
    let verificationResult;

    if (code) {
      // Handle OAuth/PKCE flow with code
      console.log("🔐 [VERIFY] Attempting verification with code...");
      verificationResult = await supabase.auth.exchangeCodeForSession(code);
    } else if (token_hash && type === "magiclink") {
      // Handle magic link with token_hash (the working way)
      console.log("🔐 [VERIFY] Attempting magiclink verification with token hash...");
      verificationResult = await supabase.auth.verifyOtp({
        token_hash: token_hash,
        type: "magiclink",
      });
    } else if (token && type === "magiclink" && email) {
      // Handle magic link with token and email - use admin client to verify
      console.log(
        "🔐 [VERIFY] Attempting magiclink verification with token and email using admin client..."
      );

      if (!supabaseAdmin) {
        console.error("🔐 [VERIFY] Supabase admin client not available");
        return redirect("/login?error=verification_error");
      }

      // Use the admin client to verify the magic link with email
      verificationResult = await supabaseAdmin.auth.verifyOtp({
        token: token,
        type: "magiclink",
        email: email,
      });
    } else if (token && type === "email" && email) {
      // Handle magic link with token and email using type=email (Supabase's expected format)
      console.log(
        "🔐 [VERIFY] Attempting email verification with token and email using admin client..."
      );

      if (!supabaseAdmin) {
        console.error("🔐 [VERIFY] Supabase admin client not available");
        return redirect("/login?error=verification_error");
      }

      // Use the admin client to verify the magic link with email
      verificationResult = await supabaseAdmin.auth.verifyOtp({
        token: token,
        type: "email",
        email: email,
      });

      console.log("🔐 [VERIFY] Magic link verification result:", {
        hasError: !!verificationResult.error,
        errorMessage: verificationResult.error?.message,
        hasData: !!verificationResult.data,
        hasSession: !!verificationResult.data?.session,
        hasUser: !!verificationResult.data?.user,
      });
    } else if (token_hash && type) {
      // Handle other verification types with token_hash
      console.log(`🔐 [VERIFY] Attempting ${type} verification with token hash...`);
      verificationResult = await supabase.auth.verifyOtp({
        token_hash: token_hash,
        type: type,
      });
    } else {
      console.log("🔐 [VERIFY] Invalid verification parameters");
      return redirect("/login?error=no_token");
    }

    const { data, error } = verificationResult;

    console.log("🔐 [VERIFY] Verification result:", {
      hasError: !!error,
      errorMessage: error?.message,
      hasData: !!data,
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      userEmail: data?.user?.email,
    });

    if (error) {
      console.error("🔐 [VERIFY] Verification error:", error.message);
      console.error("🔐 [VERIFY] Error details:", {
        message: error.message,
        status: error.status,
        code: error.code,
      });

      // Handle specific error cases
      if (error.code === "otp_expired") {
        return redirect("/login?error=token_expired");
      } else if (error.code === "invalid_token") {
        return redirect("/login?error=invalid_token");
      } else {
        return redirect("/login?error=verification_failed");
      }
    }

    console.log("🔐 [VERIFY] Verification successful:", {
      hasSession: !!data.session,
      hasUser: !!data.user,
      userEmail: data.user?.email,
      sessionData: data.session
        ? {
            access_token: data.session.access_token ? "present" : "missing",
            refresh_token: data.session.refresh_token ? "present" : "missing",
            expires_at: data.session.expires_at,
            user_id: data.session.user?.id,
          }
        : null,
      userData: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at,
          }
        : null,
    });

    if (!data.session) {
      console.log("🔐 [VERIFY] No session created after verification - this is the problem!");
      console.log("🔐 [VERIFY] Full verification result:", JSON.stringify(data, null, 2));
      return redirect("/login?message=verification_success");
    }

    // Check for existing session and log out if different user
    const currentSession = await getCurrentSession(cookies);
    const newUserEmail = data.user?.email;

    console.log("🔐 [VERIFY] Session management check:", {
      hasCurrentSession: !!currentSession,
      currentUserEmail: currentSession?.user?.email,
      newUserEmail: newUserEmail,
      isDifferentUser: currentSession && currentSession.user?.email !== newUserEmail,
    });

    if (currentSession && currentSession.user?.email !== newUserEmail) {
      console.log("🔐 [VERIFY] Different user detected, logging out previous session:", {
        previousUser: currentSession.user?.email,
        newUser: newUserEmail,
      });

      // Log the logout of the previous user
      try {
        await SimpleProjectLogger.logUserLogout(
          currentSession.user?.email || "Unknown",
          "magiclink_switch",
          {
            reason: "Different user logged in via magic link",
            newUser: newUserEmail,
            timestamp: new Date().toISOString(),
          }
        );
        console.log("✅ [VERIFY] Previous user logout logged successfully");
      } catch (logError) {
        console.error("❌ [VERIFY] Error logging previous user logout:", logError);
      }

      // Clear existing auth cookies
      clearAuthCookies(cookies);
      console.log("🔐 [VERIFY] Cleared previous user's auth cookies");
    } else if (currentSession && currentSession.user?.email === newUserEmail) {
      console.log("🔐 [VERIFY] Same user detected, no logout needed:", {
        userEmail: newUserEmail,
      });
    } else {
      console.log("🔐 [VERIFY] No existing session found, proceeding with new login");
    }

    // Set auth cookies for the new user
    const { access_token, refresh_token } = data.session;
    console.log("🔐 [VERIFY] Setting auth cookies for verified user:", data.user?.email);
    setAuthCookies(cookies, access_token, refresh_token);

    // Log the successful login
    try {
      await SimpleProjectLogger.logUserLogin(data.user?.email || "Unknown", "magiclink", {
        provider: "magiclink",
        userAgent: request.headers.get("user-agent"),
        timestamp: new Date().toISOString(),
        redirectPath,
      });
      console.log("✅ [VERIFY] Login event logged successfully");
    } catch (logError) {
      console.error("❌ [VERIFY] Error logging login event:", logError);
      // Don't fail the auth flow if logging fails
    }

    console.log("🔐 [VERIFY] Email verification complete, redirecting to:", redirectPath);
    return redirect(`${redirectPath}?message=welcome`);
  } catch (error) {
    console.error("🔐 [VERIFY] Unexpected error in email verification:", error);
    return redirect("/login?error=verification_error");
  }
};
