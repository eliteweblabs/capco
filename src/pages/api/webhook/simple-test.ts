import type { APIRoute } from "astro";

// Super simple test webhook
export const POST: APIRoute = async ({ request }) => {
  console.log("🔍 [SIMPLE-TEST] POST request received");
  console.log("🔍 [SIMPLE-TEST] Method:", request.method);
  console.log("🔍 [SIMPLE-TEST] URL:", request.url);
  
  return new Response("POST request received successfully!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};

export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [SIMPLE-TEST] GET request received");
  return new Response("GET request received successfully!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
