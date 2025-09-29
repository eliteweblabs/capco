import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import puppeteer from "puppeteer";

// Function to convert HTML to PDF
async function convertHtmlToPdf(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      projectId,
      templateId,
      documentName,
      selectedComponents = [],
      customPlaceholders = {},
    } = body;

    if (!projectId || !templateId || !documentName) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Project ID, template ID, and document name are required",
        }),
        { status: 400 }
      );
    }

    console.log(`📄 [PDF-GENERATE] Starting PDF generation for project ${projectId}`);

    try {
      // Read templates configuration
      const templatesConfigPath = join(process.cwd(), "src/templates/pdf/templates.json");
      const templatesConfig = JSON.parse(readFileSync(templatesConfigPath, "utf-8"));

      // Find the template
      const templateConfig = templatesConfig.templates.find((t: any) => t.id === templateId);
      if (!templateConfig) {
        throw new Error("Template not found");
      }

      // Use the assemble API to get the assembled template
      const assembleUrl = `${request.url.split("/api")[0]}/api/pdf/assemble?templateId=${templateId}&projectId=${projectId}&mode=pdf`;
      console.log(`📄 [PDF-GENERATE] Calling assemble API: ${assembleUrl}`);

      const assembleResponse = await fetch(assembleUrl);

      if (!assembleResponse.ok) {
        const errorText = await assembleResponse.text();
        console.error(
          `❌ [PDF-GENERATE] Assemble API failed: ${assembleResponse.status} - ${errorText}`
        );
        throw new Error(`Failed to assemble template: ${assembleResponse.status} - ${errorText}`);
      }

      const templateHtml = await assembleResponse.text();
      console.log(`✅ [PDF-GENERATE] Got assembled template, length: ${templateHtml.length}`);

      // The assemble API already handles all placeholder replacement and component assembly
      // No additional processing needed - templateHtml is already fully assembled

      console.log(`✅ [PDF-GENERATE] Template assembled successfully, returning HTML for preview`);

      return new Response(
        JSON.stringify({
          success: true,
          document: {
            id: `preview_${Date.now()}`,
            name: documentName,
            htmlContent: templateHtml, // Return HTML for preview only
            templateId: templateId,
            projectId: projectId,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error: any) {
      console.error("❌ [PDF-GENERATE] Error during generation:", error);

      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to generate PDF",
          error: error.message,
        }),
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ [PDF-GENERATE] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "An unexpected error occurred",
        error: error.message,
      }),
      { status: 500 }
    );
  }
};
