import type { APIRoute } from "astro";

// Debug webhook to see what Twilio is sending
export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("🔍 [DEBUG-WEBHOOK] Received request");

    // Get all headers
    const headers = Object.fromEntries(request.headers.entries());
    console.log("🔍 [DEBUG-WEBHOOK] Headers:", headers);

    // Get form data
    const formData = await request.formData();
    const formEntries = Object.fromEntries(formData.entries());
    console.log("🔍 [DEBUG-WEBHOOK] Form data:", formEntries);

    // Get raw body
    const body = await request.text();
    console.log("🔍 [DEBUG-WEBHOOK] Raw body:", body);

    // Return debug info
    return new Response(
      JSON.stringify({
        success: true,
        message: "Debug webhook received",
        timestamp: new Date().toISOString(),
        headers,
        formData: formEntries,
        rawBody: body,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ [DEBUG-WEBHOOK] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Debug webhook endpoint is active",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
