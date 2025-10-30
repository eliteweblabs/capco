import type { APIRoute } from "astro";
import { ensureProtocol } from "../../../lib/url-utils";

// Twilio incoming call webhook handler for voice AI pipeline
export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    console.log("📞 [TWILIO] Incoming call received");

    // Extract call information from Twilio webhook
    const callSid = formData.get("CallSid") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const callStatus = formData.get("CallStatus") as string;

    console.log("📞 [TWILIO] Call details:", {
      callSid,
      from,
      to,
      callStatus,
    });

    // Handle incoming call
    if (callStatus === "ringing" || callStatus === "in-progress") {
      console.log("📞 [TWILIO] Call started - forwarding to n8n pipeline");

      // Forward to n8n webhook for Claude → ElevenLabs processing
      try {
        const n8nWebhookUrl =
          import.meta.env.N8N_WEBHOOK_URL || "https://your-n8n-instance.com/webhook/voice-ai";

        const n8nPayload = {
          callSid,
          from,
          to,
          timestamp: new Date().toISOString(),
          source: "twilio",
          webhookData: Object.fromEntries(formData.entries()),
        };

        console.log("📞 [TWILIO] Forwarding to n8n:", n8nWebhookUrl);

        // Forward to n8n (fire and forget for now)
        fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.N8N_WEBHOOK_TOKEN || ""}`,
          },
          body: JSON.stringify(n8nPayload),
        }).catch((err) => {
          console.error("❌ [TWILIO] Failed to forward to n8n:", err);
        });
      } catch (error) {
        console.error("❌ [TWILIO] Error forwarding to n8n:", error);
      }
    }

    // Return TwiML response to control the call
    console.log("✅ [TWILIO] Returning TwiML response");
    const baseUrl = ensureProtocol(import.meta.env.RAILWAY_PUBLIC_DOMAIN || "http://localhost:4321");
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! This is your AI assistant. How can I help you today?</Say>
  <Record maxLength="30" action="${baseUrl}/api/webhook/twilio-recording" method="POST" />
</Response>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/xml",
        },
      }
    );
  } catch (error) {
    console.error("❌ [TWILIO] Error:", error);

    // Return basic TwiML response as fallback
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! This is your AI assistant. How can I help you today?</Say>
</Response>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/xml",
        },
      }
    );
  }
};

// Test endpoint
export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [TWILIO] GET request received - testing connectivity");

  return new Response("Twilio webhook endpoint is working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
