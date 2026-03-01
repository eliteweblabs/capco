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

    console.log("[settings/update] Received request:", {
      settingsCount: settings ? Object.keys(settings).length : 0,
      settingsKeys: settings ? Object.keys(settings) : [],
      hasSupabaseAdmin: !!supabaseAdmin,
    });

    if (!settings || typeof settings !== "object") {
      console.error("[settings/update] Invalid settings data:", body);
      return new Response(JSON.stringify({ error: "Invalid settings data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      console.error("[settings/update] supabaseAdmin not available");
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
        return { category: "logos", valueType: key === "logoClasses" ? "text" : "svg" };
      } else if (key.includes("icon")) {
        return { category: "icons", valueType: "svg" };
      } else if (
        [
          "companyName",
          "slogan",
          "tightSlogan",
          "address",
          "phone",
          "email",
          "website",
          "virtualAssistantName",
        ].includes(key)
      ) {
        return { category: "company", valueType: "text" };
      } else if (key === "projectDefaultDueDateHours") {
        return { category: "project", valueType: "text" };
      } else if (key.startsWith("aiAgent_")) {
        return { category: "agent", valueType: "text" };
      }
      return { category: "general", valueType: "text" };
    }

    // Update settings using upsert (more efficient)
    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      const { category, valueType } = getCategoryAndType(key);

      try {
        // First, check if the setting exists (use maybeSingle to avoid error if not found)
        const { data: existing, error: checkError } = await supabaseAdmin
          .from("globalSettings")
          .select("id")
          .eq("key", key)
          .maybeSingle();

        if (checkError) {
          console.error(
            `[settings/update] Error checking for existing setting ${key}:`,
            checkError
          );
          throw checkError;
        }

        const settingData: any = {
          key,
          value: value as string,
          valueType,
          category,
          updatedAt: new Date().toISOString(),
        };

        // Only include updatedBy if currentUser.id exists and is valid UUID
        if (currentUser?.id) {
          settingData.updatedBy = currentUser.id;
        }

        console.log(`[settings/update] Setting data for ${key}:`, {
          ...settingData,
          value:
            settingData.value?.substring(0, 50) + (settingData.value?.length > 50 ? "..." : ""),
        });

        let error;
        if (existing) {
          // Update existing record
          console.log(`[settings/update] Updating existing setting: ${key}`);
          const { error: updateError } = await supabaseAdmin
            .from("globalSettings")
            .update(settingData)
            .eq("key", key);
          error = updateError;
        } else {
          // Insert new record
          console.log(`[settings/update] Inserting new setting: ${key}`);
          const { error: insertError } = await supabaseAdmin
            .from("globalSettings")
            .insert(settingData);
          error = insertError;
        }

        if (error) {
          console.error(
            `[settings/update] Error upserting setting ${key}:`,
            JSON.stringify(error, null, 2)
          );
          console.error(`[settings/update] Error type:`, typeof error);
          console.error(`[settings/update] Error keys:`, Object.keys(error || {}));

          // Extract error message from various possible formats
          let errorMessage = "Unknown error";
          let errorDetails = null;

          if (typeof error === "string") {
            errorMessage = error;
          } else if (error && typeof error === "object") {
            errorMessage = error.message || error.error || error.msg || JSON.stringify(error);
            errorDetails = error.details || error.hint || error.code || JSON.stringify(error);
          }

          updates.push({
            key,
            success: false,
            error: errorMessage,
            details: errorDetails,
          });
        } else {
          updates.push({ key, success: true });
        }
      } catch (err: any) {
        console.error(`[settings/update] Exception upserting setting ${key}:`, err);
        console.error(`[settings/update] Exception type:`, typeof err);
        console.error(`[settings/update] Exception stack:`, err?.stack);

        let errorMessage = "Unexpected error occurred";
        let errorDetails = null;

        if (err instanceof Error) {
          errorMessage = err.message;
          errorDetails = err.stack || err.toString();
        } else if (typeof err === "string") {
          errorMessage = err;
        } else if (err && typeof err === "object") {
          errorMessage = err.message || err.error || JSON.stringify(err);
          errorDetails = err.details || err.hint || err.code || JSON.stringify(err);
        }

        updates.push({
          key,
          success: false,
          error: errorMessage,
          details: errorDetails,
        });
      }
    }

    const allSuccess = updates.every((u) => u.success);

    // Clear cache after successful update
    if (allSuccess) {
      try {
        const { clearSettingsCache } = await import(
          "../../../pages/api/global/global-company-data"
        );
        clearSettingsCache();
      } catch (error) {
        console.warn("[settings/update] Failed to clear cache:", error);
      }
    }

    // Get failed updates for detailed error message
    const failedUpdates = updates.filter((u) => !u.success);
    const errorDetails =
      failedUpdates.length > 0
        ? failedUpdates
            .map((u) => `${u.key}: ${u.error}${u.details ? ` (${u.details})` : ""}`)
            .join("; ")
        : "";

    return new Response(
      JSON.stringify({
        success: allSuccess,
        updates,
        message: allSuccess
          ? "Settings updated successfully"
          : `Some settings failed to update. ${errorDetails}`,
        errorDetails: failedUpdates.length > 0 ? errorDetails : undefined,
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
