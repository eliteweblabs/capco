import type { APIRoute } from "astro";
import { getApiBaseUrl } from "../../lib/url-utils";

export const POST: APIRoute = async ({ request }) => {
  console.log("🧪 [TEST-PDF-GENERATION] API route called!");
  console.log("🧪 [TEST-PDF-GENERATION] Request URL:", request.url);
  console.log("🧪 [TEST-PDF-GENERATION] Request method:", request.method);

  try {
    const body = await request.json();
    console.log("🧪 [TEST-PDF-GENERATION] Request body:", body);

    const { projectId, signature } = body;

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Project ID is required for testing",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create a test signature if none provided
    const testSignature =
      signature ||
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    console.log("🧪 [TEST-PDF-GENERATION] Calling PDF generation API...");

    // Call the PDF generation API
    const baseUrl = getApiBaseUrl(request);
    const pdfResponse = await fetch(`${baseUrl}/api/generate-contract-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: projectId,
        signature: testSignature,
        signedAt: new Date().toISOString(),
      }),
    });

    console.log("🧪 [TEST-PDF-GENERATION] PDF response status:", pdfResponse.status);
    console.log("🧪 [TEST-PDF-GENERATION] PDF response ok:", pdfResponse.ok);

    const pdfResult = await pdfResponse.json();
    console.log("🧪 [TEST-PDF-GENERATION] PDF generation result:", pdfResult);

    if (pdfResponse.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "PDF generation test completed successfully",
          result: pdfResult,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PDF generation failed",
          details: pdfResult,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("🧪 [TEST-PDF-GENERATION] Exception:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Test failed with exception",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const GET: APIRoute = async ({ request }) => {
  console.log("🧪 [TEST-PDF-GENERATION] GET endpoint called");

  return new Response(
    JSON.stringify({
      message: "PDF Generation Test Endpoint",
      usage: "Send POST request with projectId and optional signature",
      example: {
        projectId: "123",
        signature: "data:image/png;base64,...",
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
