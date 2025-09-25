import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import puppeteer from "puppeteer";
import { saveMedia } from "../../../lib/media";

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

      // Read template HTML content
      const templatePath = join(process.cwd(), "src/templates/pdf", templateConfig.file);
      const templateHtml = readFileSync(templatePath, "utf-8");

      // Fetch project data and placeholders
      const dataResponse = await fetch(
        `${request.url.split("/api")[0]}/api/pdf/data?projectId=${projectId}`
      );
      const dataResult = await dataResponse.json();

      if (!dataResult.success) {
        throw new Error("Failed to fetch project data");
      }

      const { placeholders } = dataResult.data;

      // Merge custom placeholders
      const allPlaceholders = { ...placeholders, ...customPlaceholders };

      // Fetch selected components from files
      let components = [];
      if (selectedComponents.length > 0) {
        const componentConfigs = templatesConfig.components.filter((c: any) =>
          selectedComponents.includes(c.id)
        );

        components = componentConfigs.map((comp: any) => {
          const componentPath = join(process.cwd(), "src/templates/pdf", comp.file);
          const htmlContent = readFileSync(componentPath, "utf-8");

          return {
            id: comp.id,
            name: comp.name,
            component_type: comp.type,
            html_content: htmlContent,
          };
        });
      }

      // Replace placeholders in template HTML
      let htmlContent = templateHtml;

      // Replace all placeholders
      Object.entries(allPlaceholders).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        htmlContent = htmlContent.replace(new RegExp(placeholder, "g"), String(value || ""));
      });

      // Insert components into template
      const componentGroups = {
        header: components.filter((c: any) => c.component_type === "header"),
        content: components.filter(
          (c: any) => c.component_type === "section" || c.component_type === "content"
        ),
        footer: components.filter((c: any) => c.component_type === "footer"),
      };

      // Replace component placeholders
      Object.entries(componentGroups).forEach(([type, comps]) => {
        const placeholder = `[${type.toUpperCase()} COMPONENTS]`;
        const componentHTML = comps
          .map((comp: any) => {
            let compHTML = comp.html_content;
            // Replace placeholders in component HTML
            Object.entries(allPlaceholders).forEach(([key, value]) => {
              const placeholder = `{{${key}}}`;
              compHTML = compHTML.replace(new RegExp(placeholder, "g"), String(value || ""));
            });
            return compHTML;
          })
          .join("\n");

        htmlContent = htmlContent.replace(placeholder, componentHTML);
      });

      // Generate a unique document ID
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileName = `${documentName.replace(/[^a-zA-Z0-9]/g, "_")}_${documentId}.pdf`;
      const filePath = `${projectId}/documents/${fileName}`;

      console.log(`📁 [PDF-GENERATE] Converting HTML to PDF and saving to storage: ${filePath}`);

      // Convert HTML to PDF
      const pdfBuffer = await convertHtmlToPdf(htmlContent);

      console.log(`📁 [PDF-GENERATE] Using media system to save PDF: ${fileName}`);

      // Use the media system to save the PDF (this handles all database fields correctly)
      const mediaFile = await saveMedia({
        mediaData: pdfBuffer,
        fileName: fileName,
        fileType: "application/pdf",
        projectId: projectId,
        targetLocation: "documents",
        currentUser: { id: body.userId } as any, // Cast to any to bypass User type requirements
        title: documentName,
        description: `Generated PDF document using template: ${templateId}`,
        customVersionNumber: 999, // Set version number to 999 for generated PDFs
      });

      console.log(`✅ [PDF-GENERATE] Successfully saved PDF using media system: ${mediaFile.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          document: {
            id: documentId,
            name: documentName,
            htmlContent: htmlContent, // Keep HTML for preview
            fileName: mediaFile.fileName,
            filePath: mediaFile.filePath,
            fileUrl: mediaFile.publicUrl,
            fileSize: mediaFile.fileSize,
            mediaId: mediaFile.id, // Add the media system ID
            components: components.map((c: any) => ({
              id: c.id,
              name: c.name,
              type: c.component_type,
            })),
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
