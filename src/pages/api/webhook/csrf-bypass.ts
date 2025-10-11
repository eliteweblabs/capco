import type { APIRoute } from "astro";

// Webhook that explicitly disables CSRF protection
export const POST: APIRoute = async ({ request }) => {
  console.log("🔍 [CSRF-BYPASS] POST request received");
  console.log("🔍 [CSRF-BYPASS] Method:", request.method);
  console.log("🔍 [CSRF-BYPASS] URL:", request.url);
  console.log("🔍 [CSRF-BYPASS] Headers:", Object.fromEntries(request.headers.entries()));

  // Return TwiML response with explicit headers
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">CSRF bypass webhook is working! I can see your request.</Say>
</Response>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    }
  );
};

export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [CSRF-BYPASS] GET request received");
  return new Response("CSRF bypass webhook GET endpoint is working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
