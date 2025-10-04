import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../lib/api-optimization";
import { checkAuth } from "../../lib/auth";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Get current user
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    if (!supabase) {
      return createErrorResponse("Database connection not available", 500);
    }

    const { projectId, message, internal = false, parentId = null } = body;

    // Validate required fields
    if (!projectId || !message) {
      return createErrorResponse("Project ID and message are required", 400);
    }

    console.log("🔔 [ADD-PUNCHLIST] Adding punchlist item:", {
      projectId,
      message: message.substring(0, 50) + "...",
      internal,
      parentId,
      userId: currentUser.id,
    });

    // Get company name from currentUser profile (no redundant database call)
    const companyName =
      currentUser.profile?.company_name ||
      (currentUser.profile?.first_name && currentUser.profile?.last_name
        ? `${currentUser.profile.first_name} ${currentUser.profile.last_name}`
        : "Unknown User");

    // Insert punchlist item
    const { data: punchlistData, error: punchlistError } = await supabase
      .from("punchlist")
      .insert({
        project_id: projectId,
        author_id: currentUser.id,
        message,
        internal,
        parent_id: parentId,
        company_name: companyName,
      })
      .select("*")
      .single();

    if (punchlistError) {
      console.error("❌ [ADD-PUNCHLIST] Database error:", punchlistError);
      return new Response(
        JSON.stringify({
          error: "Failed to create punchlist item",
          details: punchlistError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ [ADD-PUNCHLIST] Punchlist item created successfully:", punchlistData.id);

    // Log the punchlist item creation
    try {
      await SimpleProjectLogger.addLogEntry(
        projectId,
        "punchlist_added",
        `Punchlist item added: ${message.substring(0, 50)}...`,
        { punchlistId: punchlistData.id, message: message.substring(0, 100) }
      );
    } catch (logError) {
      console.error("Error logging punchlist creation:", logError);
    }

    return createSuccessResponse(
      { punchlist: punchlistData },
      "Punchlist item created successfully"
    );
  } catch (error) {
    console.error("❌ [ADD-PUNCHLIST] Unexpected error:", error);
    return createErrorResponse(error instanceof Error ? error.message : "Unknown error", 500);
  }
};
