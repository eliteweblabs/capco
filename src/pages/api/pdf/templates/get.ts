import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/_api-optimization";
import { supabase } from "../../../../lib/supabase";

/**
 * Get PDF Templates API
 *
 * GET /api/pdf/templates/get
 *
 * Returns all PDF templates for the current user
 */
export const GET: APIRoute = async ({ cookies }) => {
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

    console.log("📄 [PDF-TEMPLATES-GET] Fetching templates for user:", user.id);

    // Get templates
    const { data: templates, error: templatesError } = await supabase
      .from("pdfTemplates")
      .select("*")
      .eq("isActive", true)
      .order("createdAt", { ascending: false });

    if (templatesError) {
      console.error("❌ [PDF-TEMPLATES-GET] Error fetching templates:", templatesError);
      return createErrorResponse("Failed to fetch templates", 500);
    }

    console.log(`✅ [PDF-TEMPLATES-GET] Found ${templates?.length || 0} templates`);

    return createSuccessResponse({
      templates: templates || [],
      count: templates?.length || 0,
    });
  } catch (error) {
    console.error("❌ [PDF-TEMPLATES-GET] Unexpected error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
