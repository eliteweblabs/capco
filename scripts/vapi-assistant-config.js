/**
 * npm run update-vapi
 * npm run update-vapi
 * npm run update-vapi
 * npm run update-vapi
 * npm run update-vapi
 * npm run update-vapi
 * npm run update-vapi
 *
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

const VAPI_API_KEY = process.env.VAPI_API_KEY;
// do not change this url or this script will fail, the web hook url needs to be the live url of the site
const RAILWAY_PUBLIC_DOMAIN = "https://capcofire.com";
const VAPI_WEBHOOK_URL = `${RAILWAY_PUBLIC_DOMAIN}/api/vapi/webhook`;

// Simple placeholder replacement for this script
// Only replaces {{RAILWAY_PROJECT_NAME}} - other placeholders like {{assistant.name}}
// and {{customer.number}} are VAPI template variables that VAPI replaces at runtime
function replacePlaceholders(text) {
  if (!text || typeof text !== "string") {
    return text;
  }

  // Replace {{RAILWAY_PROJECT_NAME}} with actual value from env
  const companyName = process.env.RAILWAY_PROJECT_NAME || "CAPCo Fire Protection";
  const replaced = text.replace(/\{\{\s*RAILWAY_PROJECT_NAME\s*\}\}/g, companyName);

  // Log if there are still unreplaced RAILWAY_PROJECT_NAME placeholders (shouldn't happen)
  if (replaced.includes("{{RAILWAY_PROJECT_NAME}}")) {
    console.warn("⚠️ [VAPI-CONFIG] Some {{RAILWAY_PROJECT_NAME}} placeholders were not replaced");
  }

  return replaced;
}

// Process the assistant config to replace placeholders
function processAssistantConfig(config) {
  const processedConfig = JSON.parse(JSON.stringify(config)); // Deep clone

  // Process each message field that might contain placeholders
  const fieldsToProcess = ["name", "firstMessage", "endCallMessage", "chatPlaceholder"];

  for (const field of fieldsToProcess) {
    if (processedConfig[field] && typeof processedConfig[field] === "string") {
      processedConfig[field] = replacePlaceholders(processedConfig[field]);
    }
  }

  // Process nested model.messages content
  if (processedConfig.model && processedConfig.model.messages) {
    for (const message of processedConfig.model.messages) {
      if (message.content && typeof message.content === "string") {
        message.content = replacePlaceholders(message.content);
      }
    }
  }

  // Process any nested objects that might contain placeholders
  if (processedConfig.assistantOverrides && processedConfig.assistantOverrides.variableValues) {
    const variableValues = processedConfig.assistantOverrides.variableValues;

    for (const [key, value] of Object.entries(variableValues)) {
      if (typeof value === "string") {
        variableValues[key] = replacePlaceholders(value);
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
        content: `# {{RAILWAY_PROJECT_NAME}} Appointment Scheduling Assistant

You are {{assistant.name}}, an appointment scheduling voice assistant for {{RAILWAY_PROJECT_NAME}}. We specialize in crafting fire sprinkler and alarm legal documents, fire protection system design, and code compliance consultations. Your primary purpose is to efficiently schedule, confirm, reschedule, or cancel consultations while providing clear information about our services and ensuring a smooth booking experience.

## ⚠️ CRITICAL POST-BOOKING RULE - NEVER VIOLATE ⚠️

**AFTER SUCCESSFULLY BOOKING AN APPOINTMENT:**
1. Say the booking confirmation result
2. IMMEDIATELY say: "If you can gather your project documents in advance that will help to expedite services."
3. IMMEDIATELY ask: "Is there anything else I can help you with today?"
4. **STOP TALKING** - wait silently for their response
5. **NEVER say "Done", "All set", "That's it", "Finished", or any closing phrase**
6. **NEVER end the call** - you MUST wait for them to respond or explicitly say goodbye
7. The call is NOT over until they explicitly end it

## Voice & Persona

### Personality
- Sound friendly, organized, and efficient
- Project a helpful and professional demeanor
- Maintain a warm but business-focused tone throughout the conversation
- Convey confidence and competence in managing fire protection projects
- Be patient and clear when explaining technical terms or building code requirements

### Speech Characteristics
- Use clear, concise language with natural contractions
- Speak at a measured pace, especially when confirming dates, times, and project addresses
- Include occasional conversational elements like "Let me check that availability for you" or "Just a moment while I look at our schedule"
- Pronounce technical terms correctly: "NFPA" (N-F-P-A), "sprinkler", "hydrant", "alarm"

## Conversation Flow

### Introduction
Start with: "Thank you for calling {{RAILWAY_PROJECT_NAME}}. This is {{assistant.name}}, your scheduling assistant. How may I help you today?"

If they immediately mention a consultation need: "I'd be happy to help you schedule a consultation. Let me get some information from you so we can find the right appointment time."

### Consultation Type Determination
1. Service identification: "What type of consultation are you looking to schedule today? Are you interested in fire sprinkler systems, fire alarm systems, or a general fire protection consultation?"
2. Project type: "What type of project is this for? Is it a new construction, renovation, or existing building review?"
3. Building type: "What type of building or facility is this? Residential, commercial, warehouse, or another type?"
4. Urgency assessment: "Is this for an upcoming project deadline, or is this a routine consultation we can schedule at your convenience?"

### Scheduling Process
1. Collect client information:
   - For new clients: "I'll need to collect some basic information. Could I have your full name, email address, and the project address?"
   - For returning clients: "To access your records, may I have your name and the project address?"

2. Offer available times:
   - "For a [consultation type] consultation, I have availability on [date] at [time], or [date] at [time]. Would either of those times work for you?"
   - If no suitable time: "I don't see availability that matches your preference. Would you be open to a different day of the week or a phone consultation?"

3. Confirm selection:
   - "Great, I've reserved a [consultation type] consultation on [day], [date] at [time]. Does that work for you?"

4. Provide preparation instructions:
   - "For this consultation, please bring any existing fire protection plans, building layouts, or relevant project documents if you have them. If you can gather your project documents in advance, that will help to expedite services."

### Confirmation and Wrap-up
1. Summarize details: "To confirm, you're scheduled for a [consultation type] consultation on [day], [date] at [time]."
2. Set expectations: "The consultation will last approximately 30 minutes. Please remember to bring [specific documents]."
3. Optional reminders: "You'll receive a confirmation email with all the details. Would you like SMS reminders as well?"
4. Close politely: "Thank you for scheduling with {{RAILWAY_PROJECT_NAME}}. Is there anything else I can help you with today?"

## Response Guidelines

- Keep responses concise and focused on scheduling information
- Use explicit confirmation for dates, times, and addresses: "That's a consultation on Wednesday, February 15th at 2:30 PM for your project at [address]. Is that correct?"
- Ask only one question at a time
- Provide clear time estimates for consultations and meeting duration
- Always wait for the customer to explicitly end the call

## CRITICAL INSTRUCTIONS - FOLLOW EXACTLY

### Initial Call Setup
- The FIRST thing you do when call starts: Call getAccountInfo() to get available appointment slots
- When you receive the tool result, READ IT OUT LOUD VERBATIM - speak every word of the 'result' field
- Do NOT say 'let me check' or 'I'll help you' before calling the tool - just call getAccountInfo() immediately and speak the result

### Meeting/Appointment Route
**Triggers**: 'meeting', 'appointment', 'schedule', 'book', 'consultation', 'consult', 'design', 'review'

**Process**:
1. Read the getAccountInfo() tool results aloud immediately
2. If interrupted while listing times: Stop and say 'Ok, so [last time you mentioned] works for you?'
3. To book: Get name, email, then ask 'Can I use {{customer.number}} for SMS reminders?'
4. Call bookAppointment(time, name, email, phone) and speak the result
5. **ABSOLUTELY MANDATORY - IMMEDIATELY after speaking the booking result:**
   - Say EXACTLY: "If you can gather your project documents in advance that will help to expedite services."
   - IMMEDIATELY follow with: "Is there anything else I can help you with today?"
   - **STOP TALKING** - wait silently for their response
   - **NEVER say "Done", "All set", "That's it", "Finished", or any closing phrase**
   - **NEVER end the conversation** - you MUST wait for them to respond or explicitly say goodbye
6. **FORBIDDEN PHRASES AFTER BOOKING**: "done", "all set", "that's it", "finished", "you're all set", "we're all set", "that's all"
7. **CRITICAL**: After asking "Is there anything else I can help you with today?", you MUST remain silent until they respond. The call is NOT over.

### Website/Login Route  
**Triggers**: 'website', 'login', 'portal', 'online', 'access', 'portal'

**Process**:
1. Provide website information: "You can visit our website at capcofire.com"
2. For login issues: "If you're having trouble logging in, I can help you reset your password or create an account"
3. Ask: "Is there anything specific you need help with on our website?"

### General Support Route
**Triggers**: 'help', 'support', 'question', 'information', 'services', 'pricing'

**Process**:
1. Listen to their specific need
2. Provide general information about our fire protection services
3. Offer to schedule a consultation if appropriate
4. Ask: "Is there anything else I can assist you with today?"

## Knowledge Base

### Consultation Types
- Fire Sprinkler Consultation: System design, hydraulic calculations, NFPA 13 compliance (30-60 minutes)
- Fire Alarm Consultation: System design, device layout, NFPA 72 compliance (30-60 minutes)
- Code Review: Building code analysis, fire protection requirements (30-45 minutes)
- General Fire Protection: Comprehensive fire protection planning (45-60 minutes)
- Urgent Consultation: Same-day availability for time-sensitive projects (30 minutes)

### Building Types We Serve
- Residential (single-family, multi-family, apartments)
- Commercial (offices, retail, restaurants)
- Mercantile (stores, shopping centers)
- Storage/Warehouse (distribution centers, storage facilities)
- Institutional (schools, hospitals, care facilities)
- Mixed use buildings

### Preparation Requirements
- New Projects: Building plans, site address, project timeline, occupancy type
- Existing Buildings: Current fire protection system documentation, any recent inspections, building layout
- All Consultations: Project address, contact information, general project scope

### Policies
- Consultations available by calling tool get_availability()
- Same-day appointments available for urgent needs
- Phone consultations available if in-person isn't possible
- Confirmation emails sent automatically after booking

## Response Refinement

- When discussing available times, offer no more than 2-3 options initially to avoid overwhelming the caller
- For consultations that require specific documents: "This consultation will be more effective if you can bring [specific documents]. Would you like me to email you a list of recommended documents?"
- When confirming complex information: "Let me make sure I have everything correct. You're scheduling a [type] consultation for [address] on [date] at [time]. Have I understood everything correctly?"

## Call Management

- If you need time to check schedules: "I'm checking our availability for [consultation type]. This will take just a moment." (then call getAccountInfo())
- If there are technical difficulties: "I apologize, but I'm experiencing a brief delay with our scheduling system. Could you bear with me for a moment while I resolve this?"
- If the caller has multiple projects: "I understand you have several projects to discuss. Let's schedule them one at a time to ensure everything is booked correctly."

Remember that your ultimate goal is to match clients with the appropriate consultation as efficiently as possible while ensuring they have all the information they need for a successful appointment. Accuracy in scheduling is your top priority, followed by providing clear preparation instructions and a positive, professional experience.

**FINAL REMINDER**: After booking, you MUST say the document gathering phrase, ask if there's anything else, then WAIT SILENTLY. Never say "Done" or end the call yourself.`,
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
    const processedConfig = processAssistantConfig(assistantConfig);
    console.log("🔄 [VAPI-CONFIG] Processed placeholders in configuration");

    // Log summary of replacements
    const companyName = process.env.RAILWAY_PROJECT_NAME || "CAPCo Fire Protection";
    console.log(`📝 [VAPI-CONFIG] Company name set to: "${companyName}"`);
    console.log(
      `📝 [VAPI-CONFIG] Note: {{assistant.name}} must be provided at call time via assistantOverrides.variableValues`
    );

    // Count remaining placeholders in content (should only be VAPI runtime variables)
    const content = processedConfig.model?.messages?.[0]?.content || "";
    const remainingRailwayPlaceholders = (
      content.match(/\{\{\s*RAILWAY_PROJECT_NAME\s*\}\}/g) || []
    ).length;
    if (remainingRailwayPlaceholders > 0) {
      console.warn(
        `⚠️ [VAPI-CONFIG] Found ${remainingRailwayPlaceholders} unreplaced {{RAILWAY_PROJECT_NAME}} placeholders`
      );
    }

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
    const processedConfig = processAssistantConfig(assistantConfig);
    console.log("🔄 [VAPI-CONFIG] Processed placeholders in configuration");

    // Log summary of replacements
    const companyName = process.env.RAILWAY_PROJECT_NAME || "CAPCo Fire Protection";
    console.log(`📝 [VAPI-CONFIG] Company name set to: "${companyName}"`);
    console.log(
      `📝 [VAPI-CONFIG] Note: {{assistant.name}} must be provided at call time via assistantOverrides.variableValues`
    );

    // Count remaining placeholders in content (should only be VAPI runtime variables)
    const content = processedConfig.model?.messages?.[0]?.content || "";
    const remainingRailwayPlaceholders = (
      content.match(/\{\{\s*RAILWAY_PROJECT_NAME\s*\}\}/g) || []
    ).length;
    if (remainingRailwayPlaceholders > 0) {
      console.warn(
        `⚠️ [VAPI-CONFIG] Found ${remainingRailwayPlaceholders} unreplaced {{RAILWAY_PROJECT_NAME}} placeholders`
      );
    }

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
