import type { APIRoute } from "astro";

// Twilio webhook that uses GET requests to bypass CSRF protection
export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [TWILIO-GET] GET request received");
  console.log("🔍 [TWILIO-GET] URL:", request.url);
  console.log(
    "🔍 [TWILIO-GET] Query params:",
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );

  // Extract call information from query parameters
  const callSid = new URL(request.url).searchParams.get("CallSid");
  const from = new URL(request.url).searchParams.get("From");
  const to = new URL(request.url).searchParams.get("To");
  const callStatus = new URL(request.url).searchParams.get("CallStatus");

  console.log("🔍 [TWILIO-GET] Call details:", {
    callSid,
    from,
    to,
    callStatus,
  });

  // Forward to n8n webhook for Claude → ElevenLabs processing
  if (callSid && from && to) {
    try {
      const n8nWebhookUrl =
        import.meta.env.N8N_WEBHOOK_URL || "https://your-n8n-instance.com/webhook/voice-ai";

      const n8nPayload = {
        callSid,
        from,
        to,
        callStatus,
        timestamp: new Date().toISOString(),
        source: "twilio-get",
        webhookData: Object.fromEntries(new URL(request.url).searchParams.entries()),
      };

      console.log("🔍 [TWILIO-GET] Forwarding to n8n:", n8nWebhookUrl);

      // Forward to n8n (fire and forget for now)
      fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.N8N_WEBHOOK_TOKEN || ""}`,
        },
        body: JSON.stringify(n8nPayload),
      }).catch((err) => {
        console.error("❌ [TWILIO-GET] Failed to forward to n8n:", err);
      });
    } catch (error) {
      console.error("❌ [TWILIO-GET] Error forwarding to n8n:", error);
    }
  }

  // Return TwiML response
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! This is your AI assistant. How can I help you today?</Say>
  <Record maxLength="30" action="${import.meta.env.SITE_URL}/api/webhook/twilio-recording" method="POST" />
</Response>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    }
  );
};
