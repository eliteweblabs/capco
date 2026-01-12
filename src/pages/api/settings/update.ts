---
/**
 * API Endpoint: Update Global Settings
 * Allows admins to update global company settings stored in database
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

if (!supabaseAdmin) {
  console.error("[settings/update] supabaseAdmin not available - check SUPABASE_SECRET env var");
}

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
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return new Response(JSON.stringify({ error: "Invalid settings data" }), {
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

    // Helper function to determine category and type
    function getCategoryAndType(key: string): { category: string; valueType: string } {
      if (key.includes("color")) {
        return { category: "colors", valueType: "color" };
      } else if (key.includes("logo")) {
        return { category: "logos", valueType: "svg" };
      } else if (key.includes("icon")) {
        return { category: "icons", valueType: "svg" };
      } else if (["company_name", "slogan", "address", "phone", "email", "website"].includes(key)) {
        return { category: "company", valueType: "text" };
      }
      return { category: "general", valueType: "text" };
    }

    // Update settings using upsert (more efficient)
    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      const { category, valueType } = getCategoryAndType(key);
      
      // Use upsert to insert or update in one operation
      const { error } = await supabaseAdmin
        .from("global_settings")
        .upsert({
          key,
          value: value as string,
          category,
          value_type: valueType,
          updated_by: currentUser.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "key",
        });

      if (error) {
        console.error(`Error upserting setting ${key}:`, error);
        updates.push({ key, success: false, error: error.message });
      } else {
        updates.push({ key, success: true });
      }
    }

    const allSuccess = updates.every((u) => u.success);

    // Clear cache after successful update
    if (allSuccess) {
      try {
        const { clearSettingsCache } = await import("../../../pages/api/global/global-company-data");
        clearSettingsCache();
      } catch (error) {
        console.warn("[settings/update] Failed to clear cache:", error);
      }
    }

    return new Response(
      JSON.stringify({
        success: allSuccess,
        updates,
        message: allSuccess ? "Settings updated successfully" : "Some settings failed to update",
      }),
      {
        status: allSuccess ? 200 : 207, // 207 Multi-Status
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[settings/update] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
