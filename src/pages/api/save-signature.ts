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
    const { project, signature, signedAt, currentUser } = body;
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
      signedAt,
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

      console.log("📄 [SAVE-SIGNATURE] Starting PDF generation with:", {
        projectId,
        baseUrl,
        userId,
        clientIP
      });

      // Use the unified PDF generator
      const pdfResponse = await fetch(`${baseUrl}/api/generate-pdf-unified`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contract",
          projectId: parseInt(projectId),
          signature: signature,
          signedAt: signedAt,
        }),
      });

      if (pdfResponse.ok) {
        const pdfResult = await pdfResponse.json();
        if (pdfResult.success && pdfResult.document?.fileUrl) {
          contractPdfUrl = pdfResult.document.fileUrl;
          console.log("✅ [SAVE-SIGNATURE] PDF generated successfully:", contractPdfUrl);
        } else {
          console.warn("⚠️ [SAVE-SIGNATURE] PDF generation returned no URL:", pdfResult);
        }
      } else {
        const errorText = await pdfResponse.text();
        console.error("❌ [SAVE-SIGNATURE] PDF generation failed:", errorText);
      }
    } catch (pdfError) {
      console.error("❌ [SAVE-SIGNATURE] PDF generation failed:", pdfError);
      console.warn("⚠️ [SAVE-SIGNATURE] Continuing without PDF");
    }

    // Update the project with signature data using contractData structure
    const updateData = {
      contractData: {
        image: signature,
        signedDate: new Date(signedAt || new Date()).toLocaleDateString(),
        signedTime: new Date(signedAt || new Date()).toLocaleTimeString(),
        ipAddress: clientIP,
        url: contractPdfUrl || null,
      },
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

