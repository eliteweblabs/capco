/**
 * API Endpoint: Clear Global Settings
 * Allows admins to delete settings from database to fall back to environment variables
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const userRole = currentUser.profile?.role;
    if (userRole !== "Admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { keys } = body;

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid keys array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete settings
    const { error } = await supabaseAdmin
      .from("global_settings")
      .delete()
      .in("key", keys);

    if (error) {
      console.error("[settings/clear] Error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Clear cache
    try {
      const { clearSettingsCache } = await import("../../../pages/api/global/global-company-data");
      clearSettingsCache();
    } catch (error) {
      console.warn("[settings/clear] Failed to clear cache:", error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleared ${keys.length} setting(s). They will now use environment variable values.`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[settings/clear] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
