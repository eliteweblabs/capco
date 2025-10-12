import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("🔗 [WEBHOOK] Received webhook request from N8N");

    // Get the request body
    const body = await request.text();
    console.log("📦 [WEBHOOK] Body:", body);

    // Get headers
    const headers = Object.fromEntries(request.headers.entries());
    console.log("📋 [WEBHOOK] Headers:", headers);

    // Parse JSON if possible
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      data = body;
    }

    console.log("✅ [WEBHOOK] Processed data from N8N:", data);

    // Handle different types of N8N responses
    if (data && typeof data === "object") {
      // Handle Twilio call responses
      if (data.callSid && data.action === "twilio_response") {
        console.log("📞 [WEBHOOK] Processing Twilio call response from N8N");
        // Here you would typically update your database or trigger other actions
        // based on the N8N processing results
      }

      // Handle SMS responses
      if (data.message && data.action === "sms_response") {
        console.log("📱 [WEBHOOK] Processing SMS response from N8N");
        // Handle SMS responses
      }

      // Handle general AI responses
      if (data.aiResponse) {
        console.log("🤖 [WEBHOOK] Processing AI response from N8N:", data.aiResponse);
        // Handle AI-generated responses
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "N8N webhook processed successfully",
        timestamp: new Date().toISOString(),
        processed: true,
        data: data,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("❌ [WEBHOOK] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export const GET: APIRoute = async ({ request }) => {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Webhook endpoint is active",
      timestamp: new Date().toISOString(),
      method: "GET",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};
