import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { ensureProtocol } from "../../../lib/url-utils";

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
    const contentType = request.headers.get("content-type") || "";
    let resetData: ResetPasswordData;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      resetData = body;
    } else {
      const formData = await request.formData();
      resetData = {
        email: formData.get("email")?.toString()?.trim() || "",
        redirectTo: formData.get("redirectTo")?.toString(),
      };
    }

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

    // Send password reset email - use request URL
    const { getBaseUrl } = await import("../../../lib/url-utils");
    const baseUrl = getBaseUrl(request);
    const { error } = await supabase.auth.resetPasswordForEmail(resetData.email.trim(), {
      redirectTo: resetData.redirectTo || `${baseUrl}/auth/reset`,
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
