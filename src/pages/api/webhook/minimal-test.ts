import type { APIRoute } from "astro";

// Minimal webhook to test basic connectivity
export const POST: APIRoute = async ({ request }) => {
  console.log("🔍 [MINIMAL-TEST] POST request received");
  
  return new Response("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};

export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [MINIMAL-TEST] GET request received");
  return new Response("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
