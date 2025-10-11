import type { APIRoute } from "astro";

// Twilio recording webhook handler
export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    
    console.log("🎙️ [TWILIO-RECORDING] Recording webhook received");
    
    // Extract recording information
    const recordingUrl = formData.get("RecordingUrl") as string;
    const callSid = formData.get("CallSid") as string;
    const duration = formData.get("RecordingDuration") as string;
    const size = formData.get("RecordingSize") as string;
    
    console.log("🎙️ [TWILIO-RECORDING] Recording details:", {
      recordingUrl,
      callSid,
      duration,
      size,
    });
    
    if (recordingUrl) {
      // Forward recording to n8n for processing with Claude + ElevenLabs
      try {
        const n8nWebhookUrl = import.meta.env.N8N_WEBHOOK_URL || "https://your-n8n-instance.com/webhook/voice-recording";
        
        const n8nPayload = {
          recordingUrl,
          callSid,
          duration,
          size,
          timestamp: new Date().toISOString(),
          source: "twilio-recording",
          webhookData: Object.fromEntries(formData.entries()),
        };
        
        console.log("🎙️ [TWILIO-RECORDING] Forwarding recording to n8n:", n8nWebhookUrl);
        
        // Forward to n8n for AI processing
        const response = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.N8N_WEBHOOK_TOKEN || ""}`,
          },
          body: JSON.stringify(n8nPayload),
        });
        
        if (response.ok) {
          console.log("✅ [TWILIO-RECORDING] Successfully forwarded to n8n");
        } else {
          console.error("❌ [TWILIO-RECORDING] Failed to forward to n8n:", response.status);
        }
      } catch (error) {
        console.error("❌ [TWILIO-RECORDING] Error forwarding to n8n:", error);
      }
    }
    
    // Return TwiML response
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for your message. I'll process that and get back to you shortly.</Say>
  <Hangup />
</Response>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/xml",
        },
      }
    );
  } catch (error) {
    console.error("❌ [TWILIO-RECORDING] Error:", error);
    
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, there was an error processing your request.</Say>
  <Hangup />
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
  console.log("🔍 [TWILIO-RECORDING] GET request received - testing connectivity");
  
  return new Response("Twilio recording webhook endpoint is working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
