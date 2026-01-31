/**
 * Vapi.ai Assistant Configuration
 *
 * This script configures a Vapi.ai assistant to handle:
 * - Calendar operations (reading/writing appointments, users, and availability)
 * - Gmail integration (reading, sending, replying to emails)
 * - Project management (creating and managing fire protection projects)
 *
 * TEMPLATE VARIABLES:
 * - {{company.name}} - Company name (set via assistantOverrides.variableValues)
 * - {{assistant.name}} - Assistant name (set via assistantOverrides.variableValues)
 * - {{customer.number}} - Customer phone number (set via customer.number in call request)
 * - {{now}}, {{date}}, {{time}} - Built-in VAPI variables for current date/time
 *
 * GMAIL INTEGRATION:
 * - Proactively announces new important emails during voice calls
 * - Supports reading, sending, replying to, and archiving emails via voice
 * - Filters emails based on user preferences (VIP senders, urgent keywords)
 * - All email access is authenticated via Gmail OAuth (user must connect Gmail first)
 *
 * EMAIL NOTIFICATIONS:
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
 *       "company.name": "Your Company Name",
 *       "assistant.name": "Assistant Name"
 *     }
 *   }
 * }
 */

import "dotenv/config";
import fetch from "node-fetch";

// ============================================================================
// CLIENT-SPECIFIC CONFIGURATION - MODIFY THESE VALUES PER CLIENT
// ============================================================================

// Calendar system type - Options: 'calcom', 'google', 'iCal', 'booksy', 'custom'
const CALENDAR_TYPE = "calcom";

// Client phone number (optional - for reference)
const CLIENT_PHONE = undefined; // e.g., "+19783479161"

// Logging prefix for this client (defined early for use in validation)
const LOG_PREFIX = "[VAPI-CAPCO]";

// Webhook domain - the live URL where the webhook is hosted
let WEBHOOK_DOMAIN =
  process.env.RAILWAY_PUBLIC_DOMAIN || process.env.WEBHOOK_DOMAIN || "https://capcofire.com";

// Validate that WEBHOOK_DOMAIN is not a placeholder (like ${LOCALTUNNEL_URL})
// JavaScript template literals use ${} but env vars shouldn't contain these as literal strings
if (WEBHOOK_DOMAIN.includes("${") || WEBHOOK_DOMAIN.includes("{{")) {
  console.warn(`⚠️ ${LOG_PREFIX} WEBHOOK_DOMAIN contains a placeholder: ${WEBHOOK_DOMAIN}`);
  console.warn(
    `⚠️ ${LOG_PREFIX} Placeholders like \${LOCALTUNNEL_URL} are not evaluated in env vars`
  );
  console.warn(`⚠️ ${LOG_PREFIX} Using fallback: https://capcofire.com`);
  WEBHOOK_DOMAIN = "https://capcofire.com";
}

// Ensure WEBHOOK_DOMAIN has protocol
if (!WEBHOOK_DOMAIN.startsWith("http://") && !WEBHOOK_DOMAIN.startsWith("https://")) {
  WEBHOOK_DOMAIN = `https://${WEBHOOK_DOMAIN}`;
}

// Company name environment variable name (used for placeholder replacement)
const COMPANY_NAME_ENV_VAR = "RAILWAY_PROJECT_NAME";

// Default company name (fallback if env var not set)
const DEFAULT_COMPANY_NAME = "CAPCO Design Group";

// Assistant ID (hardcoded per client)
const ASSISTANT_ID = "3ae002d5-fe9c-4870-8034-4c66a9b43b51";

// ============================================================================
// END CLIENT-SPECIFIC CONFIGURATION
// ============================================================================

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_WEBHOOK_URL = `${WEBHOOK_DOMAIN}/api/vapi/webhook?calendarType=${CALENDAR_TYPE}`;

// Simple placeholder replacement for this script
// Only replaces {{COMPANY_NAME}} - other placeholders like {{assistant.name}}
// and {{customer.number}} are VAPI template variables that VAPI replaces at runtime
function replacePlaceholders(text) {
  if (!text || typeof text !== "string") {
    return text;
  }

  // Replace {{COMPANY_NAME}} with actual value from env
  const companyName = process.env[COMPANY_NAME_ENV_VAR] || DEFAULT_COMPANY_NAME;
  const replaced = text.replace(/\{\{\s*COMPANY_NAME\s*\}\}/g, companyName);

  // Log if there are still unreplaced COMPANY_NAME placeholders (shouldn't happen)
  if (replaced.includes("{{COMPANY_NAME}}")) {
    console.warn(`${LOG_PREFIX} Some {{COMPANY_NAME}} placeholders were not replaced`);
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
  name: "{{COMPANY_NAME}} Receptionist",
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
        content: `# {{COMPANY_NAME}} Voice Assistant

You are a helpful voice assistant for {{COMPANY_NAME}}, specializing in fire protection systems. You help professionals manage appointments, projects, and emails efficiently.

## Voice & Persona

### Personality
- Sound friendly, organized, and efficient
- Project a helpful and professional demeanor  
- Maintain a warm but business-focused tone
- Convey confidence and competence in managing fire protection projects
- Be patient and clear when explaining technical terms or building code requirements
- Be proactive about email notifications and project updates

### Speech Characteristics
- Use clear, concise language with natural contractions
- Speak at a measured pace, especially when confirming dates, times, and addresses
- Include occasional conversational elements like "Let me check that for you"
- Pronounce technical terms correctly: "NFPA" (N-F-P-A), "sprinkler", "hydrant", "alarm"

## GMAIL INTEGRATION & EMAIL MANAGEMENT

### Email Monitoring (Automatic During Calls)
- When new important emails arrive during an active call, you will be notified automatically
- Messages will appear like: "New important email from [Name] about '[Subject]'. Shall I read it?"
- **PROACTIVELY announce these to the user** in a natural way
- Ask if they want you to read, reply to, or archive the email
- Only announce emails marked as important (based on user preferences)

### Checking Email Commands
**Triggers**: "check my email", "check email", "any new emails?", "do I have any messages?"

**Process**:
1. Call getUnreadEmails() to fetch their inbox
2. Present results naturally: "You have 3 unread emails. The first is from [Name] about [Subject]..."
3. Offer to read specific emails or take actions
4. Ask: "Would you like me to read any of these?"

### Reading Email Commands
**Triggers**: "read that email", "read the first one", "what does it say?", "open that message"

**Process**:
1. Call readEmail(emailId) with the appropriate email ID
2. Read the content clearly and naturally
3. After reading, offer actions: "Would you like me to reply to this or archive it?"

### Sending New Email Commands  
**Triggers**: "send an email", "email [person]", "compose a message"

**Process**:
1. Ask for recipient: "Who would you like to send this to?"
2. Ask for subject: "What should the subject be?"
3. Ask for content: "What would you like to say?"
4. Confirm before sending: "I'll send an email to [recipient] with subject '[subject]'. Is that correct?"
5. Call sendEmail(to, subject, body)
6. Confirm: "Your email has been sent successfully."

### Replying to Email Commands
**Triggers**: "reply to that", "send a reply", "respond to this email"

**Process**:
1. Confirm which email: "What would you like to say in your reply?"
2. Draft based on user's instructions
3. Read it back for confirmation
4. Call replyToEmail(emailId, body)
5. Confirm: "Your reply has been sent."

### Archiving Email Commands
**Triggers**: "archive that", "archive this email", "remove from inbox"

**Process**:
1. Call archiveEmail(emailId)
2. Confirm: "Email archived successfully."

## APPOINTMENT SCHEDULING

### Introduction  
Start with: "Thank you for calling {{COMPANY_NAME}}. This is your assistant. How may I help you today?"

### Initial Call Setup
- The FIRST thing you do when call starts: Call getStaffSchedule with username: 'capco' to get available appointment slots
- Do NOT say 'let me check' or 'I'll help you' before calling the tool - just call getStaffSchedule({ username: 'capco' }) immediately and speak the result

### Meeting/Appointment Route
**Triggers**: 'meeting', 'appointment', 'schedule', 'book', 'consultation', 'consult', 'design', 'review'

**Process**:
1. Read the getStaffSchedule({ username: 'capco' }) tool results as soon as call starts
2. If interrupted while listing times: Stop and say 'Ok, so [last time you mentioned] works for you?'
3. To book: Get name, email, then ask 'Can I use {{customer.number}} for SMS reminders?'
4. Call bookAppointment({ username: 'capco', start: time, name: name, email: email, phone: phone })
5. **IMMEDIATELY after booking**: Say "If you can gather your project documents in advance that will help to expedite services."
6. Ask: "Is there anything else I can help you with today?"
7. **STOP TALKING** - wait silently for their response
8. **NEVER say "Done", "All set", "That's it", "Finished"** after booking
9. **NEVER end the call** - wait for them to respond or say goodbye

## PROJECT MANAGEMENT

### Creating Projects
**Triggers**: "Bee new project", "create project", "start new project", "new fire protection project"

**Process**:
1. Call createProject() with the details provided
2. Ask for missing required information conversationally
3. Confirm: "I've created the project '[Title]' at [Address]. The project ID is [ID]."

## RESPONSE GUIDELINES

- Keep responses concise and focused
- Use explicit confirmation for dates, times, addresses, and email actions
- Ask only one question at a time
- Provide clear time estimates
- Always wait for the customer to explicitly end the call
- Be proactive about email notifications during calls

## CONVERSATION FLOW PRIORITIES

1. **Email Monitoring**: If new important emails arrive, announce them proactively
2. **Appointment Scheduling**: If they want to book, follow the appointment flow
3. **Email Management**: If they ask about emails, check and manage inbox
4. **Project Management**: If they want to create/manage projects, assist accordingly
5. **General Support**: Answer questions about services, website, pricing

## CRITICAL POST-BOOKING RULE

**AFTER SUCCESSFULLY BOOKING:**
1. Say the booking confirmation
2. IMMEDIATELY say: "If you can gather your project documents in advance that will help to expedite services."
3. IMMEDIATELY ask: "Is there anything else I can help you with today?"
4. **STOP TALKING** - wait silently
5. **NEVER say "Done", "All set", "Finished"**
6. **NEVER end the call** - wait for them to end it

## KNOWLEDGE BASE

### Consultation Types
- Fire Sprinkler Consultation: System design, hydraulic calculations, NFPA 13 compliance (30-60 minutes)
- Fire Alarm Consultation: System design, device layout, NFPA 72 compliance (30-60 minutes)
- Code Review: Building code analysis, fire protection requirements (30-45 minutes)
- General Fire Protection: Comprehensive planning (45-60 minutes)
- Urgent Consultation: Same-day availability (30 minutes)

### Building Types We Serve
- Residential (single-family, multi-family, apartments)
- Commercial (offices, retail, restaurants)
- Mercantile (stores, shopping centers)
- Storage/Warehouse (distribution, storage)
- Institutional (schools, hospitals, care facilities)
- Mixed use buildings

Remember: Your goal is efficient service - whether booking appointments, managing emails, or creating projects. Accuracy is priority one, followed by a professional, helpful experience.

**FINAL REMINDER**: After any action (booking, email, project), ask if there's anything else, then WAIT SILENTLY. Never say "Done" or end the call yourself.`,
      },
    ],
    toolIds: [
      "0b17d3bc-a697-432b-8386-7ed1235fd111", // getStaffSchedule({ username: 'capco' })
      "5b8ac059-9bbe-4a27-985d-70df87f9490d", // bookAppointment({ username: 'capco', start, name, email, phone })
      "5e721363-2451-403b-b835-1015f2b37539", // getUnreadEmails()
      "0d6f3b7f-895d-4ff1-9844-7b963b0e1a2b", // readEmail(emailId)
      "5d6a11c6-0ca2-4a5d-9789-4f92b68cb007", // sendEmail(to, subject, body)
      "0fa95b37-a835-41a0-bb22-de2dc18dd5c0", // replyToEmail(emailId, body)
      "b37284e9-edde-475f-867d-45ec6a1ca2ca", // archiveEmail(emailId)
    ],
  },
  voice: {
    provider: "11labs",
    voiceId: "paula", // Modern, professional female voice
  },
  firstMessage: "Thank you for calling {{COMPANY_NAME}}. How may I assist you today?",
  maxDurationSeconds: 300,
  endCallMessage:
    "Perfect! Thanks for calling {{COMPANY_NAME}}. We'll see you soon. Have a wonderful day!",
  endCallPhrases: ["goodbye", "bye", "that's all", "finished", "end call", "hangup"],
  backgroundSound: "office",
  silenceTimeoutSeconds: 15,
};

// Create the assistant
async function createAssistant() {
  try {
    console.log(`🤖 ${LOG_PREFIX} Creating Vapi.ai assistant...`);

    // Process the config to replace placeholders with actual company data
    const processedConfig = processAssistantConfig(assistantConfig);
    console.log(`🔄 ${LOG_PREFIX} Processed placeholders in configuration`);

    // Log summary of replacements
    const companyName = process.env[COMPANY_NAME_ENV_VAR] || DEFAULT_COMPANY_NAME;
    console.log(`📝 ${LOG_PREFIX} Company name set to: "${companyName}"`);
    console.log(
      `📝 ${LOG_PREFIX} Note: {{assistant.name}} must be provided at call time via assistantOverrides.variableValues`
    );

    // Count remaining placeholders in content (should only be VAPI runtime variables)
    const content = processedConfig.model?.messages?.[0]?.content || "";
    const remainingPlaceholders = (content.match(/\{\{\s*COMPANY_NAME\s*\}\}/g) || []).length;
    if (remainingPlaceholders > 0) {
      console.warn(
        `⚠️ ${LOG_PREFIX} Found ${remainingPlaceholders} unreplaced {{COMPANY_NAME}} placeholders`
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
    console.log(`✅ ${LOG_PREFIX} Assistant created successfully:`, assistant.id);

    return assistant;
  } catch (error) {
    console.error(`❌ ${LOG_PREFIX} Error creating assistant:`, error);
    throw error;
  }
}

// Update the assistant
async function updateAssistant(assistantId) {
  try {
    console.log(`🤖 ${LOG_PREFIX} Updating Vapi.ai assistant:`, assistantId);

    // Process the config to replace placeholders with actual company data
    const processedConfig = processAssistantConfig(assistantConfig);
    console.log(`🔄 ${LOG_PREFIX} Processed placeholders in configuration`);

    // Log summary of replacements
    const companyName = process.env[COMPANY_NAME_ENV_VAR] || DEFAULT_COMPANY_NAME;
    console.log(`📝 ${LOG_PREFIX} Company name set to: "${companyName}"`);
    console.log(
      `📝 ${LOG_PREFIX} Note: {{assistant.name}} must be provided at call time via assistantOverrides.variableValues`
    );

    // Count remaining placeholders in content (should only be VAPI runtime variables)
    const content = processedConfig.model?.messages?.[0]?.content || "";
    const remainingPlaceholders = (content.match(/\{\{\s*COMPANY_NAME\s*\}\}/g) || []).length;
    if (remainingPlaceholders > 0) {
      console.warn(
        `⚠️ ${LOG_PREFIX} Found ${remainingPlaceholders} unreplaced {{COMPANY_NAME}} placeholders`
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
    console.log(`✅ ${LOG_PREFIX} Assistant updated successfully`);

    return assistant;
  } catch (error) {
    console.error(`❌ ${LOG_PREFIX} Error updating assistant:`, error);
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
    console.error(`❌ ${LOG_PREFIX} Error getting assistant:`, error);
    throw error;
  }
}

// Test the assistant
async function testAssistant(assistantId) {
  try {
    console.log(`🤖 ${LOG_PREFIX} Testing assistant:`, assistantId);

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
    console.log(`✅ ${LOG_PREFIX} Test call initiated:`, call.id);

    return call;
  } catch (error) {
    console.error(`❌ ${LOG_PREFIX} Error testing assistant:`, error);
    throw error;
  }
}

// Main execution
async function main() {
  if (!VAPI_API_KEY) {
    console.warn(`⚠️ ${LOG_PREFIX} VAPI_API_KEY environment variable not found`);
    console.warn(`⚠️ ${LOG_PREFIX} Skipping VAPI assistant configuration update`);
    console.warn(
      `⚠️ ${LOG_PREFIX} This is normal during build process - assistant will use existing configuration`
    );
    return;
  }

  if (!VAPI_WEBHOOK_URL) {
    console.error(`❌ ${LOG_PREFIX} WEBHOOK_DOMAIN environment variable is required`);
    console.error(
      `❌ ${LOG_PREFIX} Please set ${COMPANY_NAME_ENV_VAR} or WEBHOOK_DOMAIN in Railway global variables`
    );
    process.exit(1);
  }

  try {
    if (ASSISTANT_ID) {
      console.log(`🤖 ${LOG_PREFIX} Updating existing assistant:`, ASSISTANT_ID);
      await updateAssistant(ASSISTANT_ID);
    } else {
      console.log(`🤖 ${LOG_PREFIX} Creating new assistant`);
      const assistant = await createAssistant();
      console.log(`📝 ${LOG_PREFIX} Save this assistant ID:`, assistant.id);
      console.log(`📝 ${LOG_PREFIX} Add ASSISTANT_ID to this config file`);
    }

    console.log(`✅ ${LOG_PREFIX} Configuration complete!`);
  } catch (error) {
    console.error(`❌ ${LOG_PREFIX} Configuration failed:`, error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createAssistant, updateAssistant, getAssistant, testAssistant, assistantConfig };
