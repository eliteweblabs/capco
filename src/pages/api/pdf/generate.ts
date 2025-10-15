// import type { APIRoute } from "astro";
// import { readFileSync } from "fs";
// import { join } from "path";
// import puppeteer from "puppeteer";

// // Function to convert HTML to PDF
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

// export const POST: APIRoute = async ({ request }) => {
//   try {
//     const body = await request.json();
//     const {
//       projectId,
//       templateId,
//       documentName,
//       selectedComponents = [],
//       customPlaceholders = {},
//     } = body;

//     if (!projectId || !templateId || !documentName) {
//       return new Response(
//         JSON.stringify({
//           success: false,
//           message: "Project ID, template ID, and document name are required",
//         }),
//         { status: 400 }
//       );
//     }

//     console.log(`📄 [PDF-GENERATE] Starting PDF generation for project ${projectId}`);

//     try {
//       // Read templates configuration
//       const templatesConfigPath = join(process.cwd(), "src/templates/pdf/templates.json");
//       const templatesConfig = JSON.parse(readFileSync(templatesConfigPath, "utf-8"));

//       // Find the template
//       const templateConfig = templatesConfig.templates.find((t: any) => t.id === templateId);
//       if (!templateConfig) {
//         throw new Error("Template not found");
//       }

//       // Use the assemble API to get the assembled template
//       const assembleUrl = `${request.url.split("/api")[0]}/api/pdf/assemble?templateId=${templateId}&projectId=${projectId}&mode=pdf`;
//       console.log(`📄 [PDF-GENERATE] Calling assemble API: ${assembleUrl}`);

//       const assembleResponse = await fetch(assembleUrl);

//       if (!assembleResponse.ok) {
//         const errorText = await assembleResponse.text();
//         console.error(
//           `❌ [PDF-GENERATE] Assemble API failed: ${assembleResponse.status} - ${errorText}`
//         );
//         throw new Error(`Failed to assemble template: ${assembleResponse.status} - ${errorText}`);
//       }

//       const templateHtml = await assembleResponse.text();
//       console.log(`✅ [PDF-GENERATE] Got assembled template, length: ${templateHtml.length}`);

//       // The assemble API already handles all placeholder replacement and component assembly
//       // No additional processing needed - templateHtml is already fully assembled

//       console.log(`✅ [PDF-GENERATE] Template assembled successfully, returning HTML for preview`);

//       return new Response(
//         JSON.stringify({
//           success: true,
//           document: {
//             id: `preview_${Date.now()}`,
//             name: documentName,
//             htmlContent: templateHtml, // Return HTML for preview only
//             templateId: templateId,
//             projectId: projectId,
//           },
//         }),
//         {
//           status: 200,
//           headers: {
//             "Content-Type": "application/json",
//           },
//         }
//       );
//     } catch (error: any) {
//       console.error("❌ [PDF-GENERATE] Error during generation:", error);

//       return new Response(
//         JSON.stringify({
//           success: false,
//           message: "Failed to generate PDF",
//           error: error.message,
//         }),
//         { status: 500 }
//       );
//     }
//   } catch (error: any) {
//     console.error("❌ [PDF-GENERATE] Unexpected error:", error);
//     return new Response(
//       JSON.stringify({
//         success: false,
//         message: "An unexpected error occurred",
//         error: error.message,
//       }),
//       { status: 500 }
//     );
//   }
// };

import type { APIRoute } from "astro";
import puppeteer from "puppeteer";
import { supabase } from "../../../lib/supabase";
import { createClient } from "@supabase/supabase-js";

interface PDFGenerationRequest {
  type: "general" | "contract";
  templateUrl?: string;
  projectId?: number;
  signatures?: Record<string, string>;
  signature?: string;
  signedAt?: string;
  projectData?: any;
  options?: any;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: PDFGenerationRequest = await request.json();
    const {
      type,
      templateUrl,
      projectId,
      signatures,
      signature,
      signedAt,
      projectData,
      options = {},
    } = body;

    console.log("📄 [GENERATE-PDF-UNIFIED] Starting PDF generation:", { type, projectId });

    if (type === "contract") {
      return await generateContractPDF(request, projectId, signature, signedAt);
    } else {
      return await generateGeneralPDF(request, templateUrl, signatures, projectData, options);
    }
  } catch (error) {
    console.error("📄 [GENERATE-PDF-UNIFIED] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

async function generateContractPDF(
  request: Request,
  projectId?: number,
  signature?: string,
  signedAt?: string
) {
  if (!projectId || !signature) {
    return new Response(JSON.stringify({ error: "Project ID and signature are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("📄 [GENERATE-CONTRACT-PDF] Starting PDF generation for project:", projectId);

  if (!supabase) {
    return new Response(JSON.stringify({ error: "Database connection not available" }), {
      status: 500,
    });
  }

  // Get project data
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, title, address, authorId, sqFt, newConstruction")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    console.error("📄 [GENERATE-CONTRACT-PDF] Project not found:", projectError);
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get client profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("companyName, firstName, lastName")
    .eq("id", project.authorId)
    .single();

  if (profileError) {
    console.error("📄 [GENERATE-CONTRACT-PDF] Profile error:", profileError);
  }

  // Generate PDF
  const baseUrl = new URL(request.url).origin;
  const contractUrl = await generateContractPDFContent(
    project,
    profile,
    signature,
    signedAt || new Date().toISOString(),
    baseUrl
  );

  // Update project with contract PDF URL
  const { error: updateError } = await supabase
    .from("projects")
    .update({ contractPdfUrl: contractUrl })
    .eq("id", projectId);

  if (updateError) {
    console.error("📄 [GENERATE-CONTRACT-PDF] Failed to update project with PDF URL:", updateError);
  }

  console.log("✅ [GENERATE-CONTRACT-PDF] Contract PDF generated successfully:", contractUrl);

  return new Response(
    JSON.stringify({
      success: true,
      contractUrl: contractUrl,
      projectId: projectId,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

async function generateGeneralPDF(
  request: Request,
  templateUrl?: string,
  signatures?: Record<string, string>,
  projectData?: any,
  options: any = {}
) {
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
      "--single-process",
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
      const supabaseClient = createClient(
        import.meta.env.SUPABASE_URL!,
        import.meta.env.SUPABASE_ANON_KEY!
      );

      const fileName = `project-agreement-${projectData.projectId}-${Date.now()}.pdf`;
      const filePath = `pdfs/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabaseClient.storage
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
        const { error: logError } = await supabaseClient.from("pdf_documents").insert({
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

  // Get the HTML content for preview
  const htmlContent = await page.content();

  // Close browser
  await browser.close();

  // Return JSON response with HTML content for preview
  return new Response(
    JSON.stringify({
      success: true,
      document: {
        id: `preview_${Date.now()}`,
        name: `project-agreement-${projectData?.projectId || "document"}`,
        htmlContent: htmlContent,
        templateId: templateUrl,
        projectId: projectData?.projectId,
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

async function generateContractPDFContent(
  project: any,
  profile: any,
  signature: string,
  signedAt: string,
  baseUrl: string
): Promise<string> {
  try {
    console.log("📄 [GENERATE-CONTRACT-PDF] Generating contract PDF for project:", project.id);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    });

    // Get the actual contract content from the database
    if (!supabase) {
      throw new Error("Supabase client not configured");
    }

    const { data: projectWithContract, error: contractError } = await supabase
      .from("projects")
      .select("contractData")
      .eq("id", project.id)
      .single();

    if (contractError) {
      console.error("📄 [GENERATE-CONTRACT-PDF] Failed to fetch contract:", contractError);
      throw new Error("Failed to fetch contract content");
    }

    let contractHTML = projectWithContract?.contractData?.html;

    console.log("📄 [GENERATE-CONTRACT-PDF] Contract content check:", {
      hasContractHtml: !!contractHTML,
      contractLength: contractHTML?.length || 0,
      contractPreview: contractHTML?.substring(0, 100) + "...",
    });

    // If no custom contract exists, fall back to template
    if (!contractHTML) {
      console.log("📄 [GENERATE-CONTRACT-PDF] No custom contract found, using template");
      const templateUrl = `${baseUrl}/api/pdf/assemble?templateId=contract&projectId=${project.id}`;
      const templateResponse = await fetch(templateUrl);
      if (!templateResponse.ok) {
        throw new Error(`Failed to get template: ${templateResponse.status}`);
      }
      contractHTML = await templateResponse.text();
      console.log("📄 [GENERATE-CONTRACT-PDF] Template content length:", contractHTML.length);
    } else {
      console.log("📄 [GENERATE-CONTRACT-PDF] Using custom contract from database");
      console.log("📄 [GENERATE-CONTRACT-PDF] Custom contract length:", contractHTML.length);
    }

    // Insert signature HTML block
    const signatureHTMLBlock = `<p>Signed by: {{companyName}}</p>
    <p>Signed on: {{PROJECT_SIGNATURE_DATE}}</p>
    <p>Signed at: {{PROJECT_SIGNATURE_TIME}}</p>
    <p>Signed IP: {{PROJECT_SIGNATURE_IP}}</p>
    <p>Signature: {{PROJECT_SIGNATURE_IMAGE}}</p>`;

    contractHTML = contractHTML.getElementById("signature-component").innerHTML =
      signatureHTMLBlock;
    contractHTML.getElementById("signature-component").classList.remove("hidden");

    // Replace signature-specific placeholders
    const signedDate = new Date(signedAt);
    contractHTML = contractHTML
      .replace(/\{\{PROJECT_SIGNATURE_IMAGE\}\}/g, signature)
      .replace(/\{\{PROJECT_SIGNATURE_DATE\}\}/g, signedDate.toLocaleDateString())
      .replace(/\{\{PROJECT_SIGNATURE_TIME\}\}/g, signedDate.toLocaleTimeString())
      .replace(/\{\{PROJECT_SIGNATURE_IP\}\}/g, "N/A");

    console.log("📄 [GENERATE-CONTRACT-PDF] Assembled HTML length:", contractHTML.length);

    const page = await browser.newPage();

    // Set the HTML content
    await page.setContent(contractHTML, { waitUntil: "networkidle0" });

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
    };

    // Generate PDF
    const pdfBuffer = await page.pdf(pdfOptions);

    await browser.close();

    // Generate unique filename for the contract
    const fileName = `contract-${project.id}-${Date.now()}.pdf`;
    console.log("📄 [GENERATE-CONTRACT-PDF] Generated filename:", fileName);

    // Use unified media system to save contract
    console.log("📄 [GENERATE-CONTRACT-PDF] Saving PDF to media system...");
    const { saveMedia } = await import("../../../lib/media");

    // Convert to proper format for logging and saving
    let bufferData: any;
    let bufferLength: number;

    if (pdfBuffer.buffer instanceof Buffer) {
      bufferData = pdfBuffer.buffer;
      bufferLength = (pdfBuffer.buffer as Buffer).length;
    } else {
      bufferData = pdfBuffer;
      bufferLength = (pdfBuffer as Uint8Array).length;
    }

    console.log("📄 [GENERATE-CONTRACT-PDF] Media save parameters:", {
      fileName: fileName,
      fileType: "application/pdf",
      projectId: project.id.toString(),
      targetLocation: "documents",
      title: `Contract - ${project.title}`,
      pdfBufferLength: bufferLength,
    });

    const contractFile = await saveMedia({
      mediaData: bufferData,
      fileName: fileName,
      fileType: "application/pdf",
      projectId: project.id.toString(),
      targetLocation: "documents",
      title: `Contract - ${project.title}`,
      description: "Generated contract with digital signature",
      customVersionNumber: 999,
      currentUser: {
        id: project.authorId,
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        createdAt: new Date().toISOString(),
      } as any,
    });

    console.log(
      "📄 [GENERATE-CONTRACT-PDF] Contract saved to unified media system:",
      contractFile.id,
      "Public URL:",
      contractFile.publicUrl
    );

    return contractFile.publicUrl || "";
  } catch (error) {
    console.error("📄 [GENERATE-CONTRACT-PDF] PDF generation error:", error);
    throw error;
  }
}
