import type { APIRoute } from "astro";

// Vonage Voice webhook handler for n8n → Claude → ElevenLabs pipeline
export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [VONAGE-WEBHOOK] GET request received - testing connectivity");
  console.log("🔍 [VONAGE-WEBHOOK] Request URL:", request.url);
  console.log("🔍 [VONAGE-WEBHOOK] User-Agent:", request.headers.get("user-agent"));

  return new Response("Vonage Voice webhook endpoint is working!", {
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

    console.log("📞 [VONAGE-WEBHOOK] Incoming call received:", body);
    console.log(
      "📞 [VONAGE-WEBHOOK] Request headers:",
      Object.fromEntries(request.headers.entries())
    );
    console.log("📞 [VONAGE-WEBHOOK] Request method:", request.method);
    console.log("📞 [VONAGE-WEBHOOK] Request URL:", request.url);
    console.log("📞 [VONAGE-WEBHOOK] User-Agent:", request.headers.get("user-agent"));
    console.log(
      "📞 [VONAGE-WEBHOOK] X-Forwarded-For:",
      request.headers.get("x-forwarded-for")
    );
    console.log("📞 [VONAGE-WEBHOOK] Remote Address:", request.headers.get("x-real-ip"));
    console.log("📞 [VONAGE-WEBHOOK] JWT Token:", jwtToken ? "Present" : "Missing");
    console.log("📞 [VONAGE-WEBHOOK] Authorization Header:", authHeader);

    // Extract call information from Vonage webhook
    const callId = body.callId || body.call_id;
    const from = body.from || body.caller;
    const to = body.to || body.called;
    const callStatus = body.status || body.call_status;
    const conversationId = body.conversationId || body.conversation_id;

    console.log("📞 [VONAGE-WEBHOOK] Call details:", {
      callId,
      from,
      to,
      callStatus,
      conversationId,
    });

    // Handle different Vonage webhook events
    if (callStatus === "ringing" || callStatus === "started") {
      console.log("📞 [VONAGE-WEBHOOK] Call started - forwarding to n8n pipeline");

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
          source: "vonage",
          webhookData: body,
        };

        console.log("📞 [VONAGE-WEBHOOK] Forwarding to n8n:", n8nWebhookUrl);

        // Forward to n8n (fire and forget for now)
        fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.N8N_WEBHOOK_TOKEN || ""}`,
          },
          body: JSON.stringify(n8nPayload),
        }).catch((err) => {
          console.error("❌ [VONAGE-WEBHOOK] Failed to forward to n8n:", err);
        });
      } catch (error) {
        console.error("❌ [VONAGE-WEBHOOK] Error forwarding to n8n:", error);
      }
    }

    // Return Vonage NCCO response for call control
    console.log("✅ [VONAGE-WEBHOOK] Returning NCCO response");
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
            eventUrl: [`${import.meta.env.SITE_URL}/api/webhook/vonage-recording`],
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
    console.error("❌ [VONAGE-WEBHOOK] Error:", error);

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
