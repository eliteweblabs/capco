import type { APIRoute } from "astro";

// Webhook that explicitly handles Railway's CSRF protection
export const POST: APIRoute = async ({ request }) => {
  console.log("🔍 [RAILWAY-SECURITY-BYPASS] POST request received");
  console.log("🔍 [RAILWAY-SECURITY-BYPASS] Method:", request.method);
  console.log("🔍 [RAILWAY-SECURITY-BYPASS] URL:", request.url);
  console.log("🔍 [RAILWAY-SECURITY-BYPASS] Headers:", Object.fromEntries(request.headers.entries()));
  
  // Return TwiML response with explicit headers to bypass Railway's CSRF protection
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Railway security bypass webhook is working! I can see your request.</Say>
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
        "X-XSS-Protection": "1; mode=block",
      },
    }
  );
};

export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [RAILWAY-SECURITY-BYPASS] GET request received");
  return new Response("Railway security bypass webhook GET endpoint is working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};