import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  console.log("Email verification started");

  // Check if Supabase is configured
  if (!supabase) {
    console.error("Supabase is not configured");
    return redirect("/login?error=verification_error");
  }

  // Get the verification code from the URL
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  console.log("Verification params:", {
    code: code ? "present" : "missing",
    token_hash: token_hash ? "present" : "missing",
    type,
  });

  if (!code && !token_hash) {
    console.log("No verification code or token hash provided");
    return redirect("/login?error=no_token");
  }

  try {
    let verificationResult;

    if ((type === "email" || type === "magiclink") && token_hash) {
      // Handle email verification with token hash (newer Supabase format)
      console.log("Attempting email verification with token hash...");
      verificationResult = await supabase.auth.verifyOtp({
        token_hash,
        type: type === "magiclink" ? "magiclink" : "email",
      });
    } else if (code) {
      // Handle verification with code (legacy or other format)
      console.log("Attempting verification with code...");
      verificationResult = await supabase.auth.exchangeCodeForSession(code);
    } else {
      console.log("Invalid verification parameters");
      return redirect("/login?error=no_token");
    }

    const { data, error } = verificationResult;

    if (error) {
      console.error("Email verification error:", error);
      console.error("Error details:", {
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

    console.log("Email verification successful:", !!data.session);

    if (!data.session) {
      console.log("No session created after verification");
      return redirect("/login?message=verification_success");
    }

    // Profile will be automatically created by database trigger

    const { access_token, refresh_token } = data.session;
    console.log("Setting auth cookies for verified user");

    // Use shared utility for consistent cookie handling
    setAuthCookies(cookies, access_token, refresh_token);

    console.log("Email verification complete, redirecting to dashboard");
    return redirect("/dashboard?message=welcome");
  } catch (error) {
    console.error("Unexpected error in email verification:", error);
    return redirect("/login?error=verification_error");
  }
};
