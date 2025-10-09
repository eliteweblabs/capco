import { createClient } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import puppeteer from "puppeteer";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { templateUrl, signatures, projectData, options = {} } = await request.json();

    if (!templateUrl) {
      return new Response(JSON.stringify({ error: "Template URL is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Launch Puppeteer with appropriate options
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process", // This helps with memory usage in containers
      ],
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });

    // Navigate to the template URL
    await page.goto(templateUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait for any dynamic content to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Inject signatures if provided
    if (signatures && Object.keys(signatures).length > 0) {
      await page.evaluate((sigs: Record<string, string>) => {
        Object.entries(sigs).forEach(([canvasId, signatureData]) => {
          if (signatureData && typeof signatureData === "string") {
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
            if (canvas) {
              const ctx = canvas.getContext("2d");
              const img = new Image();
              img.onload = () => {
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
              };
              img.src = signatureData;
            }
          }
        });
      }, signatures);

      // Wait for signatures to render
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // PDF generation options
    const pdfOptions = {
      format: "letter" as const,
      printBackground: true,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
      preferCSSPageSize: true,
      ...options,
    };

    // Generate PDF
    const pdfBuffer = await page.pdf(pdfOptions);

    await browser.close();

    // Save to Supabase Storage (optional)
    if (projectData?.projectId) {
      try {
        const supabase = createClient(
          import.meta.env.SUPABASE_URL!,
          import.meta.env.SUPABASE_ANON_KEY!
        );

        const fileName = `project-agreement-${projectData.projectId}-${Date.now()}.pdf`;
        const filePath = `pdfs/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, pdfBuffer, {
            contentType: "application/pdf",
            upsert: false,
          });

        if (uploadError) {
          console.error("Error uploading PDF to Supabase:", uploadError);
        } else {
          console.log("PDF uploaded to Supabase:", uploadData);

          // Log the PDF generation in the database
          const { error: logError } = await supabase.from("pdf_documents").insert({
            projectId: projectData.projectId,
            document_type: "project_agreement",
            filePath: filePath,
            fileName: fileName,
            metadata: {
              signatures: signatures ? Object.keys(signatures) : [],
              generated_at: new Date().toISOString(),
              project_data: projectData,
            },
          });

          if (logError) {
            console.error("Error logging PDF generation:", logError);
          }
        }
      } catch (storageError) {
        console.error("Storage operation failed:", storageError);
        // Continue with PDF download even if storage fails
      }
    }

    // Return PDF as blob - convert to proper format for Response
    let bufferData: any;
    let bufferLength: number;

    if (pdfBuffer.buffer instanceof Buffer) {
      bufferData = pdfBuffer.buffer;
      bufferLength = (pdfBuffer.buffer as Buffer).length;
    } else {
      bufferData = pdfBuffer;
      bufferLength = (pdfBuffer as Uint8Array).length;
    }

    return new Response(bufferData, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="project-agreement-${projectData?.projectId || "document"}.pdf"`,
        "Content-Length": bufferLength.toString(),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
