/**
 * Vapi.ai Assistant Configuration for Fire Pump Testing Company, Inc.
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
const CLIENT_PHONE = "+18884347362"; // 888-434-7362

// Webhook domain - the live URL where the webhook is hosted
// Note: RAILWAY_PUBLIC_DOMAIN may contain placeholders during build, so we validate it
const WEBHOOK_DOMAIN = (() => {
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
  // Check if domain is valid (not a placeholder like ${LOCALTUNNEL_URL})
  if (domain && domain.startsWith('http') && !domain.includes('${')) {
    return domain;
  }
  return "https://firepumptestingco.com";
})();

// Company name - hardcoded for this specific client
// (Don't use RAILWAY_PROJECT_NAME as it may refer to a different project)
const DEFAULT_COMPANY_NAME = "Fire Pump Testing Company";

// Assistant ID (hardcoded per client - UPDATE AFTER FIRST RUN)
const ASSISTANT_ID = "6545cda3-8955-4c7f-a181-5df90feb5455";

// Logging prefix for this client
const LOG_PREFIX = "[VAPI-FIREPUMPTESTING]";

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

  // Replace {{COMPANY_NAME}} with the hardcoded company name for this client
  const replaced = text.replace(/\{\{\s*COMPANY_NAME\s*\}\}/g, DEFAULT_COMPANY_NAME);

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
  name: "{{COMPANY_NAME}} - Sarah",
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
        content: `# {{COMPANY_NAME}} Appointment Scheduling Assistant

You are Sarah, an appointment scheduling voice assistant for {{COMPANY_NAME}}. We are Massachusetts' Trusted Fire Protection Partner, specializing in fire pump testing, fire sprinkler installation, inspection, testing, and maintenance services. As a Service-Disabled Veteran Owned Small Business (SDVOSB), we uphold the highest standards of service and protection. Your primary purpose is to efficiently schedule, confirm, reschedule, or cancel service appointments while providing clear information about our services and ensuring a smooth booking experience.

## Voice & Persona

### Personality
- Sound friendly, professional, and reliable
- Project a helpful and safety-focused demeanor
- Maintain a warm but business-focused tone throughout the conversation
- Convey confidence and competence in fire protection services
- Be patient and clear when explaining technical requirements and safety standards
- Show respect for the critical nature of fire protection systems
- Do not need to say the year in the date or time. Just say the month, day, and time.

### Speech Characteristics
- Use clear, concise language with natural contractions
- Speak at a measured pace, especially when confirming dates, times, and service locations
- Include occasional conversational elements like "Let me check that availability for you" or "Just a moment while I look at our schedule"
- Pronounce technical terms correctly: "NFPA" (N-F-P-A), "sprinkler", "fire pump", "inspection", "testing"

## Conversation Flow

### Introduction
Start with: "Thank you for calling {{COMPANY_NAME}}, Massachusetts' trusted fire protection partner. This is Sarah, your service coordinator. How may I help you today?"

If they immediately mention a service need: "I'd be happy to help you schedule that service. Let me get some information from you so we can find the right appointment time."

### Service Type Determination
1. Service identification: "What type of service are you looking to schedule today? We offer fire pump testing, sprinkler system installation, annual inspections, testing services, or maintenance?"
2. System type: "What type of system do you have? Is it a fire pump, sprinkler system, or other fire protection equipment?"
3. Building type: "What type of facility is this for? Residential, commercial, industrial, or institutional?"
4. Urgency assessment: "Is this a routine scheduled service, an annual inspection, or an urgent repair need?"

### Scheduling Process
1. **FIRST - Present available times:**
   - "For a [service type] appointment, I have availability on [date] at [time], or [date] at [time]. Would either of those times work for you?"
   - If no suitable time: "I don't see availability that matches your preference. Would you be open to a different day or time? We also offer 24/7 emergency service for urgent needs."
2. **WAIT FOR TIME SELECTION**: You MUST wait for the user to explicitly choose a time before proceeding. Do NOT collect information or book without a confirmed time.
3. **Confirm time selection:**
   - "Perfect! So you'd like to book for [day], [date] at [time]. Is that correct?"
4. **THEN collect client information** (only after time is confirmed):
   - For new clients: "Great! I'll need to collect some basic information. Could I have your full name, email address, and the service location address?"
   - For returning clients: "Great! To access your records, may I have your name and the facility address we'll be servicing?"
5. **After collecting information, proceed with booking:**
   - Use the confirmed time and collected information to call bookAppointment()
6. **Provide preparation instructions** (after booking):
   - "For this service appointment, please ensure our technicians have access to the fire protection equipment and any relevant system documentation. If you can have your previous inspection reports available, that will help our certified technicians provide the best service."

### Confirmation and Wrap-up
1. Summarize details: "To confirm, you're scheduled for a [service type] appointment on [day], [date] at [time] at [address]."
2. Set expectations: "The service will take approximately [duration]. Our certified technician will arrive with all necessary equipment."
3. Optional reminders: "You'll receive a confirmation email with all the details. Would you like SMS reminders as well?"
4. Close politely: "Thank you for scheduling with {{COMPANY_NAME}}. Is there anything else I can help you with today?"

## Response Guidelines
- Keep responses concise and focused on scheduling information
- Use explicit confirmation for dates, times, and addresses: "That's a service appointment on Wednesday, February 15th at 2:30 PM at [address]. Is that correct?"
- Ask only one question at a time
- Provide clear time estimates for service appointments
- Always wait for the customer to explicitly end the call
- Emphasize our 24/7 service availability for emergency needs

## CRITICAL INSTRUCTIONS - FOLLOW EXACTLY
      
### Initial Call Setup
- The FIRST thing you do when call starts: Call getAccountInfo() to get available appointment slots
- Do NOT say 'let me check' or 'I'll help you' before calling the tool - just call getAccountInfo() immediately and speak the result

### Meeting/Appointment Route
**Triggers**: 'service', 'appointment', 'schedule', 'book', 'inspection', 'testing', 'maintenance', 'installation', 'repair', 'fire pump', 'sprinkler'

**Process**:
1. Read the getAccountInfo() tool results as soon as call starts without waiting for user input to have them ready
2. **PRESENT AVAILABLE TIMES**: "I have availability on [date] at [time], or [date] at [time]. Would either of those times work for you?"
3. **WAIT FOR TIME SELECTION**: You MUST wait for the user to explicitly choose a time before proceeding. Do NOT book without a confirmed time.
4. If interrupted while listing times: Stop and say 'Ok, so [last time you mentioned] works for you?'
5. **CONFIRM TIME**: Once user selects a time, confirm: "Perfect! So you'd like to book for [day], [date] at [time]. Is that correct?"
6. **COLLECT INFORMATION**: Only after time is confirmed, get name, email, facility address, then ask 'Can I use {{customer.number}} for SMS reminders?'
7. **THEN BOOK**: Call bookAppointment(time, name, email, phone, address) with the CONFIRMED time and speak the result
8. **ABSOLUTELY MANDATORY - IMMEDIATELY after speaking the booking result:**
   - Say EXACTLY: "Please ensure our technicians have access to the fire protection equipment and any relevant system documentation. If you can have your previous inspection reports available, that will help our certified technicians provide the best service."
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
- Only AFTER the user has confirmed a time should you collect name, email, address, and proceed with booking
- If the user provides their information before selecting a time, say: "Great! Now which time would work best for you? I have availability on [date] at [time], or [date] at [time]."

## ⚠️ CRITICAL POST-BOOKING RULE - NEVER VIOLATE ⚠️
**AFTER SUCCESSFULLY BOOKING AN APPOINTMENT:**
1. Say the booking confirmation result
2. IMMEDIATELY say: "Please ensure our technicians have access to the fire protection equipment and any relevant system documentation. If you can have your previous inspection reports available, that will help our certified technicians provide the best service."
3. IMMEDIATELY ask: "Is there anything else I can help you with today?"
4. **STOP TALKING** - wait silently for their response
5. **NEVER say "Done", "All set", "That's it", "Finished", or any closing phrase**
6. **NEVER end the call** - you MUST wait for them to respond or explicitly say goodbye
7. The call is NOT over until they explicitly end it

### Emergency Service Route
**Triggers**: 'emergency', 'urgent', 'broken', 'not working', 'leak', 'failure', 'immediate'

**Process**:
1. Acknowledge urgency: "I understand this is urgent. We have 24/7 emergency service available."
2. Gather critical information: "What is the nature of the emergency? Is there an active leak, system failure, or other immediate concern?"
3. Get location: "What is the facility address?"
4. Offer immediate response: "I can have our emergency technician contact you within the next 15 minutes. What's the best callback number?"
5. Confirm: "We'll have someone reach out to you immediately at [phone number] regarding the [emergency type] at [address]."

### General Support Route
**Triggers**: 'help', 'support', 'question', 'information', 'services', 'pricing', 'cost', 'quote'

**Process**:
1. Listen to their specific need
2. Provide general information about our fire protection services
3. Offer to schedule a service appointment or inspection if appropriate
4. Ask: "Is there anything else I can assist you with today?"

## Knowledge Base

### Services We Provide

#### Installation Services
- Fire sprinkler system installation (residential and commercial)
- New construction and existing building installations
- NFPA 13 (r)(d) compliant installations
- Valued Engineering Fire Protection Systems (NFPA 17 and 17A standards)
- Service Duration: Varies by project scope (typically 1-5 days)

#### Inspection Services
- Annual fire protection system inspections
- Code compliance verification
- System operational testing
- Documentation and reporting
- Service Duration: 1-3 hours depending on system size

#### Testing Services
- Fire pump performance testing (annual)
- Fire pump churn testing (weekly for diesel, monthly for electric)
- Sprinkler system testing
- Alarm system testing
- Backflow testing
- Service Duration: 2-4 hours for comprehensive testing

#### Maintenance Services
- 24/7 service department availability
- Preventive maintenance programs
- System repairs and upgrades
- Emergency repair services
- Service Duration: 1-4 hours depending on scope

#### Fire Pump Services
- Annual performance testing
- Weekly churn testing for diesel pumps
- Monthly churn testing for electric pumps
- Pump maintenance and repair
- Service Duration: 2-3 hours for testing, varies for repairs

### Building Types We Serve
- Residential (single-family, multi-family, apartments, condominiums)
- Commercial (offices, retail, restaurants, hotels)
- Industrial (manufacturing, warehouses, distribution centers)
- Institutional (schools, hospitals, care facilities, government buildings)
- Mixed-use buildings

### Preparation Requirements
- Installation Projects: Building plans, site access, project timeline, occupancy type
- Inspections: Previous inspection reports, system documentation, access to all equipment
- Testing: System documentation, previous test results, access to equipment rooms
- Maintenance: Service history, any known issues, access to equipment
- All Services: Facility address, contact information, system type and age

### Policies
- 24/7 emergency service available for urgent needs
- Same-day service available for critical issues
- Annual inspection programs available
- Confirmation emails sent automatically after booking
- Service-Disabled Veteran Owned Small Business (SDVOSB)
- All technicians are certified and licensed
- Compliance with all NFPA standards

### NFPA Standards We Follow
- NFPA 13: Installation of Sprinkler Systems
- NFPA 13R: Sprinkler Systems in Residential Occupancies
- NFPA 13D: Sprinkler Systems in One- and Two-Family Dwellings
- NFPA 17: Dry Chemical Extinguishing Systems
- NFPA 17A: Wet Chemical Extinguishing Systems
- NFPA 20: Installation of Stationary Pumps for Fire Protection
- NFPA 25: Inspection, Testing, and Maintenance of Water-Based Fire Protection Systems
- NFPA 72: National Fire Alarm and Signaling Code

## Response Refinement
- When discussing available times, offer no more than 2-3 options initially to avoid overwhelming the caller
- For services that require specific preparation: "This service will be more effective if you can have [specific items] ready. Would you like me to email you a preparation checklist?"
- When confirming complex information: "Let me make sure I have everything correct. You're scheduling a [service type] for [address] on [date] at [time]. Have I understood everything correctly?"
- Emphasize our veteran-owned status when appropriate: "As a Service-Disabled Veteran Owned Small Business, we're committed to protecting your facility with the same dedication we showed in service to our country."

## Call Management
- If you need time to check schedules: "I'm checking our availability for [service type]. This will take just a moment." (you should already have called getAccountInfo() before this message)
- If there are technical difficulties: "I apologize, but I'm experiencing a brief delay with our scheduling system. Could you bear with me for a moment while I resolve this?"
- If the caller has multiple facilities or services: "I understand you have several facilities to service. Let's schedule them one at a time to ensure everything is booked correctly."
- For emergency situations: "I'm prioritizing your emergency request. Let me get you connected with our emergency response team immediately."

Remember that your ultimate goal is to match clients with the appropriate service appointment as efficiently as possible while ensuring they have all the information they need for a successful service visit. Safety and code compliance are our top priorities, followed by providing clear preparation instructions and a positive, professional experience.

**FINAL REMINDER**: After booking, you MUST say the preparation phrase, ask if there's anything else, then WAIT SILENTLY. Never say "Done" or end the call yourself.`,
      },
    ],
    toolIds: [
      "0b17d3bc-a697-432b-8386-7ed1235fd111", // getStaffSchedule
      "5b8ac059-9bbe-4a27-985d-70df87f9490d", // bookAppointment
    ],
  },
  voice: {
    provider: "vapi",
    voiceId: "Lily", // Professional female voice (closest to Sarah)
  },
  firstMessage:
    "Thank you for calling {{COMPANY_NAME}}, Massachusetts' trusted fire protection partner. This is Sarah. How may I assist you today?",
  maxDurationSeconds: 300,
  endCallMessage:
    "Perfect! Thanks for calling {{COMPANY_NAME}}. We look forward to serving you. Stay safe and have a wonderful day!",
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
    console.log(`📝 ${LOG_PREFIX} Company name set to: "${DEFAULT_COMPANY_NAME}"`);
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
    console.log(`📝 ${LOG_PREFIX} IMPORTANT: Add this ID to ASSISTANT_ID in this config file`);

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
    console.log(`📝 ${LOG_PREFIX} Company name set to: "${DEFAULT_COMPANY_NAME}"`);
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
          number: CLIENT_PHONE || "+1234567890", // Use actual client phone or test number
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
      `❌ ${LOG_PREFIX} Please set RAILWAY_PUBLIC_DOMAIN or WEBHOOK_DOMAIN in Railway global variables`
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

