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
    const contractUrl = await generateContractPDF(project, profile, signature, signedAt);

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
  signedAt: string
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

    const page = await browser.newPage();

    // Create HTML content for the contract
    const contractHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contract - ${project.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .project-info {
            background-color: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .contract-content {
            margin-bottom: 40px;
          }
          .signature-section {
            margin-top: 60px;
            border-top: 1px solid #ccc;
            padding-top: 20px;
          }
          .signature-image {
            max-width: 300px;
            margin: 20px 0;
            border: 1px solid #ddd;
            padding: 10px;
            background-color: #fafafa;
          }
          .signature-info {
            margin-top: 20px;
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .terms-section {
            margin: 30px 0;
          }
          .terms-section h3 {
            color: #2c3e50;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 5px;
          }
          ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          li {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Fire Protection Systems Contract</h1>
          <p><strong>Project:</strong> ${project.title}</p>
          <p><strong>Contract Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="project-info">
          <h2>Project Information</h2>
          <p><strong>Project ID:</strong> ${project.id}</p>
          <p><strong>Project Address:</strong> ${project.address}</p>
          <p><strong>Client:</strong> ${profile?.company_name || profile?.first_name + " " + profile?.last_name || "N/A"}</p>
          <p><strong>Square Footage:</strong> ${project.sq_ft || "N/A"}</p>
          <p><strong>Construction Type:</strong> ${project.new_construction ? "New Construction" : "Existing Building"}</p>
        </div>

        <div class="contract-content">
          <div class="terms-section">
            <h3>Scope of Work</h3>
            <p>The contractor agrees to provide comprehensive fire protection systems including but not limited to:</p>
            <ul>
              <li>Fire alarm system installation and testing</li>
              <li>Sprinkler system installation and maintenance</li>
              <li>Fire suppression system installation</li>
              <li>Emergency lighting and exit signage</li>
              <li>Fire safety equipment installation</li>
              <li>System integration and testing</li>
              <li>Compliance with local fire codes and regulations</li>
            </ul>
          </div>

          <div class="terms-section">
            <h3>Terms and Conditions</h3>
            <p>By signing this contract, the client agrees to:</p>
            <ul>
              <li>Provide access to the property for installation and maintenance</li>
              <li>Make payments according to the agreed schedule</li>
              <li>Comply with all local fire safety regulations</li>
              <li>Allow for regular system inspections and maintenance</li>
              <li>Provide necessary permits and approvals</li>
              <li>Maintain the fire protection systems as specified</li>
            </ul>
          </div>

          <div class="terms-section">
            <h3>Warranty and Maintenance</h3>
            <p>All work performed under this contract is warranted for a period of one year from the date of completion. The contractor will provide maintenance services as outlined in the service agreement and ensure all systems meet current fire safety standards.</p>
          </div>

          <div class="terms-section">
            <h3>Compliance</h3>
            <p>All installations and modifications will comply with applicable local, state, and federal fire safety regulations, including but not limited to NFPA standards and local building codes.</p>
          </div>
        </div>

        <div class="signature-section">
          <h3>Digital Signature</h3>
          <p>I, the undersigned, agree to the terms and conditions outlined in this contract.</p>
          
          <div class="signature-image">
            <img src="${signature}" alt="Digital Signature" style="max-width: 100%; height: auto;" />
          </div>
          
          <div class="signature-info">
            <p><strong>Signed by:</strong> ${profile?.company_name || profile?.first_name + " " + profile?.last_name || "Client"}</p>
            <p><strong>Date:</strong> ${new Date(signedAt).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(signedAt).toLocaleTimeString()}</p>
          </div>
        </div>

        <div class="footer">
          <p>This contract is digitally signed and legally binding.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

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

    // Save to Supabase Storage using existing project-documents bucket
    const fileName = `contract-${project.id}-${Date.now()}.pdf`;
    const filePath = `contracts/${project.id}/${fileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("project-documents")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("📄 [GENERATE-CONTRACT-PDF] Upload error:", uploadError);
      throw new Error("Failed to upload PDF to storage");
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("project-documents").getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL for PDF");
    }

    console.log("✅ [GENERATE-CONTRACT-PDF] PDF saved to storage:", urlData.publicUrl);

    // Log contract file in database
    const { error: dbError } = await supabase.from("files").insert({
      project_id: project.id,
      author_id: project.author_id,
      file_path: filePath,
      file_name: fileName,
      file_size: pdfBuffer.length,
      file_type: "application/pdf",
      title: `Contract - ${project.title}`,
      comments: "Generated contract with digital signature",
      status: "active",
      uploaded_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("📄 [GENERATE-CONTRACT-PDF] Failed to log contract file:", dbError);
      // Don't fail the entire process if database logging fails
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error("📄 [GENERATE-CONTRACT-PDF] PDF generation error:", error);
    throw error;
  }
}
