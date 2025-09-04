import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  console.log("🧪 [TEST-UPDATE-STATUS] API route called!");
  console.log("🧪 [TEST-UPDATE-STATUS] Request URL:", request.url);
  console.log("🧪 [TEST-UPDATE-STATUS] Request method:", request.method);
  
  const body = await request.json();
  console.log("🧪 [TEST-UPDATE-STATUS] Request body:", body);
  
  return new Response(JSON.stringify({
    success: true,
    message: "Test endpoint working",
    receivedBody: body
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
