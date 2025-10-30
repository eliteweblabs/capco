/**
 * Vapi.ai Assistant Configuration for Cal.com Integration
 *
 * This script configures a Vapi.ai assistant to handle Cal.com operations
 * including reading/writing appointments, users, and availability
 *
 * TEMPLATE VARIABLES:
 * - {{company.name}} - Company name (set via assistantOverrides.variableValues)
 * - {{assistant.name}} - Assistant name (set via assistantOverrides.variableValues)
 * - {{customer.number}} - Customer phone number (set via customer.number in call request)
 * - {{now}}, {{date}}, {{time}} - Built-in VAPI variables for current date/time
 *
 * EMAIL FUNCTIONALITY:
 * - After booking appointments, the assistant automatically sends confirmation emails
 * - Uses the existing update-delivery.ts API for consistent email formatting
 * - Emails include appointment details and helpful preparation tips
 *
 * To use these variables, provide them when initiating a call:
 * {
 *   "assistantId": "your-assistant-id",
 *   "customer": { "number": "+1234567890" },
 *   "assistantOverrides": {
 *     "variableValues": {
 *       "company.name": "CAPCo Fire Protection",
 *       "assistant.name": "Sarah"
 *     }
 *   }
 * }
 *
 * SETUP INSTRUCTIONS:
 * 1. Run: node scripts/create-vapi-email-tool.js
 * 2. Copy the generated Tool ID
 * 3. Replace 'email-confirmation-tool-id' in toolIds array with the actual Tool ID
 * 4. Update the assistant configuration
 */

import "dotenv/config";
import fetch from "node-fetch";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
// do not change this url or this script will fail, the web hook url needs to be the live url of the site
const SITE_URL = "https://capcofire.com";
const VAPI_WEBHOOK_URL = `${SITE_URL}/api/vapi/webhook`;

// Process the assistant config to replace placeholders using placeholder-utils.ts
async function processAssistantConfig(config) {
  const processedConfig = JSON.parse(JSON.stringify(config)); // Deep clone

  // Import the Node.js compatible placeholder-utils
  const { replacePlaceholders } = await import("./placeholder-utils-node.js");

  // Process each message field that might contain placeholders
  const fieldsToProcess = ["name", "firstMessage", "endCallMessage", "chatPlaceholder"];

  for (const field of fieldsToProcess) {
    if (processedConfig[field] && typeof processedConfig[field] === "string") {
      // Use placeholder-utils.ts with no project data (only global placeholders)
      processedConfig[field] = replacePlaceholders(processedConfig[field], null);
    }
  }

  // Process nested model.messages content
  if (processedConfig.model && processedConfig.model.messages) {
    for (const message of processedConfig.model.messages) {
      if (message.content && typeof message.content === "string") {
        message.content = replacePlaceholders(message.content, null);
      }
    }
  }

  // Process any nested objects that might contain placeholders
  if (processedConfig.assistantOverrides && processedConfig.assistantOverrides.variableValues) {
    const variableValues = processedConfig.assistantOverrides.variableValues;

    for (const [key, value] of Object.entries(variableValues)) {
      if (typeof value === "string") {
        // Use placeholder-utils.ts with no project data (only global placeholders)
        variableValues[key] = replacePlaceholders(value, null);
      }
    }
  }

  return processedConfig;
}

// Assistant configuration
const assistantConfig = {
  name: "{{GLOBAL_COMPANY_NAME}} Receptionist",
  serverUrl: VAPI_WEBHOOK_URL,
  functions: [], // Clear old functions array
  model: {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.7,
    maxTokens: 1000,
    messages: [
      {
        role: "system",
        content: `# {{GLOBAL_COMPANY_NAME}} Receptionist

You are {{assistant.name}}, a receptionist for {{GLOBAL_COMPANY_NAME}}. We specialize in crafting fire sprinkler and alarm legal documents quickly.

## CRITICAL INSTRUCTIONS - FOLLOW EXACTLY

### Initial Call Setup
- The FIRST thing you do when call starts: Call getAccountInfo()

## Route Handling

### 📅 Meeting/Appointment Route
**Triggers**: 'meeting', 'appointment', 'schedule', 'book', 'consultation'

**Process**:
1. Read the getAccountInfo tool results aloud
2. If interrupted while listing times: Stop and say 'Ok, so [last time you mentioned] works for you?'
3. To book: Get name, email, then ask 'Can I use {{customer.number}} for SMS reminders?'
4. Call bookAppointment(time, name, email, phone) and speak the result
5. Tell the caller: "If you can gather your project documents in advance that will help to expedite services."
6. Ask: "Is there anything else I can help you with today?"

### 🌐 Website/Login Route  
**Triggers**: 'website', 'login', 'portal', 'online', 'access'

**Process**:
1. Provide website information: "You can visit our website at capcofire.com"
2. For login issues: "If you're having trouble logging in, I can help you reset your password or create an account"
3. Ask: "Is there anything specific you need help with on our website?"

### 📞 General Support Route
**Triggers**: 'help', 'support', 'question', 'information'

**Process**:
1. Listen to their specific need
2. Route to appropriate specialist or provide general information
3. Ask: "Is there anything else I can assist you with today?"

## Response Guidelines
- You MUST speak tool results immediately. Never summarize, never wait, just read them.
- Always end with: "Is there anything else I can help you with today?"
- Be professional, friendly, and efficient
- If unsure which route to take, ask: "What can I help you with today?"`,
      },
    ],
    toolIds: [
      "0b17d3bc-a697-432b-8386-7ed1235fd111", // getAccountInfo
      "5b8ac059-9bbe-4a27-985d-70df87f9490d", // bookAppointment
    ],
  },
  voice: {
    provider: "vapi",
    voiceId: "Kylie",
  },
  firstMessage: "Thank you for calling {{GLOBAL_COMPANY_NAME}}. How may I assist you today?",
  maxDurationSeconds: 300,
  endCallMessage:
    "Perfect! Thanks for calling {{GLOBAL_COMPANY_NAME}}. We'll see you soon. Have a wonderful day!",
  endCallPhrases: ["goodbye", "bye", "that's all", "finished", "end call", "hangup"],
  backgroundSound: "office",
  silenceTimeoutSeconds: 15,
};

// Create the assistant
async function createAssistant() {
  try {
    console.log("🤖 [VAPI-CONFIG] Creating Vapi.ai assistant...");

    // Process the config to replace placeholders with actual company data
    const processedConfig = await processAssistantConfig(assistantConfig);
    console.log("🔄 [VAPI-CONFIG] Processed placeholders in configuration");

    const response = await fetch("https://api.vapi.ai/assistant", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(processedConfig),
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

    // Process the config to replace placeholders with actual company data
    const processedConfig = await processAssistantConfig(assistantConfig);
    console.log("🔄 [VAPI-CONFIG] Processed placeholders in configuration");

    const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(processedConfig),
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
