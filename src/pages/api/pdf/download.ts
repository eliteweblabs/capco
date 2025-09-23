import type { APIRoute } from "astro";
import puppeteer from "puppeteer";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { htmlContent, documentName } = body;

    if (!htmlContent || !documentName) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "HTML content and document name are required",
        }),
        { status: 400 }
      );
    }

    // // // console.log(`📄 [PDF-DOWNLOAD] Generating PDF for: ${documentName}`);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      // Set the HTML content
      await page.setContent(htmlContent, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Generate PDF
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

      await browser.close();

      // // // console.log(`✅ [PDF-DOWNLOAD] Successfully generated PDF for: ${documentName}`);

      // Return the PDF as a downloadable file
      const sanitizedFileName = documentName.replace(/[^a-zA-Z0-9\s-_]/g, "_");

      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${sanitizedFileName}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error: any) {
    console.error("❌ [PDF-DOWNLOAD] Error generating PDF:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to generate PDF",
        error: error.message,
      }),
      { status: 500 }
    );
  }
};
