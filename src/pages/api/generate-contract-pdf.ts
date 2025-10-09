import type { APIRoute } from "astro";
import puppeteer from "puppeteer";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { projectId, signature, signedAt } = await request.json();

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
    const contractUrl = await generateContractPDF(project, profile, signature, signedAt, baseUrl);

    // Update project with contract PDF URL
    const { error: updateError } = await supabase
      .from("projects")
      .update({ contractPdfUrl: contractUrl })
      .eq("id", projectId);

    if (updateError) {
      console.error(
        "📄 [GENERATE-CONTRACT-PDF] Failed to update project with PDF URL:",
        updateError
      );
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
  } catch (error) {
    console.error("📄 [GENERATE-CONTRACT-PDF] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

async function generateContractPDF(
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

    // Get the actual contract content from the database (same as displayed in #contract-container)
    if (!supabase) {
      throw new Error("Supabase client not configured");
    }

    const { data: projectWithContract, error: contractError } = await supabase
      .from("projects")
      .select("contract_html")
      .eq("id", project.id)
      .single();

    if (contractError) {
      console.error("📄 [GENERATE-CONTRACT-PDF] Failed to fetch contract:", contractError);
      throw new Error("Failed to fetch contract content");
    }

    let contractHTML = projectWithContract?.contract_html;

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

    // insert the following into the contractHTML
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
    const { saveMedia } = await import("../../lib/media");

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
      targetLocation: "documents", // Routes to project-media/projectId/documents/ to appear in file manager
      title: `Contract - ${project.title}`,
      description: "Generated contract with digital signature",
      customVersionNumber: 999, // Set version to 999 to match other generated PDFs
      currentUser: {
        id: project.authorId,
        // Add minimal required User properties for type safety
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        createdAt: new Date().toISOString(),
      } as any, // Type assertion to bypass strict User type checking
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
