import type { APIRoute } from "astro";

// Debug webhook to see exactly what Twilio sends
export const POST: APIRoute = async ({ request }) => {
  console.log("🔍 [DEBUG-TWILIO] POST request received");
  console.log("🔍 [DEBUG-TWILIO] Method:", request.method);
  console.log("🔍 [DEBUG-TWILIO] URL:", request.url);
  console.log("🔍 [DEBUG-TWILIO] Headers:", Object.fromEntries(request.headers.entries()));
  
  try {
    const formData = await request.formData();
    console.log("🔍 [DEBUG-TWILIO] Form data:", Object.fromEntries(formData.entries()));
  } catch (error) {
    console.log("🔍 [DEBUG-TWILIO] Error reading form data:", error);
  }
  
  // Return simple TwiML response
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Debug webhook is working! I can see your request.</Say>
</Response>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    }
  );
};

export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [DEBUG-TWILIO] GET request received");
  return new Response("Debug webhook GET endpoint is working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
