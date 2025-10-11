import type { APIRoute } from "astro";

// Simple test webhook to debug Twilio calls
export const POST: APIRoute = async ({ request }) => {
  console.log("🔍 [TWILIO-TEST] Webhook called!");
  console.log("🔍 [TWILIO-TEST] Request URL:", request.url);
  console.log("🔍 [TWILIO-TEST] Request method:", request.method);
  console.log("🔍 [TWILIO-TEST] Request headers:", Object.fromEntries(request.headers.entries()));

  try {
    const formData = await request.formData();
    console.log("🔍 [TWILIO-TEST] Form data:", Object.fromEntries(formData.entries()));

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Test webhook is working! This is a test response.</Say>
</Response>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/xml",
        },
      }
    );
  } catch (error) {
    console.error("❌ [TWILIO-TEST] Error:", error);

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Test webhook error occurred.</Say>
</Response>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/xml",
        },
      }
    );
  }
};

export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [TWILIO-TEST] GET request received");
  return new Response("Twilio test webhook endpoint is working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
