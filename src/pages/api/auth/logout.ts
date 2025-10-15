import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

/**
 * Standardized Auth LOGOUT API
 *
 * POST Body: (optional)
 * - refreshToken?: string
 *
 * Example:
 * - POST /api/auth/logout
 * - POST /api/auth/logout { "refreshToken": "token123" }
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log(`🔐 [AUTH-LOGOUT] Processing logout request`);

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get refresh token from request body or cookies
    const body = await request.json().catch(() => ({}));
    const refreshToken = body.refreshToken || cookies.get("sb-refresh-token")?.value;

    // Sign out user
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("❌ [AUTH-LOGOUT] Logout failed:", error.message);
      return new Response(
        JSON.stringify({
          error: "Logout failed",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [AUTH-LOGOUT] User logged out successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Logout successful",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Clear auth cookies
          "Set-Cookie":
            "sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict",
        },
      }
    );
  } catch (error) {
    console.error("❌ [AUTH-LOGOUT] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
