import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  console.log("📱 [SEND-SMS] API called");

  try {
    const body = await request.json();
    const { phone, message } = body;

    console.log("📱 [SEND-SMS] Request data:", {
      phone,
      message: message?.substring(0, 50) + "...",
    });

    if (!phone || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Phone number and message are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get Bird.com/Messagebird API credentials from environment
    const messagebirdAccessKey = import.meta.env.MESSAGEBIRD_ACCESS_KEY;
    const messagebirdOriginator = import.meta.env.MESSAGEBIRD_ORIGINATOR;
    const birdApiUrl = import.meta.env.BIRD_API_URL || "https://rest.messagebird.com";

    if (!messagebirdAccessKey) {
      console.error("📱 [SEND-SMS] Messagebird access key not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "SMS service not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Prepare Messagebird API request
    const messagebirdPayload = {
      recipients: [phone],
      body: message,
      originator: messagebirdOriginator || "CAPCo",
      // Add any additional Messagebird specific parameters here
    };

    console.log("📱 [SEND-SMS] Sending to Messagebird API:", {
      recipients: [phone],
      messageLength: message.length,
      originator: messagebirdOriginator,
    });

    // Send SMS via Messagebird API
    const response = await fetch(`${birdApiUrl}/messages`, {
      method: "POST",
      headers: {
        Authorization: `AccessKey ${messagebirdAccessKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messagebirdPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("📱 [SEND-SMS] Messagebird API error:", responseData);
      return new Response(
        JSON.stringify({
          success: false,
          error: `SMS delivery failed: ${responseData.message || response.statusText}`,
          details: responseData,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("📱 [SEND-SMS] SMS sent successfully:", responseData);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: responseData.id || responseData.messageId,
        status: responseData.status,
        to: phone,
        message: "SMS sent successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("📱 [SEND-SMS] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// CORS preflight handler
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};
