import { createClient } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import puppeteer from "puppeteer";

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { projectId, signature, signed_at } = body;

    if (!projectId || !signature) {
      return new Response(JSON.stringify({ error: "Project ID and signature are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // console.log("📝 [SAVE-SIGNATURE] Received request:", {
      projectId,
      signatureLength: signature?.length || 0,
      signed_at,
    });

    // Validate projectId is a number
    const projectIdNum = parseInt(projectId);
    if (isNaN(projectIdNum)) {
      console.error("❌ [SAVE-SIGNATURE] Invalid project ID:", projectId);
      return new Response(JSON.stringify({ error: "Invalid project ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // console.log("💾 [SAVE-SIGNATURE] Saving signature for project:", projectId);

    // Create Supabase client
    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Generate PDF with contract text and signature (optional)
    let contractPdfUrl = null;
    try {
      contractPdfUrl = await generateContractPDF(projectId, signature, signed_at);
      // console.log("✅ [SAVE-SIGNATURE] PDF generated successfully:", contractPdfUrl);
    } catch (pdfError) {
      console.warn("⚠️ [SAVE-SIGNATURE] PDF generation failed, continuing without PDF:", pdfError);
    }

    // Update the project with signature data (only use existing columns)
    const updateData = {
      proposal_signature: signature,
      signed_at: signed_at || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId)
      .select();

    if (error) {
      console.error("❌ [SAVE-SIGNATURE] Database error:", error);
      console.error("❌ [SAVE-SIGNATURE] Update data:", updateData);
      console.error("❌ [SAVE-SIGNATURE] Project ID:", projectId);
      return new Response(
        JSON.stringify({ error: "Failed to save signature", details: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // console.log("✅ [SAVE-SIGNATURE] Signature saved successfully:", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Signature saved successfully",
        data: data[0],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [SAVE-SIGNATURE] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

async function generateContractPDF(
  projectId: string,
  signature: string,
  signedAt: string
): Promise<string> {
  try {
    // console.log("📄 [SAVE-SIGNATURE] Generating contract PDF for project:", projectId);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Create HTML content for the contract
    const contractHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contract - Project ${projectId}</title>
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
          }
          .signature-info {
            margin-top: 20px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Fire Protection Systems Contract</h1>
          <p>Project ID: ${projectId}</p>
        </div>

        <div class="contract-content">
          <h2>Contract Terms and Conditions</h2>
          <p>This contract outlines the terms and conditions for fire protection systems installation and maintenance services.</p>
          
          <h3>Scope of Work</h3>
          <p>The contractor agrees to provide comprehensive fire protection systems including but not limited to:</p>
          <ul>
            <li>Fire alarm system installation and testing</li>
            <li>Sprinkler system installation and maintenance</li>
            <li>Fire suppression system installation</li>
            <li>Emergency lighting and exit signage</li>
            <li>Fire safety equipment installation</li>
          </ul>

          <h3>Terms and Conditions</h3>
          <p>By signing this contract, the client agrees to:</p>
          <ul>
            <li>Provide access to the property for installation and maintenance</li>
            <li>Make payments according to the agreed schedule</li>
            <li>Comply with all local fire safety regulations</li>
            <li>Allow for regular system inspections and maintenance</li>
          </ul>

          <h3>Warranty</h3>
          <p>All work performed under this contract is warranted for a period of one year from the date of completion. The contractor will provide maintenance services as outlined in the service agreement.</p>
        </div>

        <div class="signature-section">
          <h3>Digital Signature</h3>
          <p>I, the undersigned, agree to the terms and conditions outlined in this contract.</p>
          
          <div class="signature-image">
            <img src="${signature}" alt="Digital Signature" style="max-width: 100%; height: auto;" />
          </div>
          
          <div class="signature-info">
            <p><strong>Signed:</strong> ${new Date(signedAt).toLocaleDateString()} at ${new Date(signedAt).toLocaleTimeString()}</p>
            <p><strong>Project ID:</strong> ${projectId}</p>
          </div>
        </div>

        <div class="footer">
          <p>This document was generated electronically and is legally binding.</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Set the HTML content
    await page.setContent(contractHTML, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    });

    await browser.close();

    // Upload PDF to Supabase Storage
    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const fileName = `contracts/contract-${projectId}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("project-documents")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ [SAVE-SIGNATURE] PDF upload error:", uploadError);
      throw new Error("Failed to upload contract PDF");
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("project-documents").getPublicUrl(fileName);

    // console.log("✅ [SAVE-SIGNATURE] Contract PDF generated and uploaded:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("❌ [SAVE-SIGNATURE] PDF generation error:", error);
    throw error;
  }
}
