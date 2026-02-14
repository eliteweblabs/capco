import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { SimpleProjectLogger } from "../../../lib/simple-logging";

/**
 * Verify OTP (One-Time Password) code
 *
 * POST Body:
 * - email: string
 * - token: string (6-digit OTP code)
 * - type: "email" | "sms" (default: "email")
 *
 * Example:
 * - POST /api/auth/verify-otp { "email": "user@example.com", "token": "123456" }
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, token, type = "email" } = body;

    if (!email?.trim() || !token?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "Email and token are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔐 [VERIFY-OTP] Verifying OTP for:`, email);

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: type as "email" | "sms",
    } as any);

    if (error) {
      // Log failed verification
      try {
        await SimpleProjectLogger.addLogEntry(
          0,
          "error",
          `OTP verification failed: ${error.message} | ${email}`,
          { error: error.message, email }
        );
      } catch (logError) {
        console.error("Error logging failed OTP verification:", logError);
      }

      return new Response(
        JSON.stringify({
          error: "Invalid or expired OTP",
          details: error.message,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!data.user || !data.session) {
      return new Response(
        JSON.stringify({
          error: "Verification failed",
          details: "No user or session returned",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log successful verification
    try {
      await SimpleProjectLogger.addLogEntry(
        0,
        "userLogin",
        `User logged in via OTP: ${data.user.email || email}`,
        {
          userId: data.user.id,
          userAgent: request.headers.get("user-agent"),
          ip: request.headers.get("x-forwarded-for") || "unknown",
          email: data.user.email || email,
        }
      );
    } catch (logError) {
      console.error("Error logging successful OTP verification:", logError);
    }

    // Set auth cookies
    const { access_token, refresh_token } = data.session;
    setAuthCookies(cookies, access_token, refresh_token);

    console.log(`✅ [VERIFY-OTP] User authenticated successfully:`, data.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
        message: "OTP verified successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [VERIFY-OTP] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
