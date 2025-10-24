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

    // Route Cal.com function calls to the integration API
    const calcomFunctions = ["staff_read", "appointment_availability", "create_booking"];
    if (calcomFunctions.includes(functionCall.name)) {
      console.log("🤖 [VAPI-WEBHOOK] Routing to Cal.com integration:", functionCall.name);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        // Map VAPI function calls to Cal.com integration actions
        let action = "";
        let params = {};

        switch (functionCall.name) {
          case "staff_read":
            action = "get_users";
            break;
          case "appointment_availability":
            action = "get_availability";
            params = {
              eventTypeId: functionCall.parameters.eventTypeId,
              startDate: functionCall.parameters.startDate,
              endDate: functionCall.parameters.endDate,
            };
            break;
          case "create_booking":
            action = "create_booking";
            params = {
              eventTypeId: functionCall.parameters.eventTypeId,
              startTime: functionCall.parameters.startTime,
              endTime: functionCall.parameters.endTime,
              attendeeName: functionCall.parameters.attendeeName,
              attendeeEmail: functionCall.parameters.attendeeEmail,
              notes: functionCall.parameters.notes,
            };
            break;
        }

        const response = await fetch(
          `${process.env.SITE_URL || "http://localhost:4321"}/api/vapi/cal-integration`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Vapi-System": "true",
            },
            body: JSON.stringify({
              action,
              ...params,
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Cal.com integration failed: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ [VAPI-WEBHOOK] Cal.com integration success:", result);

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    }

    // Handle other function calls
    console.log(
      "🤖 [VAPI-WEBHOOK] Function call received:",
      functionCall.name,
      functionCall.parameters
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Function call processed",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [VAPI-WEBHOOK] Function call error:", error);

    // Handle timeout specifically
    if (error.name === "AbortError") {
      console.log("⏰ [VAPI-WEBHOOK] Function call timed out");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Function call timed out",
          message:
            "I'm having trouble accessing our scheduling system right now. Let me help you with general availability instead.",
        }),
        {
          status: 200, // Return 200 to keep the call alive
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Function call failed",
        message:
          "I'm having trouble accessing our scheduling system right now. Let me help you with general availability instead.",
      }),
      {
        status: 200, // Return 200 to keep the call alive
        headers: { "Content-Type": "application/json" },
      }
    );
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
