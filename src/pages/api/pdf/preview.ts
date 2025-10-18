import type { APIRoute } from "astro";
import { createErrorResponse } from "../../../lib/_api-optimization";
import { supabase } from "../../../lib/supabase";

/**
 * PDF Preview API
 *
 * GET /api/pdf/preview?templateId=123&projectId=456
 *
 * Returns a preview of the PDF as HTML
 */
export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse("Authentication required", 401);
    }

    const templateId = url.searchParams.get("templateId");
    const projectId = url.searchParams.get("projectId");

    if (!templateId || !projectId) {
      return createErrorResponse("Template ID and Project ID are required", 400);
    }

    console.log("📄 [PDF-PREVIEW] Generating preview:", { templateId, projectId });

    // Get template
    const { data: template, error: templateError } = await supabase
      .from("pdfTemplates")
      .select("*")
      .eq("id", templateId)
      .eq("isActive", true)
      .single();

    if (templateError || !template) {
      console.error("❌ [PDF-PREVIEW] Template not found:", templateError);
      return createErrorResponse("Template not found", 404);
    }

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        *,
        authorProfile:authorId (
          id,
          companyName,
          email,
          phone
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("❌ [PDF-PREVIEW] Project not found:", projectError);
      return createErrorResponse("Project not found", 404);
    }

    // Get header and footer templates
    const { data: headerTemplate } = await supabase
      .from("pdfTemplates")
      .select("content")
      .eq("templateType", "header")
      .eq("isDefault", true)
      .eq("isActive", true)
      .single();

    const { data: footerTemplate } = await supabase
      .from("pdfTemplates")
      .select("content")
      .eq("templateType", "footer")
      .eq("isDefault", true)
      .eq("isActive", true)
      .single();

    // Generate HTML content
    const htmlContent = generatePreviewHTML(template, project, headerTemplate, footerTemplate);

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("❌ [PDF-PREVIEW] Unexpected error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

/**
 * Generate preview HTML content
 */
function generatePreviewHTML(
  template: any,
  project: any,
  headerTemplate: any,
  footerTemplate: any
) {
  const headerContent = headerTemplate?.content || "";
  const footerContent = footerTemplate?.content || "";

  // Replace placeholders in template content with project data
  let processedContent = template.content;

  // Common replacements
  const replacements = {
    "[PROJECT_NAME]": project.title || "",
    "[PROJECT_ADDRESS]": project.address || "",
    "[CLIENT_NAME]": project.authorProfile?.companyName || "",
    "[CLIENT_EMAIL]": project.authorProfile?.email || "",
    "[CLIENT_PHONE]": project.authorProfile?.phone || "",
    "[PROJECT_ID]": project.id || "",
    "[CURRENT_DATE]": new Date().toLocaleDateString(),
    "[CURRENT_TIME]": new Date().toLocaleTimeString(),
    "[CURRENT_YEAR]": new Date().getFullYear().toString(),
  };

  Object.entries(replacements).forEach(([placeholder, value]) => {
    processedContent = processedContent.replace(new RegExp(placeholder, "g"), value);
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PDF Preview - Project ${project.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .preview-container {
          max-width: 8.5in;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          min-height: 11in;
          position: relative;
        }
        .header {
          border-bottom: 2px solid #eee;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .footer {
          border-top: 1px solid #eee;
          padding: 20px;
          background-color: #f9f9f9;
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
        }
        .content {
          padding: 20px;
          margin-bottom: 100px; /* Space for footer */
        }
        .preview-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
        }
        .preview-info {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .preview-info h3 {
          margin: 0 0 10px 0;
          color: #1976d2;
        }
        .preview-info p {
          margin: 5px 0;
          color: #666;
        }
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .preview-container { box-shadow: none; }
          .preview-header { display: none; }
          .preview-info { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="preview-header">
        <h1>PDF Preview</h1>
        <p>Template: ${template.name} | Project: ${project.title}</p>
      </div>
      
      <div class="preview-info">
        <h3>Preview Information</h3>
        <p><strong>Template:</strong> ${template.name} (${template.templateType})</p>
        <p><strong>Project:</strong> ${project.title}</p>
        <p><strong>Client:</strong> ${project.authorProfile?.companyName || "N/A"}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="preview-container">
        <div class="header">
          ${headerContent}
        </div>
        
        <div class="content">
          ${processedContent}
        </div>
        
        <div class="footer">
          ${footerContent}
        </div>
      </div>
    </body>
    </html>
  `;
}
