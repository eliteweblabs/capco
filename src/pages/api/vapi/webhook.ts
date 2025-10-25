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
      | "tool-calls"
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
    toolCallList?: Array<{
      id: string;
      type: string;
      function?: {
        name: string;
        arguments: string;
      };
      name?: string;
    }>;
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
    const messageType = body.message?.type || "unknown";

    console.log(`[---VAPI-WEBHOOK] ${messageType}`);

    // Only process function calls and call end status
    if (body.message?.type === "function-call") {
      return await handleFunctionCall(body.message.functionCall);
    } else if (body.message?.type === "tool-calls") {
      return await handleToolCalls(body.message);
    }

    // Acknowledge all other messages without processing
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[---VAPI-WEBHOOK] Error:", error);
    // Always return 200 to keep the call alive
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

// Handle tool calls (VAPI Custom Tools format)
async function handleToolCalls(message: any): Promise<Response> {
  try {
    console.log("[---VAPI-WEBHOOK] Processing tool calls...");

    const toolCallList = message.toolCallList || [];
    if (toolCallList.length === 0) {
      console.log("[---VAPI-WEBHOOK] No tool calls in list");
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const toolCall of toolCallList) {
      console.log(`[---VAPI-WEBHOOK] Tool call:`, toolCall.id);
      
      // Always call the endpoint regardless of function name (for debugging)
      const response = await fetch(
        `${process.env.SITE_URL || "http://localhost:4321"}/api/vapi/cal-integration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Vapi-System": "true",
          },
          body: JSON.stringify({
            action: "get_account_info",
          }),
        }
      );

      const data = await response.json();
      console.log(`[---VAPI-WEBHOOK] Result:`, data.result?.substring(0, 50) + "...");
      
      results.push({
        toolCallId: toolCall.id,
        result: data.result,
      });
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[---VAPI-WEBHOOK] Tool error:", error);
    return new Response(
      JSON.stringify({
        results: [
          {
            toolCallId: "error",
            result: "I'm having trouble accessing that information right now.",
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handle function calls from Vapi.ai (legacy format)
async function handleFunctionCall(functionCall: any): Promise<Response> {
  if (!functionCall) {
    return new Response(JSON.stringify({ success: false, error: "No function call provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only log function name for clarity
  console.log("🤖 [VAPI-WEBHOOK] Function call:", functionCall.name);

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
    const calcomFunctions = ["getAccountInfo", "checkAvailability", "bookAppointment"];
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
          case "getAccountInfo":
            action = "get_account_info";
            params = {};
            break;
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
          const errorText = await response.text();
          console.error("❌ [VAPI-WEBHOOK] Cal.com integration error:", errorText);
          throw new Error(`Cal.com integration failed: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ [VAPI-WEBHOOK] Cal.com integration success:", result);

        // Return the result - VAPI will read the 'result' field out loud
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
