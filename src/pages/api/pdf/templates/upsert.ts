import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/_api-optimization";
import { supabase } from "../../../../lib/supabase";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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
      saveHtml = false, // Checkbox value from UI
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

    // Save HTML version to templates directory if checkbox is checked
    if (saveHtml && content) {
      try {
        await saveHTMLTemplateToFile(content, result.id, name);
      } catch (htmlSaveError) {
        // Don't fail the entire operation if HTML saving fails
        console.warn("⚠️ [PDF-TEMPLATES-UPSERT] Failed to save HTML template (non-fatal):", htmlSaveError);
      }
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

/**
 * Save HTML template to local templates directory
 */
async function saveHTMLTemplateToFile(
  htmlContent: string,
  templateId: number,
  templateName: string
): Promise<void> {
  try {
    const templatesDir = join(process.cwd(), "src", "components", "pdf-system", "templates");
    
    // Ensure directory exists
    await mkdir(templatesDir, { recursive: true });

    // Create a safe filename - use template name as primary identifier for easier searching
    // Replace spaces and special chars with hyphens for better readability
    const safeTemplateName = templateName
      .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special chars except spaces and hyphens
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .toLowerCase()
      .trim();
    
    // Use template name as primary identifier, with ID and timestamp as suffix for uniqueness
    const fileName = `${safeTemplateName}_template-${templateId}_${Date.now()}.html`;
    const filePath = join(templatesDir, fileName);

    // Write HTML file
    await writeFile(filePath, htmlContent, "utf-8");

    console.log("✅ [PDF-TEMPLATES-UPSERT] HTML template saved locally:", fileName);
  } catch (error) {
    console.error("❌ [PDF-TEMPLATES-UPSERT] Error saving HTML template:", error);
    throw error;
  }
}
