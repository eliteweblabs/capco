import type { APIRoute } from "astro";

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

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { project, signature, signed_at, currentUser } = body;
    const projectId = project.id;

    // Extract IP address from request headers
    const getClientIP = (request: Request): string => {
      const forwarded = request.headers.get("x-forwarded-for");
      const realIP = request.headers.get("x-real-ip");
      const remoteAddr = request.headers.get("x-remote-addr");

      if (forwarded) {
        return forwarded.split(",")[0].trim();
      }
      if (realIP) {
        return realIP;
      }
      if (remoteAddr) {
        return remoteAddr;
      }
      return "Unknown";
    };

    const clientIP = getClientIP(request);

    if (!projectId || !signature) {
      return new Response(JSON.stringify({ error: "Project ID and signature are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("📝 [SAVE-SIGNATURE] Received request:", {
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

    console.log("💾 [SAVE-SIGNATURE] Saving signature for project:", projectId);

    // Check authentication using the same pattern as other APIs
    const { supabase } = await import("../../lib/supabase");
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Supabase client not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate PDF with contract text and signature (optional)
    let contractPdfUrl = null;
    try {
      // Get base URL from request
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;

      // Get user ID from currentUser or cookies
      const userId = currentUser?.id || cookies.get("user-id")?.value;

      contractPdfUrl = await generateContractPDF(projectId, signature, signed_at, userId, baseUrl);
      console.log("✅ [SAVE-SIGNATURE] PDF generated successfully:", contractPdfUrl);
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

    console.log("✅ [SAVE-SIGNATURE] Signature saved successfully:", data);

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

/**
 * Generate contract PDF using the template system
 * This leverages the existing PDF infrastructure instead of duplicating code
 */
async function generateContractPDF(
  projectId: string,
  signature: string,
  signedAt: string,
  userId: string,
  baseUrl: string
): Promise<string> {
  try {
    console.log("📄 [SAVE-SIGNATURE] Generating contract PDF for project:", projectId);

    // Fetch project data for placeholders
    const { supabase } = await import("../../lib/supabase");
    if (!supabase) {
      throw new Error("Supabase client not configured");
    }

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !projectData) {
      throw new Error("Failed to fetch project data");
    }

    // Prepare signature data for manual replacement (SIGNATURE_* placeholders)
    const signedDate = new Date(signedAt);
    const signatureData = {
      image: signature,
      signed_date: signedDate.toLocaleDateString(),
      signed_time: signedDate.toLocaleTimeString(),
      ip_address: clientIP,
    };

    // Use the template assembly API to get the contract HTML
    const assembleUrl = `${baseUrl}/api/pdf/assemble?templateId=contract&projectId=${projectId}`;
    console.log("📄 [SAVE-SIGNATURE] Assembling template:", assembleUrl);

    const assembleResponse = await fetch(assembleUrl);
    if (!assembleResponse.ok) {
      throw new Error(`Failed to assemble template: ${assembleResponse.status}`);
    }

    let contractHTML = await assembleResponse.text();

    // Replace signature-specific placeholders (using uppercase format for consistency)
    contractHTML = contractHTML
      .replace(/\{\{SIGNATURE_IMAGE\}\}/g, signatureData.image)
      .replace(/\{\{SIGNATURE_DATE\}\}/g, signatureData.signed_date)
      .replace(/\{\{SIGNATURE_TIME\}\}/g, signatureData.signed_time)
      .replace(/\{\{SIGNATURE_IP\}\}/g, signatureData.ip_address);

    console.log("📄 [SAVE-SIGNATURE] Assembled HTML length:", contractHTML.length);

    // Use the existing PDF save-document API
    const saveResponse = await fetch(`${baseUrl}/api/pdf/save-document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        templateId: "contract",
        documentName: `Contract_Project_${projectId}`,
        htmlContent: contractHTML,
        userId,
      }),
    });

    if (!saveResponse.ok) {
      throw new Error(`Failed to save PDF: ${saveResponse.status}`);
    }

    const saveResult = await saveResponse.json();
    if (!saveResult.success) {
      throw new Error(saveResult.message || "Failed to save PDF");
    }

    console.log("✅ [SAVE-SIGNATURE] Contract PDF generated:", saveResult.document.fileUrl);
    return saveResult.document.fileUrl;
  } catch (error) {
    console.error("❌ [SAVE-SIGNATURE] PDF generation error:", error);
    throw error;
  }
}
