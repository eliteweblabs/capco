import type { APIRoute } from "astro";

/**
 * Vapi.ai Call API
 *
 * Initiates a voice call with the Vapi.ai assistant
 */

interface CallRequest {
  assistantId: string;
  customer: {
    number: string;
    name: string;
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: CallRequest = await request.json();
    const { assistantId, customer } = body;

    if (!assistantId || !customer?.number) {
      return new Response(
        JSON.stringify({
          error: "assistantId and customer.number are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const vapiApiKey = process.env.VAPI_API_KEY || "98d35715-e042-423f-a539-b7e36a5f113a";
    if (!vapiApiKey) {
      return new Response(
        JSON.stringify({
          error: "Vapi.ai API key not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create call with Vapi.ai
    const callResponse = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId,
        customer: {
          number: customer.number,
          name: customer.name || "User",
        },
        // Use Vapi's phone number service (not Twilio)
        phoneNumberId: "678ddf24-3d7e-4d3a-9e28-620382e71f56",
        // Optional: Add metadata for tracking
        metadata: {
          source: "calcom-booking",
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!callResponse.ok) {
      const error = await callResponse.text();
      console.error("❌ [VAPI-CALL] Vapi.ai error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to start voice call",
          details: error,
        }),
        {
          status: callResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const call = await callResponse.json();
    console.log("🎤 [VAPI-CALL] Call initiated:", call.id);

    return new Response(
      JSON.stringify({
        success: true,
        call: {
          id: call.id,
          status: call.status,
          assistantId: call.assistantId,
          customer: call.customer,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [VAPI-CALL] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
