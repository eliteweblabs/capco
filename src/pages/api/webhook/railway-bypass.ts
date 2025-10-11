import type { APIRoute } from "astro";

// Webhook that explicitly handles Railway's CSRF protection
export const POST: APIRoute = async ({ request }) => {
  console.log("🔍 [RAILWAY-BYPASS] POST request received");
  console.log("🔍 [RAILWAY-BYPASS] Method:", request.method);
  console.log("🔍 [RAILWAY-BYPASS] URL:", request.url);
  console.log("🔍 [RAILWAY-BYPASS] Headers:", Object.fromEntries(request.headers.entries()));
  
  // Return TwiML response with explicit headers to bypass Railway's CSRF protection
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Railway bypass webhook is working! I can see your request.</Say>
</Response>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "X-Frame-Options": "SAMEORIGIN",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
};

export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [RAILWAY-BYPASS] GET request received");
  return new Response("Railway bypass webhook GET endpoint is working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
