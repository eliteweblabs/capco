import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../lib/api-optimization";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get current user
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    // Check permissions - only Admin and Staff can save contracts
    const userRole = currentUser.profile?.role?.toLowerCase();
    if (userRole !== "admin" && userRole !== "staff") {
      return createErrorResponse("Access denied", 403);
    }

    const body = await request.json();
    const { projectId, contractHtml } = body;

    if (!projectId) {
      return createErrorResponse("Project ID is required", 400);
    }

    if (!supabase) {
      return createErrorResponse("Database not configured", 500);
    }

    // Update project with contract HTML
    console.log("💾 [SAVE-PROJECT-CONTRACT] Saving contract for project:", projectId);
    console.log("💾 [SAVE-PROJECT-CONTRACT] Contract HTML length:", contractHtml?.length || 0);

    const { data: updatedProject, error } = await supabase
      .from("projects")
      .update({ contract_html: contractHtml })
      .eq("id", projectId)
      .select("id, title, contract_html")
      .single();

    if (error) {
      console.error("❌ [SAVE-PROJECT-CONTRACT] Database error:", error);
      console.error("❌ [SAVE-PROJECT-CONTRACT] Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return createErrorResponse(`Failed to save project contract: ${error.message}`, 500);
    }

    console.log("✅ [SAVE-PROJECT-CONTRACT] Contract saved for project:", projectId);

    return createSuccessResponse(
      {
        projectId: updatedProject.id,
        title: updatedProject.title,
        contractHtml: updatedProject.contract_html,
        hasCustomContract: !!updatedProject.contract_html,
      },
      "Project contract saved successfully"
    );
  } catch (error) {
    console.error("❌ [SAVE-PROJECT-CONTRACT] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
