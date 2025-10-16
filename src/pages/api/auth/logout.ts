import type { APIRoute } from "astro";
import { clearAuthCookies } from "../../../lib/auth-cookies";
import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

/**
 * Standardized Auth LOGOUT API
 *
 * JSON API for programmatic logout (no redirects)
 * For form-based logout with redirects, use /api/auth/signout
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

    // Log logout before clearing cookies
    try {
      const { currentUser } = await checkAuth(cookies);
      if (currentUser?.email) {
        await SimpleProjectLogger.logUserLogout(currentUser.email, {
          userAgent: request.headers.get("user-agent"),
          timestamp: new Date().toISOString(),
        });
        console.log("✅ [AUTH-LOGOUT] Logout event logged successfully");
      }
    } catch (logError) {
      console.error("❌ [AUTH-LOGOUT] Error logging logout event:", logError);
      // Don't fail the logout flow if logging fails
    }

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

    // Clear auth cookies
    clearAuthCookies(cookies);

    console.log(`✅ [AUTH-LOGOUT] User logged out successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Logout successful",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
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
