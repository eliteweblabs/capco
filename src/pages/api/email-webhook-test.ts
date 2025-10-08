import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  console.log("📧 [EMAIL-WEBHOOK-TEST] GET request received");
  return new Response(
    JSON.stringify({
      success: true,
      message: "Email webhook test endpoint is working",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  console.log("📧 [EMAIL-WEBHOOK-TEST] POST request received");
  
  try {
    const body = await request.json();
    console.log("📧 [EMAIL-WEBHOOK-TEST] Request body:", JSON.stringify(body, null, 2));
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Email webhook test processed",
        receivedData: body,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("📧 [EMAIL-WEBHOOK-TEST] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process webhook",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
