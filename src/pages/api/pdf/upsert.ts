import type { APIRoute } from "astro";
import puppeteer from "puppeteer";
import { saveMedia } from "../../../lib/media";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

/**
 * Save HTML template to local templates directory for preview purposes
 */
async function saveHTMLTemplate(
  htmlContent: string,
  projectId: number,
  templateId: number,
  documentName: string
): Promise<void> {
  try {
    const templatesDir = join(process.cwd(), "src", "components", "pdf-system", "templates");
    
    // Ensure directory exists
    await mkdir(templatesDir, { recursive: true });

    // Create a safe filename
    const safeDocumentName = documentName.replace(/[^a-zA-Z0-9]/g, "_");
    const timestamp = Date.now();
    const fileName = `project-${projectId}_template-${templateId}_${safeDocumentName}_${timestamp}.html`;
    const filePath = join(templatesDir, fileName);

    // Write HTML file
    await writeFile(filePath, htmlContent, "utf-8");

    console.log("✅ [PDF-SAVE] HTML template saved locally:", fileName);
  } catch (error) {
    console.error("❌ [PDF-SAVE] Error saving HTML template:", error);
    throw error;
  }
}

// Function to convert HTML to PDF
export async function convertHtmlToPdf(htmlContent: string): Promise<Buffer> {
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
    const { projectId, templateId, documentName, htmlContent, userId } = body;

    if (!projectId || !templateId || !documentName || !htmlContent) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Project ID, template ID, document name, and HTML content are required",
        }),
        { status: 400 }
      );
    }

    console.log(`📄 [PDF-SAVE] Saving document: ${documentName} for project: ${projectId}`);

    // Generate a unique document ID
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const fileName = `${documentName.replace(/[^a-zA-Z0-9]/g, "_")}_${documentId}.pdf`;

    console.log(`📁 [PDF-SAVE] Converting HTML to PDF: ${fileName}`);

    // Optionally save HTML to local templates directory for preview purposes
    if (import.meta.env.SAVE_HTML_TEMPLATES === "true" || import.meta.env.SAVE_HTML_TEMPLATES === "1") {
      try {
        await saveHTMLTemplate(htmlContent, projectId, templateId, documentName);
      } catch (htmlSaveError) {
        // Don't fail the entire operation if HTML saving fails
        console.warn("⚠️ [PDF-SAVE] Failed to save HTML template (non-fatal):", htmlSaveError);
      }
    }

    // Convert HTML to PDF
    const pdfBuffer = await convertHtmlToPdf(htmlContent);

    console.log(`📁 [PDF-SAVE] Using media system to save PDF: ${fileName}`);

    // Use the media system to save the PDF
    const mediaFile = await saveMedia({
      mediaData: pdfBuffer instanceof Buffer ? pdfBuffer.buffer : pdfBuffer,
      fileName: fileName,
      fileType: "application/pdf",
      projectId: projectId,
      targetLocation: "documents",
      currentUser: { id: userId } as any,
      title: documentName,
      description: `Generated PDF document using template: ${templateId}`,
      customVersionNumber: 999,
    });

    console.log(`✅ [PDF-SAVE] Successfully saved PDF: ${mediaFile.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        document: {
          id: documentId,
          name: documentName,
          fileName: mediaFile.fileName,
          filePath: mediaFile.filePath,
          fileUrl: mediaFile.publicUrl,
          fileSize: mediaFile.fileSize,
          mediaId: mediaFile.id,
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
    console.error("❌ [PDF-SAVE] Error saving document:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to save document",
        error: error.message,
      }),
      { status: 500 }
    );
  }
};
