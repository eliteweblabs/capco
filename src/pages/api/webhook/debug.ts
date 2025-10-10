import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [DEBUG] GET request received at:", new Date().toISOString());
  console.log("🔍 [DEBUG] Request URL:", request.url);
  console.log("🔍 [DEBUG] Request headers:", Object.fromEntries(request.headers.entries()));
  
  return new Response("Debug endpoint working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  console.log("🔍 [DEBUG] POST request received at:", new Date().toISOString());
  console.log("🔍 [DEBUG] Request URL:", request.url);
  console.log("🔍 [DEBUG] Request headers:", Object.fromEntries(request.headers.entries()));
  console.log("🔍 [DEBUG] Request body:", body);
  
  return new Response("Debug POST endpoint working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
