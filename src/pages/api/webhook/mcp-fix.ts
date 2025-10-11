import type { APIRoute } from "astro";

// Webhook that explicitly handles Railway's CSRF protection
export const POST: APIRoute = async ({ request }) => {
  console.log("🔍 [MCP-FIX] POST request received");
  console.log("🔍 [MCP-FIX] Method:", request.method);
  console.log("🔍 [MCP-FIX] URL:", request.url);
  console.log("🔍 [MCP-FIX] Headers:", Object.fromEntries(request.headers.entries()));
  
  // Return TwiML response with explicit headers to bypass Railway's CSRF protection
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">MCP fix webhook is working! I can see your request.</Say>
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
  console.log("🔍 [MCP-FIX] GET request received");
  return new Response("MCP fix webhook GET endpoint is working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
