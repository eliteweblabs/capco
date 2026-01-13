import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/_api-optimization";
import { supabase } from "../../../../lib/supabase";

/**
 * DELETE PDF Template API
 *
 * DELETE /api/pdf/templates/[id]
 *
 * Deletes a PDF template
 */
export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    // Check authentication
    if (!supabase) {
      return createErrorResponse("Supabase client not initialized", 500);
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse("Authentication required", 401);
    }

    const templateId = params.id;
    if (!templateId) {
      return createErrorResponse("Template ID is required", 400);
    }

    console.log("📄 [PDF-TEMPLATES-DELETE] Deleting template:", templateId);

    // Delete the template
    const { error } = await supabase
      .from("pdfTemplates")
      .delete()
      .eq("id", templateId)
      .eq("authorId", user.id); // Ensure user owns the template

    if (error) {
      console.error("❌ [PDF-TEMPLATES-DELETE] Error deleting template:", error);
      return createErrorResponse("Failed to delete template", 500);
    }

    console.log("✅ [PDF-TEMPLATES-DELETE] Template deleted successfully:", templateId);

    return createSuccessResponse({
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("❌ [PDF-TEMPLATES-DELETE] Unexpected error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
