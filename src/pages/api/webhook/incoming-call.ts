import type { APIRoute } from "astro";

// N8N webhook endpoint for incoming call processing
export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`🔍 [N8N-INCOMING-${requestId}] POST request received`);
  console.log(`🔍 [N8N-INCOMING-${requestId}] URL:`, request.url);
  console.log(`🔍 [N8N-INCOMING-${requestId}] Timestamp:`, new Date().toISOString());

  try {
    // Parse the request body
    let requestData;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      requestData = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      requestData = Object.fromEntries(formData.entries());
    } else {
      // Try to parse as JSON anyway
      try {
        requestData = await request.json();
      } catch {
        requestData = {};
      }
    }

    console.log(
      `🔍 [N8N-INCOMING-${requestId}] Request data:`,
      JSON.stringify(requestData, null, 2)
    );
    console.log(`🔍 [N8N-INCOMING-${requestId}] Content-Type:`, contentType);

    // Extract call information
    const callSid = requestData.callSid;
    const from = requestData.from;
    const to = requestData.to;
    const callStatus = requestData.callStatus;
    const source = requestData.source;

    console.log(`🔍 [N8N-INCOMING-${requestId}] Call details:`, {
      callSid,
      from,
      to,
      callStatus,
      source,
    });

    // Process the incoming call data
    console.log(`🔍 [N8N-INCOMING-${requestId}] Processing incoming call...`);

    // Here you would typically:
    // 1. Store the call data in your database
    // 2. Trigger any business logic
    // 3. Send notifications
    // 4. Update call status

    // For now, just log and acknowledge
    const response = {
      success: true,
      message: "Incoming call processed successfully",
      callSid,
      timestamp: new Date().toISOString(),
      requestId,
      processingTime: Date.now() - startTime,
    };

    console.log(`✅ [N8N-INCOMING-${requestId}] Response:`, response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(`❌ [N8N-INCOMING-${requestId}] Error:`, error);

    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      requestId,
      processingTime: Date.now() - startTime,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

// Test endpoint
export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [N8N-INCOMING] GET request received - testing connectivity");

  return new Response("N8N incoming call webhook endpoint is working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
