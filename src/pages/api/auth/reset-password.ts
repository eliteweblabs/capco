import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

/**
 * Standardized Auth RESET PASSWORD API
 *
 * POST Body:
 * - email: string
 * - redirectTo?: string (optional redirect URL)
 *
 * Example:
 * - POST /api/auth/reset-password { "email": "user@example.com" }
 * - POST /api/auth/reset-password { "email": "user@example.com", "redirectTo": "https://app.example.com/reset" }
 */

interface ResetPasswordData {
  email: string;
  redirectTo?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const resetData: ResetPasswordData = body;

    if (!resetData.email?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "Email is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔐 [AUTH-RESET-PASSWORD] Password reset requested for:`, resetData.email);

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(resetData.email.trim(), {
      redirectTo:
        resetData.redirectTo || `${import.meta.env.RAILWAY_PUBLIC_DOMAIN}/auth/reset-password`,
    });

    if (error) {
      console.error("❌ [AUTH-RESET-PASSWORD] Password reset failed:", error.message);
      return new Response(
        JSON.stringify({
          error: "Password reset failed",
          details: error.message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [AUTH-RESET-PASSWORD] Password reset email sent successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset email sent successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [AUTH-RESET-PASSWORD] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
