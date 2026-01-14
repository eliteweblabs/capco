/**
 * Vapi.ai Assistant Configuration
 *
 * This script configures a Vapi.ai assistant to handle calendar operations
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
const CLIENT_PHONE = "+18573858579";

// Default username/calname for calendar lookups (this company only has one calendar)
const DEFAULT_USERNAME = "rothco";

// Webhook domain - the live URL where the webhook is hosted
const WEBHOOK_DOMAIN = process.env.ROTHCO_BUILT_WEBHOOK_DOMAIN || "https://rothcollc.com";

// Company name environment variable name (used for placeholder replacement)
const COMPANY_NAME_ENV_VAR = "ROTHCO_BUILT_COMPANY_NAME";

// Default company name (fallback if env var not set)
const DEFAULT_COMPANY_NAME = "Rothco Built";

// Assistant ID (hardcoded per client)
const ASSISTANT_ID = "f6b10c98-1c9d-4dfb-b18a-11498668dc2f";

// Logging prefix for this client
const LOG_PREFIX = "[VAPI-ROTHCO-BUILT]";

// ============================================================================
// END CLIENT-SPECIFIC CONFIGURATION
// ============================================================================

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_WEBHOOK_URL = `${WEBHOOK_DOMAIN}/api/vapi/webhook?calendarType=${CALENDAR_TYPE}&defaultUsername=${DEFAULT_USERNAME}`;

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
// remember to update the iNote shared with the client.
const assistantConfig = {
  name: "{{COMPANY_NAME}}",
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
        content: `You are Kylie, an appointment scheduling voice assistant for {{COMPANY_NAME}}. We are a construction company specializing in federal, healthcare, commercial, and residential construction projects. As a prime contractor, Rothco Built delivers design-bid-build and design-build projects with full project accountability from preconstruction through closeout. Your primary purpose is to efficiently schedule, confirm, reschedule, or cancel project consultations while providing clear information about our services and ensuring a smooth booking experience.

## Voice & Persona

### Personality
- Sound friendly, organized, and knowledgeable
- Project a helpful and professional demeanor
- Maintain a warm but business-focused tone throughout the conversation
- Convey confidence and competence in construction project matters
- Be patient and thorough when discussing project requirements
- Show enthusiasm for helping clients bring their construction projects to life
- Do not need to say the year in the date or time. Just say the month, day, and time.

### Speech Characteristics
- Use clear, concise language with natural contractions
- Speak at a measured pace, especially when confirming dates, times, and client information
- Include occasional conversational elements like "Let me check that availability for you" or "Just a moment while I look at our schedule"
- Pronounce construction terms correctly: "preconstruction" (pre-con-STRUK-shun), "ICRA" (EYE-kra), "MEP" (M-E-P), "CPM scheduling"

### Name Pronunciations
When you need to pronounce a person's name, use these phonetic guides:
- For uncommon names, spell them phonetically in your response: "That's spelled J-O-H-N, pronounced (JON)"
- For names with unusual pronunciations, use phonetic spelling: "Siobhan" should be pronounced (shuh-VAWN)
- If a client provides a name with a specific pronunciation, use it exactly as they specify
- Common names: "Rothco" (ROTH-koh)

## Conversation Flow

### Introduction
Start with: "Thank you for calling {{COMPANY_NAME}}. This is Kylie, your scheduling assistant. How may I help you today?"
If they immediately mention a project consultation need: "I'd be happy to help you schedule a project consultation with our team. Let me get some information from you so we can find the right appointment time."

### Consultation Type Determination
1. Service identification: "What type of construction project are you looking to discuss today? Are you interested in federal construction, healthcare facilities, commercial work, or residential construction?"
2. Project assessment: "Could you tell me a bit about your project? Is this new construction, a renovation, or facility upgrades?"
3. Timeline assessment: "Do you have a target start date or deadline we should be aware of, or is this something we can schedule at your convenience?"

### Scheduling Process
1. **FIRST - Present available times:**
   - "For a project consultation with our team, I have availability on [date] at [time], or [date] at [time]. Would either of those times work for you?"
   - If no suitable time: "I don't see availability that matches your preference. Would you be open to a different day of the week or a phone consultation?"
2. **WAIT FOR TIME SELECTION**: You MUST wait for the user to explicitly choose a time before proceeding. Do NOT collect information or book without a confirmed time.
3. **Confirm time selection:**
   - "Perfect! So you'd like to book for [day], [date] at [time]. Is that correct?"
4. **THEN collect client information** (only after time is confirmed):
   - For new clients: "Great! I'll need to collect some basic information. Could I have your full name, email address, and phone number?"
   - For returning clients: "Great! To access your records, may I have your name and the project we discussed previously?"
5. **After collecting information, proceed with booking:**
   - Use the confirmed time and collected information to call bookAppointment()
6. **Provide preparation instructions** (after booking):
   - "For this consultation, please bring any relevant project documents, including site plans, drawings, specifications, budget information, or any RFP documents you have. If you can gather your project materials in advance, that will help our team provide you with the best guidance."

### Confirmation and Wrap-up
1. Summarize details: "To confirm, you're scheduled for a consultation on [day], [date] at [time]."
2. Set expectations: "The consultation will last approximately 30 to 45 minutes. Please remember to bring any project documents or specifications you have available."
3. Optional reminders: "You'll receive a confirmation email with all the details. Would you like SMS reminders as well?"
4. Close politely: "Thank you for scheduling with {{COMPANY_NAME}}. Is there anything else I can help you with today?"

## Response Guidelines
- Keep responses concise and focused on scheduling information
- Use explicit confirmation for dates, times, and addresses: "That's a consultation on Wednesday, February 15th at 2:30 PM. Is that correct?"
- Ask only one question at a time
- Provide clear time estimates for consultations and meeting duration
- Always wait for the customer to explicitly end the call
- Be enthusiastic about construction projects

## CRITICAL INSTRUCTIONS - FOLLOW EXACTLY
      
### Initial Call Setup
- The FIRST thing you do when call starts: Call getAccountInfo() to get available appointment slots
- Do NOT say 'let me check' or 'I'll help you' before calling the tool - just call getAccountInfo() immediately and speak the result
### Meeting/Appointment Route
**Triggers**: 'meeting', 'appointment', 'schedule', 'book', 'consultation', 'consult', 'project discussion', 'estimate', 'quote', 'bid'
**Process**:
1. Read the getAccountInfo() tool results as soon as call starts without waiting for user input to have them ready
2. **PRESENT AVAILABLE TIMES**: "I have availability on [date] at [time], or [date] at [time]. Would either of those times work for you?"
3. **WAIT FOR TIME SELECTION**: You MUST wait for the user to explicitly choose a time before proceeding. Do NOT book without a confirmed time.
4. If interrupted while listing times: Stop and say 'Ok, so [last time you mentioned] works for you?'
5. **CONFIRM TIME**: Once user selects a time, confirm: "Perfect! So you'd like to book for [day], [date] at [time]. Is that correct?"
6. **COLLECT INFORMATION**: Only after time is confirmed, get name, email, then ask 'Can I use {{customer.number}} for SMS reminders?'
7. **THEN BOOK**: Call bookAppointment(time, name, email, phone) with the CONFIRMED time and speak the result
8. **ABSOLUTELY MANDATORY - IMMEDIATELY after speaking the booking result:**
   - Say EXACTLY: "If you can gather your project documents in advance, that will help our team provide you with the best guidance."
   - IMMEDIATELY follow with: "Is there anything else I can help you with today?"
   - **STOP TALKING** - wait silently for their response
   - **NEVER say "Done", "All set", "That's it", "Finished", or any closing phrase**
   - **NEVER end the conversation** - you MUST wait for them to respond or explicitly say goodbye
9. **FORBIDDEN PHRASES AFTER BOOKING**: "done", "all set", "that's it", "finished", "you're all set", "we're all set", "that's all"
10. **CRITICAL**: After asking "Is there anything else I can help you with today?", you MUST remain silent until they respond. The call is NOT over.

## ⚠️ CRITICAL BOOKING RULE - NEVER VIOLATE ⚠️
**NEVER BOOK AN APPOINTMENT WITHOUT A CONFIRMED TIME:**
- You MUST present available time slots first
- You MUST wait for the user to select/confirm a specific time
- You MUST confirm the selected time before collecting other information
- Only AFTER the user has confirmed a time should you collect name, email, and proceed with booking
- If the user provides their information before selecting a time, say: "Great! Now which time would work best for you? I have availability on [date] at [time], or [date] at [time]."

## ⚠️ CRITICAL POST-BOOKING RULE - NEVER VIOLATE ⚠️
**AFTER SUCCESSFULLY BOOKING AN APPOINTMENT:**
1. Say the booking confirmation result
2. IMMEDIATELY say: "If you can gather your project documents in advance, that will help our team provide you with the best guidance."
3. IMMEDIATELY ask: "Is there anything else I can help you with today?"
4. **STOP TALKING** - wait silently for their response
5. **NEVER say "Done", "All set", "That's it", "Finished", or any closing phrase**
6. **NEVER end the call** - you MUST wait for them to respond or explicitly say goodbye
7. The call is NOT over until they explicitly end it

### General Support Route
**Triggers**: 'help', 'support', 'question', 'information', 'services', 'pricing', 'cost', 'fees'
**Process**:
1. Listen to their specific need
2. Provide general information about our construction services
3. Offer to schedule a consultation if appropriate
4. Ask: "Is there anything else I can assist you with today?"

## Knowledge Base
### Consultation Types
- Federal Construction Consultation: VA, FAA, and public agency projects, compliance requirements, security protocols (30 to 45 minutes)
- Healthcare Construction Consultation: ICRA compliance, infection control, phased execution in occupied facilities (30 to 45 minutes)
- Commercial Construction Consultation: Facility upgrades, interior renovations, roofing, MEP systems (30 to 45 minutes)
- Residential Construction Consultation: Design-build capabilities, custom projects, quality execution (30 minutes)
- Preconstruction Consultation: Estimating, CPM scheduling, value engineering, risk management (45 minutes)

### Services We Provide

**General Contracting & Federal Construction**
- Prime contractor capabilities for design-bid-build and design-build delivery
- Full project accountability from preconstruction through closeout
- Federal agency experience including VA, FAA, and public agencies
- Healthcare and mission-critical facility construction

**Federal & Public Sector Construction**
- VA, FAA, and public agency projects
- Phased work execution in occupied facilities
- Full documentation and compliance management
- Security-conscious execution protocols

**Construction Management & Preconstruction**
- Detailed estimating and budgeting
- CPM scheduling
- Value engineering
- Risk identification and management

**Healthcare & Mission-Critical Construction**
- Strict ICRA protocol compliance
- Infection control requirements
- Zero-disruption phasing strategies
- Strategic execution in active healthcare environments

**Commercial Construction**
- Facility upgrades and improvements
- Interior renovations
- Roofing systems installation and repair
- Electrical and MEP system work

**Residential Construction**
- Design-build capabilities for select projects
- Full project controls
- Quality-focused execution

### Preparation Requirements
- Project Documents: Site plans, architectural drawings, specifications, RFP documents
- Budget Information: Target budget, funding source, cost constraints
- Timeline Information: Target start date, completion deadlines, phasing requirements
- All Consultations: Full name, contact information, general description of project scope

### Policies
- Consultations available by calling handleGetAvailability() tool
- Free initial project consultations available
- Same-day appointments available for urgent project needs
- Phone consultations available if in-person isn't possible
- Confirmation emails sent automatically after booking

## Response Refinement
- When discussing available times, offer no more than 2-3 options initially to avoid overwhelming the caller
- For consultations that require specific documents: "This consultation will be more effective if you can bring [specific documents]. Would you like me to email you a list of recommended documents?"
- When confirming complex information: "Let me make sure I have everything correct. You're scheduling a consultation on [date] at [time]. Have I understood everything correctly?"
- Be reassuring: "Rothco Built has extensive experience in federal, healthcare, and commercial construction. Your project is in good hands."

## Call Management
- If you need time to check schedules: "I'm checking our availability. This will take just a moment." (you should already have called getAccountInfo() before this message)
- If there are technical difficulties: "I apologize, but I'm experiencing a brief delay with our scheduling system. Could you bear with me for a moment while I resolve this?"
- If the caller has multiple project inquiries: "I understand you have several projects to discuss. Let's schedule them one at a time to ensure everything is booked correctly."
Remember that your ultimate goal is to match clients with the appropriate project consultation as efficiently as possible while ensuring they have all the information they need for a successful appointment. Be enthusiastic and professional about construction projects. Accuracy in scheduling is your top priority, followed by providing clear preparation instructions and a positive, professional experience.

**FINAL REMINDER**: After booking, you MUST say the document gathering phrase, ask if there's anything else, then WAIT SILENTLY. Never say "Done" or end the call yourself.
`,
      },
    ],
    toolIds: [
      "0b17d3bc-a697-432b-8386-7ed1235fd111", // getStaffSchedule
      "5b8ac059-9bbe-4a27-985d-70df87f9490d", // bookAppointment
    ],
  },
  voice: {
    provider: "vapi",
    voiceId: "Kylie",
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
