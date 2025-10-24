/**
 * Vapi.ai Assistant Configuration for Cal.com Integration
 *
 * This script configures a Vapi.ai assistant to handle Cal.com operations
 * including reading/writing appointments, users, and availability
 */

import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
// do not change this url or this script will fail, the web hook url needs to be the live url of the site
const SITE_URL = "https://capcofire.com";
const VAPI_WEBHOOK_URL = `${SITE_URL}/api/vapi/webhook`;

// Assistant configuration
const assistantConfig = {
  name: "Cal.com Assistant",
  serverUrl: VAPI_WEBHOOK_URL,
  model: {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: `You are a friendly appointment scheduling assistant for ${process.env.GLOBAL_COMPANY_NAME || "CAPCO Design Group"}. ${process.env.GLOBAL_COMPANY_SLOGAN || "Professional Fire Protection Plan Review & Approval"}.

CRITICAL: You must follow this exact format for function calls:

1. To check availability:
checkAvailability({
  "dateFrom": "2024-10-24T00:00:00.000Z",
  "dateTo": "2024-10-29T23:59:59.999Z"
})

2. To book an appointment:
bookAppointment({
  "start": "2024-10-24T14:00:00.000Z",
  "name": "John Smith",
  "email": "john@example.com",
  "smsReminderNumber": "+1234567890"
})

Your workflow:
1. Greet the caller warmly
2. IMMEDIATELY check availability for the next 5 days using checkAvailability()
3. Present the available times to the caller
4. Ask what fire protection service they need
5. Collect their contact information (name, email, phone)
6. Book the appointment using bookAppointment()
7. Confirm the appointment details
8. End the call professionally

IMPORTANT:
- All dates must be in ISO format with timezone (e.g., "2024-10-24T14:00:00.000Z")
- dateFrom should be start of today
- dateTo should be 5 days from today
- Always include time portion in dates
- Phone numbers must be in E.164 format (e.g., "+12345678900")

Be conversational and helpful. Use the functions to get real data from the Cal.com system.

Keep calls under 5 minutes. If there's silence for more than 10 seconds, politely end the call.`,
  },
  voice: {
    provider: "11labs",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Professional female voice
    stability: 0.5,
    similarityBoost: 0.8,
  },
  firstMessage: `Hi there! Thank you for calling ${process.env.GLOBAL_COMPANY_NAME || "CAPCO Design Group"}. I'm getting our staff and availability information for you right now...`,
  maxDurationSeconds: 300, // 5 minutes max call
  endCallMessage: "Thank you for calling. Have a great day!",
  endCallPhrases: ["goodbye", "bye", "that's all", "done", "finished", "end call"],
  backgroundSound: "office",
  silenceTimeoutSeconds: 20, // Increased to allow function calls to complete
  responseDelaySeconds: 0.5, // Small delay to allow for processing
  functions: [
    {
      name: "checkAvailability",
      description: "Check available appointment times for the next few days",
      parameters: {
        type: "object",
        properties: {
          dateFrom: {
            type: "string",
            description: "Start date and time in ISO format (e.g., 2024-10-24T00:00:00.000Z)",
          },
          dateTo: {
            type: "string",
            description: "End date and time in ISO format (e.g., 2024-10-29T23:59:59.999Z)",
          },
        },
        required: ["dateFrom", "dateTo"],
      },
    },
    {
      name: "bookAppointment",
      description: "Book a new appointment",
      parameters: {
        type: "object",
        properties: {
          start: {
            type: "string",
            description:
              "Start time of the appointment in ISO format (e.g., 2024-10-24T14:00:00.000Z)",
          },
          name: {
            type: "string",
            description: "Full name of the person booking the appointment",
          },
          email: {
            type: "string",
            description: "Email address for appointment confirmation",
          },
          smsReminderNumber: {
            type: "string",
            description: "Phone number in E.164 format (e.g., +12345678900) for SMS reminders",
          },
        },
        required: ["start", "name", "email"],
      },
    },
  ],
};

// Create the assistant
async function createAssistant() {
  try {
    console.log("🤖 [VAPI-CONFIG] Creating Vapi.ai assistant...");

    const response = await fetch("https://api.vapi.ai/assistant", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(assistantConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create assistant: ${response.status} ${error}`);
    }

    const assistant = await response.json();
    console.log("✅ [VAPI-CONFIG] Assistant created successfully:", assistant.id);

    return assistant;
  } catch (error) {
    console.error("❌ [VAPI-CONFIG] Error creating assistant:", error);
    throw error;
  }
}

// Update the assistant
async function updateAssistant(assistantId) {
  try {
    console.log("🤖 [VAPI-CONFIG] Updating Vapi.ai assistant:", assistantId);

    const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(assistantConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update assistant: ${response.status} ${error}`);
    }

    const assistant = await response.json();
    console.log("✅ [VAPI-CONFIG] Assistant updated successfully");

    return assistant;
  } catch (error) {
    console.error("❌ [VAPI-CONFIG] Error updating assistant:", error);
    throw error;
  }
}

// Get assistant details
async function getAssistant(assistantId) {
  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get assistant: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ [VAPI-CONFIG] Error getting assistant:", error);
    throw error;
  }
}

// Test the assistant
async function testAssistant(assistantId) {
  try {
    console.log("🤖 [VAPI-CONFIG] Testing assistant:", assistantId);

    const response = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId: assistantId,
        customer: {
          number: "+1234567890", // Test number
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to test assistant: ${response.status} ${error}`);
    }

    const call = await response.json();
    console.log("✅ [VAPI-CONFIG] Test call initiated:", call.id);

    return call;
  } catch (error) {
    console.error("❌ [VAPI-CONFIG] Error testing assistant:", error);
    throw error;
  }
}

// Main execution
async function main() {
  const assistantId = "3ae002d5-fe9c-4870-8034-4c66a9b43b51"; // Hardcoded assistant ID

  if (!VAPI_API_KEY) {
    console.warn("⚠️ [VAPI-CONFIG] VAPI_API_KEY environment variable not found");
    console.warn("⚠️ [VAPI-CONFIG] Skipping VAPI assistant configuration update");
    console.warn(
      "⚠️ [VAPI-CONFIG] This is normal during build process - assistant will use existing configuration"
    );
    return;
  }

  if (!VAPI_WEBHOOK_URL) {
    console.error("❌ [VAPI-CONFIG] SITE_URL environment variable is required");
    console.error("❌ [VAPI-CONFIG] Please set SITE_URL in Railway global variables:");
    console.error("   - SITE_URL=https://capcofire.com");
    process.exit(1);
  }

  try {
    if (assistantId) {
      console.log("🤖 [VAPI-CONFIG] Updating existing assistant:", assistantId);
      await updateAssistant(assistantId);
    } else {
      console.log("🤖 [VAPI-CONFIG] Creating new assistant");
      const assistant = await createAssistant();
      console.log("📝 [VAPI-CONFIG] Save this assistant ID:", assistant.id);
      console.log("📝 [VAPI-CONFIG] Add to your .env file: VAPI_ASSISTANT_ID=" + assistant.id);
    }

    console.log("✅ [VAPI-CONFIG] Configuration complete!");
  } catch (error) {
    console.error("❌ [VAPI-CONFIG] Configuration failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createAssistant, updateAssistant, getAssistant, testAssistant, assistantConfig };
