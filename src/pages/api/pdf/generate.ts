import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { supabase } from "../../../lib/supabase";
import puppeteer from "puppeteer";
import {
  encryptPDF,
  EncryptionOptions,
  validateEncryptionOptions,
} from "../../../lib/pdf-encryption";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

/**
 * Generate PDF API
 *
 * POST /api/pdf/generate
 *
 * Generates a PDF from a template and project data
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse("Authentication required", 401);
    }

    const body = await request.json();
    const {
      templateId,
      projectId,
      pageSize = "8.5x11",
      orientation = "portrait",
      encryptionOptions,
    } = body;

    if (!templateId || !projectId) {
      return createErrorResponse("Template ID and Project ID are required", 400);
    }

    // Validate encryption options if provided
    if (encryptionOptions) {
      const validation = validateEncryptionOptions(encryptionOptions);
      if (!validation.valid) {
        return createErrorResponse(
          `Invalid encryption options: ${validation.errors.join(", ")}`,
          400
        );
      }
    }

    console.log("📄 [PDF-GENERATE] Generating PDF:", {
      templateId,
      projectId,
      pageSize,
      orientation,
    });

    // Get template
    const { data: template, error: templateError } = await supabase
      .from("pdfTemplates")
      .select("*")
      .eq("id", templateId)
      .eq("isActive", true)
      .single();

    if (templateError || !template) {
      console.error("❌ [PDF-GENERATE] Template not found:", templateError);
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
      console.error("❌ [PDF-GENERATE] Project not found:", projectError);
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
    const htmlContent = generateHTMLContent(template, project, headerTemplate, footerTemplate);

    // Optionally save HTML to local templates directory for preview purposes
    if (import.meta.env.SAVE_HTML_TEMPLATES === "true" || import.meta.env.SAVE_HTML_TEMPLATES === "1") {
      try {
        await saveHTMLTemplate(htmlContent, projectId, templateId, template.name);
      } catch (htmlSaveError) {
        // Don't fail the entire operation if HTML saving fails
        console.warn("⚠️ [PDF-GENERATE] Failed to save HTML template (non-fatal):", htmlSaveError);
      }
    }

    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFFromHTML(htmlContent, pageSize, orientation);

    // Apply encryption if requested
    let finalPdfBuffer = pdfBuffer;
    let encryptionMetadata = null;

    if (encryptionOptions) {
      console.log("🔐 [PDF-GENERATE] Applying encryption to PDF...");
      const encryptionResult = await encryptPDF(pdfBuffer, encryptionOptions);

      if (!encryptionResult.success) {
        console.error("❌ [PDF-GENERATE] Encryption failed:", encryptionResult.error);
        return createErrorResponse(`PDF encryption failed: ${encryptionResult.error}`, 500);
      }

      finalPdfBuffer = encryptionResult.encryptedBuffer!;
      encryptionMetadata = encryptionResult.metadata;
      console.log("✅ [PDF-GENERATE] PDF encrypted successfully");
    }

    // Save PDF to storage
    const fileName = `project-${projectId}-${Date.now()}.pdf`;
    const filePath = `pdfs/${projectId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("project-media")
      .upload(filePath, finalPdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ [PDF-GENERATE] Error uploading PDF:", uploadError);
      return createErrorResponse("Failed to save PDF", 500);
    }

    // Create generation job record
    const { data: jobData, error: jobError } = await supabase
      .from("pdfGenerationJobs")
      .insert({
        templateId,
        projectId,
        authorId: user.id,
        status: "completed",
        fileName,
        filePath,
        fileSize: finalPdfBuffer.length,
        generationData: {
          pageSize,
          orientation,
          templateName: template.name,
          encryption: encryptionMetadata,
        },
        completedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error("❌ [PDF-GENERATE] Error creating job record:", jobError);
    }

    // Get signed URL for download
    const { data: urlData, error: urlError } = await supabase.storage
      .from("project-media")
      .createSignedUrl(filePath, 3600);

    if (urlError) {
      console.error("❌ [PDF-GENERATE] Error creating signed URL:", urlError);
    }

    console.log("✅ [PDF-GENERATE] PDF generated successfully:", fileName);

    return createSuccessResponse({
      fileName,
      filePath,
      fileSize: finalPdfBuffer.length,
      downloadUrl: urlData?.signedUrl,
      jobId: jobData?.id,
      encrypted: !!encryptionMetadata?.encrypted,
      encryptionMetadata,
    });
  } catch (error) {
    console.error("❌ [PDF-GENERATE] Unexpected error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

/**
 * Generate HTML content from template and project data
 */
function generateHTMLContent(
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
      <title>Project ${project.id} - ${project.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .header {
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 40px;
          page-break-inside: avoid;
        }
        .content {
          margin: 20px 0;
        }
        @media print {
          body { margin: 0; }
          .header, .footer { position: fixed; }
          .header { top: 0; }
          .footer { bottom: 0; }
          .content { margin-top: 100px; margin-bottom: 100px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${headerContent}
      </div>
      
      <div class="content">
        ${processedContent}
      </div>
      
      <div class="footer">
        ${footerContent}
      </div>
    </body>
    </html>
  `;
}

/**
 * Save HTML template to local templates directory for preview purposes
 */
async function saveHTMLTemplate(
  htmlContent: string,
  projectId: number,
  templateId: number,
  templateName: string
): Promise<void> {
  try {
    const templatesDir = join(process.cwd(), "src", "components", "pdf-system", "templates");
    
    // Ensure directory exists
    await mkdir(templatesDir, { recursive: true });

    // Create a safe filename
    const safeTemplateName = templateName.replace(/[^a-zA-Z0-9]/g, "_");
    const timestamp = Date.now();
    const fileName = `project-${projectId}_template-${templateId}_${safeTemplateName}_${timestamp}.html`;
    const filePath = join(templatesDir, fileName);

    // Write HTML file
    await writeFile(filePath, htmlContent, "utf-8");

    console.log("✅ [PDF-GENERATE] HTML template saved locally:", fileName);
  } catch (error) {
    console.error("❌ [PDF-GENERATE] Error saving HTML template:", error);
    throw error;
  }
}

/**
 * Generate PDF from HTML using Puppeteer
 */
async function generatePDFFromHTML(htmlContent: string, pageSize: string, orientation: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Convert page size to Puppeteer format
    const pageSizeMap: { [key: string]: any } = {
      "8.5x11": { width: "8.5in", height: "11in" },
      A4: { width: "210mm", height: "297mm" },
      A3: { width: "297mm", height: "420mm" },
      "11x17": { width: "11in", height: "17in" },
    };

    const dimensions = pageSizeMap[pageSize] || pageSizeMap["8.5x11"];

    const pdfBuffer = await page.pdf({
      format: pageSize === "A4" ? "A4" : undefined,
      width: dimensions.width,
      height: dimensions.height,
      landscape: orientation === "landscape",
      printBackground: true,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    await browser.close();
    throw error;
  }
}
