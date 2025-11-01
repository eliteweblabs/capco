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
const RAILWAY_PUBLIC_DOMAIN = "https://capcofire.com";
const VAPI_WEBHOOK_URL = `${RAILWAY_PUBLIC_DOMAIN}/api/vapi/webhook`;

// Process the assistant config to replace placeholders using placeholder-utils.ts
async function processAssistantConfig(config) {
  const processedConfig = JSON.parse(JSON.stringify(config)); // Deep clone

  // Import the TypeScript placeholder-utils (works in Node.js with ES modules)
  const { replacePlaceholders } = await import("../src/lib/placeholder-utils.ts");

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
  name: "{{RAILWAY_PROJECT_NAME}} Receptionist",
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
        content: `# {{RAILWAY_PROJECT_NAME}} Receptionist

You are {{assistant.name}}, a receptionist for {{RAILWAY_PROJECT_NAME}}. We specialize in crafting fire sprinkler and alarm legal documents quickly.

## CRITICAL INSTRUCTIONS - FOLLOW EXACTLY

### ⚠️ ABSOLUTE RULES - NEVER VIOLATE THESE ⚠️
**AFTER BOOKING AN APPOINTMENT:**
1. Say the booking confirmation result
2. Say EXACTLY: "If you can gather your project documents in advance that will help to expedite services."
3. IMMEDIATELY ask: "Is there anything else I can help you with today?"
4. **STOP TALKING** - wait for their response
5. **NEVER say: "done", "all set", "that's it", or any closing phrase**
6. **NEVER assume the call is over** - wait for explicit goodbye from customer

### Initial Call Setup
- The FIRST thing you do when call starts: Call getAccountInfo()

## Route Handling

### 📅 Meeting/Appointment Route
**Triggers**: 'meeting', 'appointment', 'schedule', 'book', 'consultation'

**Process**:
1. Read the getAccountInfo tool results aloud
2. If interrupted while listing times: Stop and say 'Ok, so [last time you mentioned] works for you?'
3. To book: Get name, email, then ask 'Can I use {{customer.number}} for the phone number?'
4. Call bookAppointment(time, name, email, phone) and speak the result
5. **CRITICAL: IMMEDIATELY after speaking the booking result, you MUST say EXACTLY:** "If you can gather your project documents in advance that will help to expedite services."
6. **ABSOLUTELY CRITICAL - MANDATORY NEXT STEP:** IMMEDIATELY after step 5, you MUST ask: "Is there anything else I can help you with today?" 
   - **NEVER say "done", "all set", "that's it", or any closing phrase after booking**
   - **NEVER end the call or suggest the call is complete**
   - **YOU MUST wait for their response** - do not assume they're finished
   - **Only end the call after they explicitly say goodbye or indicate they're done**
   - **If they have another question, continue the conversation naturally**

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
- **After completing ANY tool call, you MUST continue the conversation - do NOT end after speaking tool results**
- **FORBIDDEN PHRASES AFTER BOOKING: "done", "all set", "that's it", "we're all set", "you're all set", "that's all", "finished"**
- After booking an appointment, you MUST complete steps 5 and 6 of the Meeting/Appointment Route in EXACT order
- After step 6 ("Is there anything else I can help you with today?"), you MUST wait silently for their response - do NOT speak again until they respond
- The call is NEVER complete until the customer explicitly says goodbye or indicates they're finished
- Do NOT end the call prematurely - always offer additional help and wait for confirmation
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
  firstMessage: "Thank you for calling {{RAILWAY_PROJECT_NAME}}. How may I assist you today?",
  maxDurationSeconds: 300,
  endCallMessage:
    "Perfect! Thanks for calling {{RAILWAY_PROJECT_NAME}}. We'll see you soon. Have a wonderful day!",
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
    console.error("❌ [VAPI-CONFIG] RAILWAY_PUBLIC_DOMAIN environment variable is required");
    console.error("❌ [VAPI-CONFIG] Please set RAILWAY_PUBLIC_DOMAIN in Railway global variables:");
    console.error("   - RAILWAY_PUBLIC_DOMAIN=https://capcofire.com");
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
