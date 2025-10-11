import type { APIRoute } from "astro";

// Agora voice webhook handler for voice AI pipeline
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    console.log("🎙️ [AGORA-VOICE] Voice webhook received:", body);
    
    // Extract voice information from Agora webhook
    const channelName = body.channelName || body.channel_name;
    const uid = body.uid;
    const eventType = body.eventType || body.event_type;
    const timestamp = body.timestamp;
    const recordingUrl = body.recordingUrl || body.recording_url;
    
    console.log("🎙️ [AGORA-VOICE] Voice details:", {
      channelName,
      uid,
      eventType,
      timestamp,
      recordingUrl,
    });
    
    // Handle different Agora events
    if (eventType === "user_joined" || eventType === "user_started_audio") {
      console.log("🎙️ [AGORA-VOICE] User started audio - forwarding to n8n pipeline");
      
      // Forward to n8n webhook for Claude → ElevenLabs processing
      try {
        const n8nWebhookUrl = import.meta.env.N8N_WEBHOOK_URL || "https://your-n8n-instance.com/webhook/voice-ai";
        
        const n8nPayload = {
          channelName,
          uid,
          eventType,
          timestamp,
          source: "agora-voice",
          webhookData: body,
        };
        
        console.log("🎙️ [AGORA-VOICE] Forwarding to n8n:", n8nWebhookUrl);
        
        // Forward to n8n (fire and forget for now)
        fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.N8N_WEBHOOK_TOKEN || ""}`,
          },
          body: JSON.stringify(n8nPayload),
        }).catch((err) => {
          console.error("❌ [AGORA-VOICE] Failed to forward to n8n:", err);
        });
      } catch (error) {
        console.error("❌ [AGORA-VOICE] Error forwarding to n8n:", error);
      }
    }
    
    // Handle recording events
    if (recordingUrl && eventType === "recording_started") {
      console.log("🎙️ [AGORA-VOICE] Recording started - forwarding to n8n");
      
      try {
        const n8nWebhookUrl = import.meta.env.N8N_WEBHOOK_URL || "https://your-n8n-instance.com/webhook/voice-recording";
        
        const n8nPayload = {
          recordingUrl,
          channelName,
          uid,
          eventType,
          timestamp,
          source: "agora-recording",
          webhookData: body,
        };
        
        console.log("🎙️ [AGORA-VOICE] Forwarding recording to n8n:", n8nWebhookUrl);
        
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
          console.log("✅ [AGORA-VOICE] Successfully forwarded to n8n");
        } else {
          console.error("❌ [AGORA-VOICE] Failed to forward to n8n:", response.status);
        }
      } catch (error) {
        console.error("❌ [AGORA-VOICE] Error forwarding to n8n:", error);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Agora voice event processed",
        channelName,
        uid,
        eventType,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ [AGORA-VOICE] Error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: "Processing failed",
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

// Test endpoint
export const GET: APIRoute = async ({ request }) => {
  console.log("🔍 [AGORA-VOICE] GET request received - testing connectivity");
  
  return new Response("Agora voice webhook endpoint is working!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
