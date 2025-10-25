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
    type:
      | "transcript"
      | "function-call"
      | "status-update"
      | "speech-update"
      | "conversation-update";
    transcript?: {
      role: "user" | "assistant";
      message: string;
      timestamp: number;
    };
    functionCall?: {
      name: string;
      parameters: any;
    };
    speech?: {
      text: string;
      role: "user" | "assistant";
    };
    conversation?: {
      status: string;
      message: string;
    };
  };
}

export const POST: APIRoute = async ({ request }): Promise<Response> => {
  try {
    const body: VapiWebhookData = await request.json();
    console.log("🤖 [VAPI-WEBHOOK] Received webhook:", body);

    // Handle different message types
    if (body.message) {
      try {
        switch (body.message.type) {
          case "function-call":
            return await handleFunctionCall(body.message.functionCall);
          case "transcript":
            return await handleTranscript(body.message.transcript);
          case "status-update":
            // For status-update, we want to acknowledge it and continue
            console.log("🔄 [VAPI-WEBHOOK] Status update received:", body.message);
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          case "speech-update":
            // Speech updates are informational only, just acknowledge them
            console.log("🗣️ [VAPI-WEBHOOK] Speech update:", body.message.speech);
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          case "conversation-update":
            // Conversation updates are informational only, just acknowledge them
            console.log("💬 [VAPI-WEBHOOK] Conversation update:", body.message.conversation);
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          default:
            console.log("🤖 [VAPI-WEBHOOK] Unknown message type:", body.message.type);
            // Return 200 instead of 400 to keep the call alive
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
        }
      } catch (error) {
        console.error("❌ [VAPI-WEBHOOK] Error handling message:", error);
        // Always return 200 for message handling to keep the call alive
        return new Response(
          JSON.stringify({
            success: false,
            error: "Message handling error",
            message: "Continuing with call...",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
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
    // Always return 200 to keep the call alive, even for parsing errors
    return new Response(
      JSON.stringify({
        success: false,
        error: "Request processing error",
        message: "Continuing with call...",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Handle function calls from Vapi.ai
async function handleFunctionCall(functionCall: any): Promise<Response> {
  if (!functionCall) {
    return new Response(JSON.stringify({ success: false, error: "No function call provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("🤖 [VAPI-WEBHOOK] Function call:", functionCall.name, functionCall.parameters);

  // Validate date format (ISO with timezone)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

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
    const calcomFunctions = ["checkAvailability", "bookAppointment"];
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
          case "checkAvailability":
            // Validate required parameters
            if (!functionCall.parameters.dateFrom || !functionCall.parameters.dateTo) {
              console.error(
                "❌ [VAPI-WEBHOOK] Missing required parameters for checkAvailability:",
                functionCall.parameters
              );
              throw new Error(
                `Missing required parameters: ${[
                  !functionCall.parameters.dateFrom && "dateFrom",
                  !functionCall.parameters.dateTo && "dateTo",
                ]
                  .filter(Boolean)
                  .join(", ")}`
              );
            }
            // Validate date format (ISO with timezone)
            if (
              !isoDateRegex.test(functionCall.parameters.dateFrom) ||
              !isoDateRegex.test(functionCall.parameters.dateTo)
            ) {
              console.error("❌ [VAPI-WEBHOOK] Invalid date format:", functionCall.parameters);
              throw new Error(
                "Dates must be in ISO format with timezone (e.g., 2024-10-24T00:00:00.000Z)"
              );
            }
            action = "get_availability";
            params = {
              dateFrom: functionCall.parameters.dateFrom,
              dateTo: functionCall.parameters.dateTo,
            };
            break;
          case "bookAppointment":
            // Validate required parameters
            if (
              !functionCall.parameters.start ||
              !functionCall.parameters.name ||
              !functionCall.parameters.email
            ) {
              console.error(
                "❌ [VAPI-WEBHOOK] Missing required parameters for bookAppointment:",
                functionCall.parameters
              );
              throw new Error(
                `Missing required parameters: ${[
                  !functionCall.parameters.start && "start",
                  !functionCall.parameters.name && "name",
                  !functionCall.parameters.email && "email",
                ]
                  .filter(Boolean)
                  .join(", ")}`
              );
            }
            // Validate date format (ISO with timezone)
            if (!isoDateRegex.test(functionCall.parameters.start)) {
              console.error("❌ [VAPI-WEBHOOK] Invalid date format:", functionCall.parameters);
              throw new Error(
                "Start time must be in ISO format with timezone (e.g., 2024-10-24T14:00:00.000Z)"
              );
            }
            // Validate phone number format if provided
            if (functionCall.parameters.smsReminderNumber) {
              const phoneRegex = /^\+\d{10,15}$/;
              if (!phoneRegex.test(functionCall.parameters.smsReminderNumber)) {
                console.error(
                  "❌ [VAPI-WEBHOOK] Invalid phone number format:",
                  functionCall.parameters
                );
                throw new Error("Phone number must be in E.164 format (e.g., +12345678900)");
              }
            }
            action = "create_booking";
            params = {
              start: functionCall.parameters.start,
              name: functionCall.parameters.name,
              email: functionCall.parameters.email,
              smsReminderNumber: functionCall.parameters.smsReminderNumber,
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
    if (error instanceof Error && error.name === "AbortError") {
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
async function handleTranscript(transcript: any): Promise<Response> {
  if (!transcript) {
    return new Response(JSON.stringify({ success: false, error: "No transcript provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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
