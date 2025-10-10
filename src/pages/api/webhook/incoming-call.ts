import type { APIRoute } from "astro";

// MessageBird Voice webhook handler for n8n → Claude → ElevenLabs pipeline
export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [MESSAGEBIRD-WEBHOOK] GET request received - testing connectivity");
  console.log("🔍 [MESSAGEBIRD-WEBHOOK] Request URL:", request.url);
  console.log("🔍 [MESSAGEBIRD-WEBHOOK] User-Agent:", request.headers.get("user-agent"));

  return new Response("MessageBird Voice webhook endpoint is working!", {
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

    console.log("📞 [MESSAGEBIRD-WEBHOOK] Incoming call received:", body);
    console.log(
      "📞 [MESSAGEBIRD-WEBHOOK] Request headers:",
      Object.fromEntries(request.headers.entries())
    );
    console.log("📞 [MESSAGEBIRD-WEBHOOK] Request method:", request.method);
    console.log("📞 [MESSAGEBIRD-WEBHOOK] Request URL:", request.url);
    console.log("📞 [MESSAGEBIRD-WEBHOOK] User-Agent:", request.headers.get("user-agent"));
    console.log(
      "📞 [MESSAGEBIRD-WEBHOOK] X-Forwarded-For:",
      request.headers.get("x-forwarded-for")
    );
    console.log("📞 [MESSAGEBIRD-WEBHOOK] Remote Address:", request.headers.get("x-real-ip"));
    console.log("📞 [MESSAGEBIRD-WEBHOOK] JWT Token:", jwtToken ? "Present" : "Missing");
    console.log("📞 [MESSAGEBIRD-WEBHOOK] Authorization Header:", authHeader);

    // Extract call information from MessageBird webhook
    const callId = body.callId || body.call_id;
    const from = body.from || body.caller;
    const to = body.to || body.called;
    const callStatus = body.status || body.call_status;
    const conversationId = body.conversationId || body.conversation_id;

    console.log("📞 [MESSAGEBIRD-WEBHOOK] Call details:", {
      callId,
      from,
      to,
      callStatus,
      conversationId,
    });

    // Handle different MessageBird webhook events
    if (callStatus === "ringing" || callStatus === "started") {
      console.log("📞 [MESSAGEBIRD-WEBHOOK] Call started - forwarding to n8n pipeline");

      // Forward to n8n webhook for Claude → ElevenLabs processing
      try {
        const n8nWebhookUrl =
          import.meta.env.N8N_WEBHOOK_URL || "https://your-n8n-instance.com/webhook/voice-ai";

        const n8nPayload = {
          callId,
          from,
          to,
          conversationId,
          timestamp: new Date().toISOString(),
          source: "messagebird",
          webhookData: body,
        };

        console.log("📞 [MESSAGEBIRD-WEBHOOK] Forwarding to n8n:", n8nWebhookUrl);

        // Forward to n8n (fire and forget for now)
        fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.N8N_WEBHOOK_TOKEN || ""}`,
          },
          body: JSON.stringify(n8nPayload),
        }).catch((err) => {
          console.error("❌ [MESSAGEBIRD-WEBHOOK] Failed to forward to n8n:", err);
        });
      } catch (error) {
        console.error("❌ [MESSAGEBIRD-WEBHOOK] Error forwarding to n8n:", error);
      }
    }

    // Return MessageBird NCCO response for call control
    console.log("✅ [MESSAGEBIRD-WEBHOOK] Returning NCCO response");
    return new Response(
      JSON.stringify({
        ncco: [
          {
            action: "talk",
            text: "Hello! This is your AI assistant. How can I help you today?",
            voiceName: "Amy",
          },
          {
            action: "record",
            eventUrl: [`${import.meta.env.SITE_URL}/api/webhook/voice-recording`],
            eventMethod: "POST",
            endOnSilence: 3,
            endOnKey: "#",
            beepStart: true,
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
    console.error("❌ [MESSAGEBIRD-WEBHOOK] Error:", error);

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
