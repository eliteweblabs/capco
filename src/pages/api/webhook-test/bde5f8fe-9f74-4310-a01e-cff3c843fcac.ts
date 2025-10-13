import type { APIRoute } from "astro";

// Twilio webhook handler for the configured URL
export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("📞 [TWILIO-WEBHOOK] Incoming call received");

    // Get form data from Twilio
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const callStatus = formData.get("CallStatus") as string;

    console.log("📞 [TWILIO-WEBHOOK] Call details:", {
      callSid,
      from,
      to,
      callStatus,
    });

    // Handle incoming call
    if (callStatus === "ringing" || callStatus === "in-progress") {
      console.log("📞 [TWILIO-WEBHOOK] Call started - processing with n8n");

      // Forward to n8n webhook for AI processing
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

        console.log("📞 [TWILIO-WEBHOOK] Forwarding to n8n:", n8nWebhookUrl);
        console.log("📞 [TWILIO-WEBHOOK] Payload:", n8nPayload);

        // Forward to n8n and wait for response
        const response = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.N8N_WEBHOOK_TOKEN || ""}`,
          },
          body: JSON.stringify(n8nPayload),
        });

        if (response.ok) {
          console.log("✅ [TWILIO-WEBHOOK] Successfully forwarded to n8n");
          
          // Get the AI response from n8n
          const aiResponse = await response.json();
          console.log("🤖 [TWILIO-WEBHOOK] AI Response:", aiResponse);
          
          // Return the AI-generated TwiML response
          const twimlResponse = aiResponse.twiml || aiResponse.response || `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${aiResponse.text || "Hello! This is your AI assistant. How can I help you today?"}</Say>
</Response>`;
          
          return new Response(twimlResponse, {
            status: 200,
            headers: {
              "Content-Type": "text/xml",
            },
          });
        } else {
          console.error("❌ [TWILIO-WEBHOOK] Failed to forward to n8n:", response.status);
        }
      } catch (error) {
        console.error("❌ [TWILIO-WEBHOOK] Error forwarding to n8n:", error);
      }
    }

    // Return default TwiML response if no AI processing
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
  } catch (error) {
    console.error("❌ [TWILIO-WEBHOOK] Error:", error);

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

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Twilio webhook endpoint is active",
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
