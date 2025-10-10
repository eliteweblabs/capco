import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [WEBHOOK] GET request received - testing connectivity");
  console.log("🔍 [WEBHOOK] Request URL:", request.url);
  console.log("🔍 [WEBHOOK] User-Agent:", request.headers.get("user-agent"));

  return new Response("Webhook endpoint is working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization");
    const jwtToken = authHeader?.replace("Bearer ", "");

    console.log("📞 [WEBHOOK] Incoming call received:", body);
    console.log("📞 [WEBHOOK] Request headers:", Object.fromEntries(request.headers.entries()));
    console.log("📞 [WEBHOOK] Request method:", request.method);
    console.log("📞 [WEBHOOK] Request URL:", request.url);
    console.log("📞 [WEBHOOK] User-Agent:", request.headers.get("user-agent"));
    console.log("📞 [WEBHOOK] X-Forwarded-For:", request.headers.get("x-forwarded-for"));
    console.log("📞 [WEBHOOK] Remote Address:", request.headers.get("x-real-ip"));
    console.log("📞 [WEBHOOK] JWT Token:", jwtToken ? "Present" : "Missing");
    console.log("📞 [WEBHOOK] Authorization Header:", authHeader);

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
