import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/_api-optimization";
import { supabase } from "../../../../lib/supabase";

/**
 * Upsert PDF Template API
 *
 * POST /api/pdf/templates/upsert
 *
 * Creates or updates a PDF template
 */
export const POST: APIRoute = async ({ request, cookies }) => {
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

    const body = await request.json();
    const {
      id,
      name,
      description,
      content,
      templateType = "body",
      pageSize = "8.5x11",
      margins = { top: "1in", right: "1in", bottom: "1in", left: "1in" },
    } = body;

    if (!name || !content) {
      return createErrorResponse("Name and content are required", 400);
    }

    console.log("📄 [PDF-TEMPLATES-UPSERT] Upserting template:", { id, name, templateType });

    const templateData = {
      name,
      description: description || "",
      content,
      templateType,
      pageSize,
      margins,
      authorId: user.id,
      updatedAt: new Date().toISOString(),
    };

    let result;
    if (id) {
      // Update existing template
      if (!supabase) {
        return createErrorResponse("Supabase client not initialized", 500);
      }
      const { data, error } = await supabase
        .from("pdfTemplates")
        .update(templateData)
        .eq("id", id)
        .eq("authorId", user.id)
        .select()
        .single();

      if (error) {
        console.error("❌ [PDF-TEMPLATES-UPSERT] Error updating template:", error);
        return createErrorResponse("Failed to update template", 500);
      }

      result = data;
      console.log("✅ [PDF-TEMPLATES-UPSERT] Template updated:", data.id);
    } else {
      // Create new template
      if (!supabase) {
        return createErrorResponse("Supabase client not initialized", 500);
      }
      const { data, error } = await supabase
        .from("pdfTemplates")
        .insert({
          ...templateData,
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("❌ [PDF-TEMPLATES-UPSERT] Error creating template:", error);
        return createErrorResponse("Failed to create template", 500);
      }

      result = data;
      console.log("✅ [PDF-TEMPLATES-UPSERT] Template created:", data.id);
    }

    return createSuccessResponse({
      template: result,
      message: id ? "Template updated successfully" : "Template created successfully",
    });
  } catch (error) {
    console.error("❌ [PDF-TEMPLATES-UPSERT] Unexpected error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
