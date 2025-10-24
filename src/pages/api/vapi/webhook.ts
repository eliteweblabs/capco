import type { APIRoute } from "astro";

/**
 * Vapi.ai Webhook Handler
 *
 * Handles incoming calls from Vapi.ai and routes them to Cal.com operations
 */

interface VapiWebhookData {
  call: {
    id: string;
    status: "queued" | "ringing" | "in-progress" | "ended" | "failed";
    startedAt?: string;
    endedAt?: string;
    cost?: number;
    costBreakdown?: any;
    transcript?: {
      messages: Array<{
        role: "user" | "assistant";
        message: string;
        timestamp: number;
      }>;
    };
    summary?: string;
    analysis?: {
      intent: string;
      entities: any;
      sentiment: string;
      topics: string[];
    };
  };
  message?: {
    type: "transcript" | "function-call" | "status-update";
    transcript?: {
      role: "user" | "assistant";
      message: string;
      timestamp: number;
    };
    functionCall?: {
      name: string;
      parameters: any;
    };
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: VapiWebhookData = await request.json();
    console.log("🤖 [VAPI-WEBHOOK] Received webhook:", body);

    // Handle different message types
    if (body.message) {
      switch (body.message.type) {
        case "function-call":
          return await handleFunctionCall(body.message.functionCall);
        case "transcript":
          return await handleTranscript(body.message.transcript);
        case "status-update":
          return await handleStatusUpdate(body.call);
        default:
          console.log("🤖 [VAPI-WEBHOOK] Unknown message type:", body.message.type);
          return new Response(JSON.stringify({ success: false, error: "Unknown message type" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
      }
    }

    // Handle call status updates
    if (body.call) {
      return await handleCallStatus(body.call);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [VAPI-WEBHOOK] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Handle function calls from Vapi.ai
async function handleFunctionCall(functionCall: any) {
  if (!functionCall) return;

  console.log("🤖 [VAPI-WEBHOOK] Function call:", functionCall.name, functionCall.parameters);

  try {
    // Handle call termination
    if (functionCall.name === "end_call") {
      console.log("🤖 [VAPI-WEBHOOK] Call termination requested:", functionCall.parameters.reason);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Call terminated successfully",
          reason: functionCall.parameters.reason,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Route to Cal.com integration for other functions
    // Handle special cases for function name mapping
    let type, action;
    if (functionCall.name === "appointment_availability") {
      type = "availability";
      action = "read";
    } else if (functionCall.name === "availability_read") {
      type = "availability";
      action = "read";
    } else {
      type = functionCall.name.split("_")[0]; // Extract type from function name
      action = functionCall.name.split("_")[1]; // Extract action from function name
    }

    const response = await fetch(`${process.env.SITE_URL}/api/vapi/cal-integration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VAPI_API_SECRET}`,
      },
      body: JSON.stringify({
        type,
        action,
        data: functionCall.parameters,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cal.com integration error: ${response.status}`);
    }

    const result = await response.json();
    console.log("🤖 [VAPI-WEBHOOK] Function call result:", result);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [VAPI-WEBHOOK] Function call error:", error);
    return new Response(JSON.stringify({ error: "Function call failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Handle transcript messages
async function handleTranscript(transcript: any) {
  if (!transcript) return;

  console.log("🤖 [VAPI-WEBHOOK] Transcript:", transcript.role, transcript.message);

  // Store transcript in database or send to analytics
  // This could be used for training or analysis

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// Handle call status updates
async function handleCallStatus(call: any) {
  console.log("🤖 [VAPI-WEBHOOK] Call status:", call.status, call.id);

  // Log call analytics
  if (call.status === "ended") {
    const duration =
      call.endedAt && call.startedAt
        ? new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()
        : null;

    console.log("🤖 [VAPI-WEBHOOK] Call ended:", {
      id: call.id,
      duration: duration ? `${Math.round(duration / 1000)}s` : "unknown",
      cost: call.cost,
      summary: call.summary,
    });

    // Alert if call was expensive or long
    if (call.cost && call.cost > 1.0) {
      console.warn("🚨 [VAPI-WEBHOOK] Expensive call detected:", {
        id: call.id,
        cost: call.cost,
        duration: duration ? `${Math.round(duration / 1000)}s` : "unknown",
      });
    }
  }

  // Alert for long-running calls
  if (call.status === "in-progress" && call.startedAt) {
    const duration = Date.now() - new Date(call.startedAt).getTime();
    if (duration > 300000) {
      // 5 minutes
      console.warn("🚨 [VAPI-WEBHOOK] Long-running call detected:", {
        id: call.id,
        duration: `${Math.round(duration / 1000)}s`,
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// Handle status updates
async function handleStatusUpdate(call: any) {
  console.log("🤖 [VAPI-WEBHOOK] Status update:", call.status);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
