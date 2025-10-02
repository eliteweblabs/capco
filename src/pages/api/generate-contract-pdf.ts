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
      .select("id, title, address, author_id, sq_ft, new_construction")
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
      .select("company_name, first_name, last_name")
      .eq("id", project.author_id)
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
      .update({ contract_pdf_url: contractUrl })
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

    // Use the template assembly API to get the contract HTML
    const assembleUrl = `${baseUrl}/api/pdf/assemble?templateId=contract&projectId=${project.id}`;

    console.log("📄 [GENERATE-CONTRACT-PDF] Assembling template:", assembleUrl);

    const assembleResponse = await fetch(assembleUrl);
    if (!assembleResponse.ok) {
      throw new Error(`Failed to assemble template: ${assembleResponse.status}`);
    }

    let contractHTML = await assembleResponse.text();

    // Replace signature-specific placeholders
    const signedDate = new Date(signedAt);
    contractHTML = contractHTML
      .replace(/\{\{SIGNATURE_IMAGE\}\}/g, signature)
      .replace(/\{\{SIGNATURE_DATE\}\}/g, signedDate.toLocaleDateString())
      .replace(/\{\{SIGNATURE_TIME\}\}/g, signedDate.toLocaleTimeString())
      .replace(/\{\{SIGNATURE_IP\}\}/g, "N/A");

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
    const { saveMedia } = await import("../../lib/media");

    const contractFile = await saveMedia({
      mediaData: pdfBuffer,
      fileName: fileName,
      fileType: "application/pdf",
      projectId: project.id.toString(),
      targetLocation: "documents", // Routes to project-media/projectId/documents/ to appear in file manager
      title: `Contract - ${project.title}`,
      description: "Generated contract with digital signature",
      customVersionNumber: 999, // Set version to 999 to match other generated PDFs
      currentUser: {
        id: project.author_id,
        // Add minimal required User properties for type safety
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as any, // Type assertion to bypass strict User type checking
    });

    console.log(
      "📄 [GENERATE-CONTRACT-PDF] Contract saved to unified media system:",
      contractFile.id
    );

    return contractFile.publicUrl || "";
  } catch (error) {
    console.error("📄 [GENERATE-CONTRACT-PDF] PDF generation error:", error);
    throw error;
  }
}
