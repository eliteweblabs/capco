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
  const token = url.searchParams.get("token"); // Also check for 'token' parameter
  const type = url.searchParams.get("type");
  const redirectPath = url.searchParams.get("redirect") || "/dashboard";

  console.log("🔐 [VERIFY] Verification params:", {
    code: code ? "present" : "missing",
    token_hash: token_hash ? "present" : "missing",
    token: token ? "present" : "missing",
    type,
    redirectPath,
    fullUrl: url.toString(),
  });

  // Log the actual token values for debugging (truncated for security)
  if (token_hash) {
    console.log("🔐 [VERIFY] Token hash (first 10 chars):", token_hash.substring(0, 10) + "...");
    console.log("🔐 [VERIFY] Token hash length:", token_hash.length);
  }
  if (token) {
    console.log("🔐 [VERIFY] Token (first 10 chars):", token.substring(0, 10) + "...");
    console.log("🔐 [VERIFY] Token length:", token.length);
  }

  if (!code && !token_hash && !token) {
    console.log("🔐 [VERIFY] No verification code, token hash, or token provided");
    return redirect("/login?error=no_token");
  }

  try {
    let verificationResult;

    if ((type === "email" || type === "magiclink" || type === "signup") && (token_hash || token)) {
      // Handle magic link or email verification with token hash or token
      console.log(
        `🔐 [VERIFY] Attempting ${type} verification with ${token_hash ? "token_hash" : "token"}...`
      );

      // Map type to what Supabase expects
      const otpType = type === "magiclink" ? "magiclink" : type === "signup" ? "signup" : "email";

      // Use token_hash if available, otherwise use token
      const verificationToken = token_hash || token;

      verificationResult = await supabase.auth.verifyOtp({
        token_hash: verificationToken as string,
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
        code: error.code,
      });

      // Log token details for debugging
      console.error("🔐 [VERIFY] Token details for debugging:", {
        hasToken: !!token,
        hasTokenHash: !!token_hash,
        tokenLength: token?.length || 0,
        tokenHashLength: token_hash?.length || 0,
        type,
      });

      // Handle specific error types
      if (error.message.includes("expired") || error.message.includes("Expired")) {
        console.log("🔐 [VERIFY] Token expired");
        return redirect("/login?error=verification_expired");
      } else if (error.message.includes("invalid") || error.message.includes("Invalid")) {
        console.log(
          "🔐 [VERIFY] Invalid token - possible Resend tracking interference or malformed token"
        );
        console.log("🔐 [VERIFY] Full error:", error);
        return redirect("/login?error=verification_invalid");
      } else if (error.message.includes("token") || error.message.includes("Token")) {
        console.log("🔐 [VERIFY] Token-related error:", error.message);
        return redirect("/login?error=token_error");
      } else if (error.message.includes("missing") || error.message.includes("Missing")) {
        console.log("🔐 [VERIFY] Missing token error:", error.message);
        return redirect("/login?error=no_token");
      }

      console.log("🔐 [VERIFY] General verification error:", error.message);
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
