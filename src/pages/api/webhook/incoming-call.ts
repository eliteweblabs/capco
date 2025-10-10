import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    console.log("📞 [WEBHOOK] Incoming call received:", body);
    console.log("📞 [WEBHOOK] Request headers:", Object.fromEntries(request.headers.entries()));
    console.log("📞 [WEBHOOK] Request method:", request.method);
    console.log("📞 [WEBHOOK] Request URL:", request.url);

    // Return NCCO response directly (no N8N forwarding for now)
    console.log("✅ [WEBHOOK] Returning NCCO response");
    return new Response(
      JSON.stringify({
        ncco: [
          {
            action: "talk",
            text: "Hello! This is your AI assistant. How can I help you today?",
            voiceName: "Amy",
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ [WEBHOOK] Error:", error);

    // Return basic NCCO response as fallback
    return new Response(
      JSON.stringify({
        ncco: [
          {
            action: "talk",
            text: "Hello! This is your AI assistant. How can I help you today?",
            voiceName: "Amy",
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
