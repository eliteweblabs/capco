import type { APIRoute } from "astro";

// Raw webhook that bypasses any security middleware
export const POST: APIRoute = async ({ request }) => {
  console.log("🔍 [RAW-TEST] POST request received");
  console.log("🔍 [RAW-TEST] Method:", request.method);
  console.log("🔍 [RAW-TEST] URL:", request.url);
  console.log("🔍 [RAW-TEST] Headers:", Object.fromEntries(request.headers.entries()));
  
  // Return simple response without any security headers
  return new Response("Raw webhook is working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};

export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [RAW-TEST] GET request received");
  return new Response("Raw webhook GET endpoint is working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
