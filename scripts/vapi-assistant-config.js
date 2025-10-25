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
    model: "claude-sonnet-4-5-20250929",
    temperature: 0.7,
    maxTokens: 1000,
    messages: [
      {
        role: "system",
        content:
          "You are a friendly scheduling assistant for CAPCO Fire Protection Systems.\n\nCRITICAL: Only speak the 'result' field from function responses. Never read timestamps, JSON data, or technical fields.\n\nYour conversation flow:\n1. Greet: 'Hello! I can help you schedule a fire protection consultation. Let me check our availability.'\n2. Call checkAvailability (use today for dateFrom, 7 days ahead for dateTo)\n3. Read ONLY the 'result' field to the caller - ignore any 'data', 'nextAvailable', or other technical fields\n4. Ask: 'Would that work for you? I'll need your name and email.'\n5. Call bookAppointment (use data.nextAvailable from step 2's response, plus their name and email)\n6. Read ONLY the 'result' field to the caller\n\nNEVER say: timestamps, ISO dates, parameter names like 'dateFrom', technical field names, or JSON structure.",
      },
    ],
  },
  voice: {
    provider: "vapi",
    voiceId: "Elliot",
  },
  firstMessage:
    "Thanks for calling CAPCO Fire Protection Systems. I can help you schedule a fire protection consultation. Let me check our availability for you.",
  maxDurationSeconds: 300,
  endCallMessage: "Thanks for calling CAPCO Design Group. Have a great day!",
  endCallPhrases: ["goodbye", "bye", "that's all", "done", "finished", "end call"],
  backgroundSound: "office",
  silenceTimeoutSeconds: 15,
  functions: [
    {
      name: "checkAvailability",
      description:
        "Check available appointment slots for fire protection consultation. Returns next available slot and list of upcoming slots.",
      parameters: {
        type: "object",
        properties: {
          dateFrom: {
            type: "string",
            description:
              "Start date for availability check in ISO 8601 format (e.g., '2024-10-25T00:00:00.000Z'). Use today's date.",
          },
          dateTo: {
            type: "string",
            description:
              "End date for availability check in ISO 8601 format (e.g., '2024-11-01T00:00:00.000Z'). Use 7 days from today.",
          },
        },
        required: ["dateFrom", "dateTo"],
      },
    },
    {
      name: "bookAppointment",
      description: "Book a fire protection consultation appointment at a specific time",
      parameters: {
        type: "object",
        properties: {
          start: {
            type: "string",
            description:
              "Appointment start time in ISO 8601 format (e.g., '2024-10-25T14:00:00.000Z')",
          },
          name: {
            type: "string",
            description: "Full name of the person booking the appointment",
          },
          email: {
            type: "string",
            description: "Email address for appointment confirmation",
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
