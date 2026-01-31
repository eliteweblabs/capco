import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { SimpleProjectLogger } from "../../../lib/simple-logging";

/**
 * Send OTP (One-Time Password) via email
 *
 * POST Body:
 * - email: string
 * - type: "signup" | "magiclink" (default: "magiclink")
 *
 * Example:
 * - POST /api/auth/send-otp { "email": "user@example.com", "type": "magiclink" }
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, type = "magiclink" } = body;

    if (!email?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required field",
          details: "Email is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔐 [SEND-OTP] Sending OTP to:`, email);

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send OTP via email
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
        shouldCreateUser: type === "signup",
      },
    });

    if (error) {
      // Log failed attempt
      try {
        await SimpleProjectLogger.addLogEntry(
          0,
          "error",
          `OTP send failed: ${error.message} | ${email}`,
          { error: error.message, email }
        );
      } catch (logError) {
        console.error("Error logging failed OTP send:", logError);
      }

      return new Response(
        JSON.stringify({
          error: "Failed to send OTP",
          details: error.message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log successful OTP send
    try {
      await SimpleProjectLogger.addLogEntry(0, "info", `OTP sent to ${email}`, { email });
    } catch (logError) {
      console.error("Error logging OTP send:", logError);
    }

    console.log(`✅ [SEND-OTP] OTP sent successfully to:`, email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP sent successfully. Please check your email.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [SEND-OTP] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
