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
const CLIENT_PHONE = "+19787208194";

// Webhook domain - the live URL where the webhook is hosted
const WEBHOOK_DOMAIN = process.env.BARBERS_EDGE_WEBHOOK_DOMAIN || "https://capcofire.com";

// Company name environment variable name (used for placeholder replacement)
const COMPANY_NAME_ENV_VAR = "BARBERS_EDGE_COMPANY_NAME";

// Default company name (fallback if env var not set)
const DEFAULT_COMPANY_NAME = "The Barber's Edge";

// Assistant ID (hardcoded per client)
const ASSISTANT_ID =
  process.env.VAPI_BARBERS_EDGE_ASSISTANT_ID || "99d7d682-573f-47e1-9440-66e1b045bc2a";

// Logging prefix for this client
const LOG_PREFIX = "[VAPI-BARBERS-EDGE]";

// Client-specific constants (if needed)
const AVAILABLE_BARBERS = ["Abraham", "Henry", "TJ", "JC", "Horell", "Christian", "Maddy"];

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
        content: `# {{COMPANY_NAME}} Appointment Scheduling Assistant

You are Kylie, an appointment scheduling voice assistant for {{COMPANY_NAME}}, a premium barbershop located in downtown Beverly, Massachusetts. We offer quality haircuts from well-trained professionals in a welcoming and relaxing environment. Your primary purpose is to efficiently schedule, confirm, reschedule, or cancel appointments while providing clear information about our services, barbers, and pricing.

## Voice & Persona

### Personality
- Sound friendly, warm, and professional
- Project a welcoming and relaxed demeanor
- Maintain a conversational but efficient tone
- Be enthusiastic about our barbers and services
- Show genuine interest in helping customers find the right barber and service
- Do not need to say the year in the date or time. Just say the month, day, and time.

### Speech Characteristics
- Use clear, friendly language with natural contractions
- Speak at a comfortable pace, especially when confirming dates, times, and barber selections
- Include conversational elements like "Let me check availability for you" or "I'll find the perfect time slot"
- Pronounce barber names correctly: "Abraham" (AY-bruh-ham), "Henry" (HEN-ree), "TJ" (TEE-JAY), "JC" (JAY-SEE), "Horell" (huh-RELL), "Christian" (KRIS-chun), "Maddy" (MAD-ee)

## Conversation Flow

### Introduction
Start with: "Thank you for calling {{COMPANY_NAME}}. This is Kylie, your scheduling assistant. How may I help you today?"

If they immediately mention booking: "I'd be happy to help you schedule an appointment. We have several talented barbers available and Christian. Let me check our availability for you."

### Service & Barber Selection
1. Service identification: "What type of service are you looking for today? We offer haircuts, beard trims, hot towel shaves, and more."
2. Barber preference: "Do you have a preferred barber, or would you like me to find the next available appointment? Our barbers are Abraham, Henry, TJ, JC, Horell, Christian, and Maddy."
3. If no preference: "No problem! Let me check availability across all our barbers and find you the best time slot."

### Scheduling Process
1. **Client Lookup (for returning clients)**:
   - When they mention booking or scheduling, ask: "Are you a returning client, or will this be your first visit?"
   - If returning: "Great! Let me look up your information. Can I have your name or phone number?"
   - Call lookupClient(nameOrPhone) to retrieve their information
   - If found: "I found your account! I see you usually see [barber name]. Would you like to book with them again?"
   - If not found: "I don't see a record with that information. Let me collect your details for this appointment."

2. Collect client information:
   - For new clients: "I'll need to collect some basic information. Could I have your full name, email address, and phone number?"
   - For returning clients (after lookup): Use the information from lookupClient() to pre-fill details, but confirm: "I have [name] and [email] on file. Is that correct?"

2. Offer available times:
   - "I have availability with [barber name] on [date] at [time], or [barber name] on [date] at [time]. Would either of those work for you?"
   - If specific barber requested: "For [barber name], I have availability on [date] at [time], or [date] at [time]."
   - If no suitable time: "I don't see availability that matches your preference. Would you be open to a different day or barber?"

3. Confirm selection:
   - "Perfect! I've reserved an appointment with [barber name] on [day], [date] at [time]. Does that work for you?"

4. Provide preparation instructions:
   - "Great! Your appointment is confirmed. We're located at 324 Rantoul Street in downtown Beverly. Please arrive a few minutes early, and feel free to relax in our lounge area while you wait."

### Confirmation and Wrap-up
1. Summarize details: "To confirm, you're scheduled with [barber name] on [day], [date] at [time]."
2. Set expectations: "Your appointment will last approximately [service duration]. You'll receive a confirmation email with all the details."
3. Optional reminders: "Would you like SMS reminders as well?"
4. Close politely: "Thank you for scheduling with {{COMPANY_NAME}}. Is there anything else I can help you with today?"

## Response Guidelines

- Keep responses concise and focused on scheduling information
- Use explicit confirmation for dates, times, barbers, and addresses: "That's an appointment with Henry on Wednesday, February 15th at 2:30 PM. Is that correct?"
- Ask only one question at a time
- Provide clear time estimates for services
- Always wait for the customer to explicitly end the call
- Be enthusiastic about our barbers and services

## CRITICAL INSTRUCTIONS - FOLLOW EXACTLY

### Initial Call Setup
- The FIRST thing you do when call starts: Call getStaffSchedule() to get available appointment slots for all barbers
- Do NOT say 'let me check' or 'I'll help you' before calling the tool - just call getStaffSchedule() immediately
- The function returns availability for all barbers - use this to offer options

### Meeting/Appointment Route
**Triggers**: 'appointment', 'schedule', 'book', 'haircut', 'cut', 'trim', 'shave', 'barber', 'see [barber name]'

**Process**:
1. Read the getStaffSchedule() tool results as soon as call starts - it shows availability for all barbers
2. **Client Lookup Step**: 
   - Ask if they're a returning client: "Are you a returning client, or is this your first visit?"
   - If returning: "Great! Let me look you up. Can I have your name or phone number?"
   - Call lookupClient(nameOrPhone) to retrieve their information
   - If found: Use the returned information (name, email, preferred barber, phone) to streamline booking
   - If not found: Proceed as new client
3. If they mention a specific barber: "I see you'd like to book with [barber name]. Let me check their availability."
4. If interrupted while listing times: Stop and say 'Ok, so [last time you mentioned] with [barber name] works for you?'
5. To book: 
   - For returning clients (found via lookup): Use the information from lookupClient(), confirm: "I have [name] and [email] on file. Is that correct?"
   - For new clients: Get name, email, then ask 'Can I use {{customer.number}} for SMS reminders?'
6. **CRITICAL**: You MUST get the barber name before booking. If not specified, ask: "Which barber would you like to book with? We have Abraham, Henry, TJ, JC, Horell, Christian, and Maddy available."
7. Call bookAppointment(time, name, email, phone, barber) with the barber parameter and speak the result
8. **ABSOLUTELY MANDATORY - IMMEDIATELY after speaking the booking result:**
   - Say EXACTLY: "Your appointment is confirmed. We're located at 324 Rantoul Street in downtown Beverly. Please arrive a few minutes early."
   - IMMEDIATELY follow with: "Is there anything else I can help you with today?"
   - **STOP TALKING** - wait silently for their response
   - **NEVER say "Done", "All set", "That's it", "Finished", or any closing phrase**
   - **NEVER end the conversation** - you MUST wait for them to respond or explicitly say goodbye
9. **FORBIDDEN PHRASES AFTER BOOKING**: "done", "all set", "that's it", "finished", "you're all set", "we're all set", "that's all"
10. **CRITICAL**: After asking "Is there anything else I can help you with today?", you MUST remain silent until they respond. The call is NOT over.

## ⚠️ CRITICAL POST-BOOKING RULE - NEVER VIOLATE ⚠️

**AFTER SUCCESSFULLY BOOKING AN APPOINTMENT:**
1. Say the booking confirmation result (including barber name)
2. IMMEDIATELY say: "Your appointment is confirmed. We're located at 324 Rantoul Street in downtown Beverly. Please arrive a few minutes early."
3. IMMEDIATELY ask: "Is there anything else I can help you with today?"
4. **STOP TALKING** - wait silently for their response
5. **NEVER say "Done", "All set", "That's it", "Finished", or any closing phrase**
6. **NEVER end the call** - you MUST wait for them to respond or explicitly say goodbye
7. The call is NOT over until they explicitly end it

### Service/Pricing Route  
**Triggers**: 'services', 'pricing', 'prices', 'cost', 'fees', 'how much', 'what do you offer'

**Process**:
1. Provide service information: "We offer haircuts, beard trims, hot towel shaves, and styling services. Our prices vary by service type."
2. For specific pricing: "For exact pricing, I'd recommend checking our website at www.thebarbersedge.com/services or calling the shop at (978) 720-8194."
3. Offer to schedule: "Would you like to schedule an appointment? I can check availability for you."
4. Ask: "Is there anything else I can help you with?"

### Website/Information Route  
**Triggers**: 'website', 'hours', 'location', 'address', 'phone', 'contact'

**Process**:
1. Provide information: "You can visit our website at www.thebarbersedge.com"
2. For hours: "Our hours are Monday 10am to 3pm, Tuesday through Friday 9am to 6pm, and Saturday 8am to 4pm. We're closed on Sundays."
3. For location: "We're located at 324 Rantoul Street in downtown Beverly, Massachusetts."
4. For phone: "You can reach the shop at (978) 720-8194"
5. Ask: "Is there anything specific you need help with?"

### Gift Card Route
**Triggers**: 'gift card', 'giftcard', 'gift certificate', 'gift', 'present', 'buy a gift', 'gift for someone'

**Process**:
1. Respond enthusiastically: "Gift cards are coming soon! We're working on making it easy to give the gift of a great haircut."
2. Offer alternative: "In the meantime, you can always purchase gift cards in person at our shop at 324 Rantoul Street, or call us at (978) 720-8194."
3. Ask: "Is there anything else I can help you with today?"

### General Support Route
**Triggers**: 'help', 'support', 'question', 'information'

**Process**:
1. Listen to their specific need
2. Provide helpful information about our barbershop and services
3. Offer to schedule an appointment if appropriate
4. Ask: "Is there anything else I can assist you with today?"

## Client Lookup Function

### lookupClient() Function
**Purpose**: Look up returning client information by name or phone number

**When to use**:
- When caller indicates they're a returning client
- When caller mentions "I've been here before" or "I'm a regular"
- Before collecting full client information for booking

**Function Format** (placeholder - backend connection needed):
- **Function Name**: lookupClient
- **Parameters**: 
  - nameOrPhone (string) - Client's name or phone number
- **Returns**:
  - If found: { found: true, name: string, email: string, phone: string, preferredBarber: string, lastVisit: string }
  - If not found: { found: false, message: "No client found with that information" }

**Usage Example**:
- Caller: "I'd like to book an appointment"
- Assistant: "Are you a returning client?"
- Caller: "Yes"
- Assistant: "Great! Can I have your name or phone number?"
- Caller: "John Smith"
- Assistant: calls lookupClient("John Smith")
- If found: "I found your account! I see you usually see Henry. Would you like to book with him again?"
- If not found: "I don't see a record with that information. Let me collect your details for this appointment."

**Note**: This function is currently a placeholder and needs to be connected to your client database/system.

## Knowledge Base

### Available Barbers
- **Abraham** - Experienced barber specializing in classic and modern cuts
- **Henry** - Skilled in fades, tapers, and precision cuts
- **TJ** - Expert in beard grooming and hot towel shaves
- **JC** - Versatile stylist for all hair types
- **Horell** - Owner/Master Barber with years of experience
- **Christian** - Specializes in contemporary styles
- **Maddy** - Skilled in precision cuts and styling

### Services We Provide
- Haircuts (various styles: classic, modern, fades, tapers, blowouts)
- Beard Trims
- Hot Towel Shaves
- Styling Services
- Hair and Beard Packages

**Note**: For exact pricing, direct customers to check www.thebarbersedge.com/services or call (978) 720-8194

### Business Hours
- **Monday**: 10:00 AM - 3:00 PM
- **Tuesday - Friday**: 9:00 AM - 6:00 PM
- **Saturday**: 8:00 AM - 4:00 PM
- **Sunday**: Closed

### Location & Contact
- **Address**: 324 Rantoul Street, Beverly, Massachusetts 01915
- **Phone**: (978) 720-8194
- **Email**: barbersedge350@gmail.com
- **Website**: www.thebarbersedge.com

### Gift Cards
- Gift cards are coming soon!
- Currently available for purchase in person at the shop
- Can be purchased by calling (978) 720-8194
- Perfect gift for birthdays, holidays, or any occasion

### Policies
- Walk-ins welcome, but appointments recommended
- Confirmation emails sent automatically after booking
- SMS reminders available upon request
- Lounge area with TV, WiFi, beverages, and toys for children

## Response Refinement

- When discussing available times, offer no more than 2-3 options initially to avoid overwhelming the caller
- When a specific barber is requested, prioritize their availability but offer alternatives if needed
- When confirming complex information: "Let me make sure I have everything correct. You're scheduling with [barber name] on [date] at [time]. Have I understood everything correctly?"
- Be enthusiastic: "We have some great barbers here! [Barber name] is excellent at [service type]."

## Call Management

- If you need time to check schedules: "I'm checking our availability across all barbers. This will take just a moment." (you should already have called getStaffSchedule() before this message)
- If there are technical difficulties: "I apologize, but I'm experiencing a brief delay with our scheduling system. Could you bear with me for a moment while I resolve this?"
- If the caller wants multiple services: "I understand you'd like to book multiple services. Let's schedule them one at a time to ensure everything is booked correctly."

## Barber Selection Logic

- **If barber specified**: Use that barber's availability only
- **If no barber specified**: Offer availability from all barbers, mentioning the barber name with each time slot
- **If preferred barber unavailable**: "I don't see availability with [barber] at that time, but I have openings with [other barber] on [date] at [time]. Would that work?"
- **Always confirm barber name** before finalizing booking

Remember that your ultimate goal is to match customers with the right barber and service as efficiently as possible while ensuring they have all the information they need for a great experience. Be friendly, professional, and enthusiastic about our barbershop!

**FINAL REMINDER**: After booking, you MUST say the location/arrival phrase, ask if there's anything else, then WAIT SILENTLY. Never say "Done" or end the call yourself.`,
      },
    ],
    toolIds: [
      "0b17d3bc-a697-432b-8386-7ed1235fd111", // getStaffSchedule (should return all barbers' availability)
      "5b8ac059-9bbe-4a27-985d-70df87f9490d", // bookAppointment (needs barber parameter)
      // lookupClient tool ID will be added here once the tool is created in VAPI dashboard
      // Placeholder removed - VAPI requires valid UUIDs. Add the tool ID when ready.
    ],
  },
  voice: {
    provider: "vapi",
    voiceId: "Kylie",
  },
  firstMessage:
    "Thank you for calling {{COMPANY_NAME}}. This is Kylie, your scheduling assistant. How may I help you today?",
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
    if (AVAILABLE_BARBERS) {
      console.log(`📝 ${LOG_PREFIX} Available barbers: ${AVAILABLE_BARBERS.join(", ")}`);
    }
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
    if (AVAILABLE_BARBERS) {
      console.log(`📝 ${LOG_PREFIX} Available barbers: ${AVAILABLE_BARBERS.join(", ")}`);
    }
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

// Verify assistant access before updating (optional - client-specific)
async function verifyAssistantAccess(assistantId) {
  try {
    console.log(`🔍 ${LOG_PREFIX} Verifying access to assistant:`, assistantId);
    const assistant = await getAssistant(assistantId);
    console.log(`✅ ${LOG_PREFIX} Successfully accessed assistant:`, assistant.name || assistantId);
    return true;
  } catch (error) {
    console.error(`❌ ${LOG_PREFIX} Cannot access assistant:`, error.message);
    console.error(`💡 ${LOG_PREFIX} Possible issues:`);
    console.error("   1. The assistant ID belongs to a different VAPI workspace/team");
    console.error("   2. The API key doesn't have permission to access this assistant");
    console.error("   3. The API key is from a different account");
    console.error("   4. The assistant was deleted or doesn't exist");
    console.error(`\n💡 ${LOG_PREFIX} Solutions:`);
    console.error(
      "   - Verify you're using the correct API key for the workspace containing this assistant"
    );
    console.error("   - Check the VAPI dashboard to confirm the assistant ID");
    console.error(`   - Or create a new assistant by removing ASSISTANT_ID from this config file`);
    return false;
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
      // Optional: Verify access first (can be removed if not needed)
      const hasAccess = await verifyAssistantAccess(ASSISTANT_ID);
      if (!hasAccess) {
        console.error(`\n❌ ${LOG_PREFIX} Cannot proceed without assistant access`);
        process.exit(1);
      }

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
    if (error.message && error.message.includes("Key doesn't allow")) {
      console.error(
        `\n💡 ${LOG_PREFIX} This error means your API key doesn't have access to this assistant.`
      );
      console.error(
        `   Check that you're using the correct API key for the workspace containing assistant:`,
        ASSISTANT_ID
      );
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  createAssistant,
  updateAssistant,
  getAssistant,
  testAssistant,
  assistantConfig,
  AVAILABLE_BARBERS,
};
