import type { APIRoute } from "astro";

// Vonage voice recording webhook handler
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    console.log("🎙️ [VONAGE-RECORDING] Recording webhook received:", body);

    // Extract recording information
    const recordingUrl = body.recording_url || body.recordingUrl;
    const callId = body.callId || body.call_id;
    const conversationId = body.conversationId || body.conversation_id;
    const duration = body.duration;
    const size = body.size;

    console.log("🎙️ [VONAGE-RECORDING] Recording details:", {
      recordingUrl,
      callId,
      conversationId,
      duration,
      size,
    });

    if (recordingUrl) {
      // Forward recording to n8n for processing with Claude + ElevenLabs
      try {
        const n8nWebhookUrl =
          import.meta.env.N8N_WEBHOOK_URL ||
          "https://your-n8n-instance.com/webhook/voice-recording";

        const n8nPayload = {
          recordingUrl,
          callId,
          conversationId,
          duration,
          size,
          timestamp: new Date().toISOString(),
          source: "vonage-recording",
          webhookData: body,
        };

        console.log("🎙️ [VONAGE-RECORDING] Forwarding recording to n8n:", n8nWebhookUrl);

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
          console.log("✅ [VONAGE-RECORDING] Successfully forwarded to n8n");
        } else {
          console.error("❌ [VONAGE-RECORDING] Failed to forward to n8n:", response.status);
        }
      } catch (error) {
        console.error("❌ [VONAGE-RECORDING] Error forwarding to n8n:", error);
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Recording processed" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ [VONAGE-RECORDING] Error:", error);

    return new Response(JSON.stringify({ success: false, error: "Processing failed" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
