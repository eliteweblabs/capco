import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  console.log("🔐 [VERIFY] Email verification started");

  // Check if Supabase is configured
  if (!supabase) {
    console.error("🔐 [VERIFY] Supabase is not configured");
    return redirect("/login?error=verification_error");
  }

  // First, clear any existing session to prevent conflicts
  try {
    console.log("🔐 [VERIFY] Clearing any existing session before magic link verification");
    await supabase.auth.signOut();

    // Clear existing auth cookies
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });
  } catch (logoutError) {
    console.warn(
      "🔐 [VERIFY] Could not clear existing session (may not be logged in):",
      logoutError
    );
  }

  // Get the verification code from the URL
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const redirectPath = url.searchParams.get("redirect") || "/dashboard";

  console.log("🔐 [VERIFY] Verification params:", {
    code: code ? "present" : "missing",
    token_hash: token_hash ? "present" : "missing",
    type,
    redirectPath,
    fullUrl: url.toString(),
  });

  if (!code && !token_hash) {
    console.log("🔐 [VERIFY] No verification code or token hash provided");
    return redirect("/login?error=no_token");
  }

  try {
    let verificationResult;

    if ((type === "email" || type === "magiclink" || type === "signup") && token_hash) {
      // Handle magic link or email verification with token hash (newer Supabase format)
      console.log(`🔐 [VERIFY] Attempting ${type} verification with token hash...`);

      // Map type to what Supabase expects
      const otpType = type === "magiclink" ? "magiclink" : type === "signup" ? "signup" : "email";

      verificationResult = await supabase.auth.verifyOtp({
        token_hash,
        type: otpType,
      });
    } else if (code) {
      // Handle verification with code (OAuth or PKCE flow)
      console.log("🔐 [VERIFY] Attempting verification with code...");
      verificationResult = await supabase.auth.exchangeCodeForSession(code);
    } else {
      console.log("🔐 [VERIFY] Invalid verification parameters");
      return redirect("/login?error=no_token");
    }

    const { data, error } = verificationResult;

    if (error) {
      console.error("🔐 [VERIFY] Email verification error:", error);
      console.error("🔐 [VERIFY] Error details:", {
        message: error.message,
        status: error.status,
      });

      // Handle specific error types
      if (error.message.includes("expired")) {
        return redirect("/login?error=verification_expired");
      } else if (error.message.includes("invalid")) {
        return redirect("/login?error=verification_invalid");
      }

      return redirect("/login?error=verification_failed");
    }

    console.log("🔐 [VERIFY] Verification successful:", {
      hasSession: !!data.session,
      hasUser: !!data.user,
      userEmail: data.user?.email,
    });

    if (!data.session) {
      console.log("🔐 [VERIFY] No session created after verification");
      return redirect("/login?message=verification_success");
    }

    // Profile will be automatically created by database trigger

    const { access_token, refresh_token } = data.session;
    console.log("🔐 [VERIFY] Setting auth cookies for verified user:", data.user?.email);

    // Use shared utility for consistent cookie handling
    setAuthCookies(cookies, access_token, refresh_token);

    console.log("🔐 [VERIFY] Email verification complete, redirecting to:", redirectPath);
    return redirect(`${redirectPath}?message=welcome`);
  } catch (error) {
    console.error("🔐 [VERIFY] Unexpected error in email verification:", error);
    return redirect("/login?error=verification_error");
  }
};
