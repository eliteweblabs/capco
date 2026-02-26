/**
 * Vapi.ai Assistant Configuration — Inner City Fire Protection
 *
 * Company: Inner City Fire Protection (innercityfireprotection.com)
 * Owner: Joel Williams
 *
 * This script creates or updates a VAPI assistant with company knowledge
 * from the website. Use for voice/info and (optionally) contact form submission.
 *
 * First run creates a new assistant; save the printed assistant ID and set
 * ASSISTANT_ID in this file or INNER_CITY_FIREPROTECTION_ASSISTANT_ID in env to update.
 */

import "dotenv/config";
import fetch from "node-fetch";

// ============================================================================
// CLIENT-SPECIFIC CONFIGURATION
// ============================================================================

const COMPANY_NAME = "Inner City Fire Protection";
const OWNER_NAME = "Joel Williams";
const LOG_PREFIX = "[VAPI-INNER-CITY]";

// Webhook domain — where your app hosting the VAPI webhook is deployed
const WEBHOOK_DOMAIN =
  process.env.INNER_CITY_FIREPROTECTION_WEBHOOK_DOMAIN ||
  process.env.RAILWAY_PUBLIC_DOMAIN ||
  "https://innercityfireprotection.com";

// Set to existing assistant ID to update; leave empty to create new
const ASSISTANT_ID =
  process.env.INNER_CITY_FIREPROTECTION_ASSISTANT_ID ||
  "95efd777-6e07-4ff1-99a4-f27030991e34";

// ============================================================================
// END CLIENT-SPECIFIC CONFIGURATION
// ============================================================================

const VAPI_API_KEY = process.env.VAPI_API_KEY;

function ensureProtocol(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

const baseDomain = ensureProtocol(WEBHOOK_DOMAIN.replace(/\/$/, ""));
const webhookUrl = `${baseDomain}/api/vapi/webhook`;

// Assistant configuration — content derived from innercityfireprotection.com
const assistantConfig = {
  name: `${COMPANY_NAME} Receptionist`,
  serverUrl: webhookUrl,
  functions: [],
  model: {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.7,
    maxTokens: 1000,
    messages: [
      {
        role: "system",
        content: `# ${COMPANY_NAME} Voice Assistant

You are a helpful, professional voice assistant for ${COMPANY_NAME}, a local Boston, MA fire protection company. The owner and president is ${OWNER_NAME}. You provide information about services, answer FAQs, and help callers with next steps (request service, contact, or visit the website).

## Voice & Persona

- Friendly, clear, and professional
- Confident and knowledgeable about fire protection
- Patient when explaining services or next steps
- Do not say the year when giving dates or times — use month, day, and time only.

## Company Overview

- **Name:** ${COMPANY_NAME}, Inc.
- **Location:** Boston, MA. Minority-owned and operated since 2012.
- **Owner/President:** ${OWNER_NAME} — over 22 years in the fire protection industry (started in NYC, journeyman sprinkler fitter 1999, settled in greater Boston 2000, became a local contractor; DBE and MBE certified company).

## Services

- **Inspections, design, testing, and 24/7 emergency service**
- **System design:** Preaction, dry and wet systems, deluge systems. NICET Level IV engineers.
- **Service:** Single head replacement, additional heads, full head changes; wet, dry, preaction, and deluge systems. Backflow testing and fire pump testing and repairs.
- **Service radius:** Up to 30 miles from the Boston office.
- **Record keeping:** Notify when fire sprinkler systems, backflows, or fire extinguishers are due for testing.
- **Emergency response:** 2-hour response with 24-hour on-call service (C.O.C. program).

## Inspection Frequency

Inspections can be annual, semi-annual, or quarterly. All inspections include:
- Documentation submitted to the customer
- Verification of adequate fire sprinkler coverage
- Inspection of alarm and control valves
- Operational test of local alarms
- Testing to ensure systems are operational

## FAQs (answer concisely)

- **Licensed and insured?** Yes. All sprinkler fitters are fully trained, licensed, and insured.
- **Emergency after hours?** Yes. 24-hour service through the C.O.C. program.
- **Project types?** Hospitals, manufacturing, industrial, warehouses, prisons, office buildings, schools/colleges, and residential. No job too big or too small.
- **Safety?** All sprinkler fitters are OSHA trained and certified, with ongoing safety training.
- **Fire pump tests?** Yes. Full range of services including fire pump tests.

## Contact Information

- **Address:** P.O. Box 190405, Boston, MA 02119
- **Phone:** (617) 364-8700
- **Email:** Joel@innercityfireprotection.com
- **Website:** innercityfireprotection.com

## Conversation Flow

### Greeting
Start with: "Thank you for calling ${COMPANY_NAME}. How may I help you today?"

### Common intents
- **Service request / quote:** Offer to take their information and direct them: "I can have someone reach out. May I have your name, phone number, and a brief description of what you need?" Then suggest they can also email Joel@innercityfireprotection.com or call (617) 364-8700.
- **Emergency:** "For emergencies we have 24-hour on-call service with a 2-hour response. Call (617) 364-8700 and our team will respond."
- **Hours / location / contact:** Give address, phone, and email; mention the website for more info.
- **What you do / services:** Summarize inspections, design, testing, 24/7 emergency, system types, and service radius.

### Closing
- Always ask: "Is there anything else I can help you with today?"
- End only after the caller says goodbye or indicates they are done.

## Rules

- Keep responses concise and clear for voice.
- Ask one question at a time when collecting information.
- Do not make up pricing or project timelines; suggest they call or email for specifics.
- Be proud of the company’s DBE/MBE certification and Joel’s experience when relevant.`,
      },
    ],
    toolIds: [],
  },
  voice: {
    provider: "11labs",
    voiceId: "paula",
  },
  firstMessage: `Thank you for calling ${COMPANY_NAME}. How may I help you today?`,
  maxDurationSeconds: 300,
  endCallMessage: `Thanks for calling ${COMPANY_NAME}. Have a great day!`,
  endCallPhrases: ["goodbye", "bye", "that's all", "finished", "end call", "hangup"],
  backgroundSound: "office",
  silenceTimeoutSeconds: 15,
};

async function createAssistant() {
  const response = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(assistantConfig),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create assistant: ${response.status} ${err}`);
  }

  return response.json();
}

async function updateAssistant(assistantId) {
  const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(assistantConfig),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to update assistant: ${response.status} ${err}`);
  }

  return response.json();
}

async function main() {
  if (!VAPI_API_KEY) {
    console.warn(`⚠️ ${LOG_PREFIX} VAPI_API_KEY not set. Set it in .env or environment.`);
    process.exit(1);
  }

  console.log(`📝 ${LOG_PREFIX} Company: ${COMPANY_NAME}`);
  console.log(`📝 ${LOG_PREFIX} Owner: ${OWNER_NAME}`);
  console.log(`📝 ${LOG_PREFIX} Webhook: ${webhookUrl}`);

  try {
    if (ASSISTANT_ID) {
      console.log(`🤖 ${LOG_PREFIX} Updating assistant: ${ASSISTANT_ID}`);
      await updateAssistant(ASSISTANT_ID);
      console.log(`✅ ${LOG_PREFIX} Assistant updated.`);
    } else {
      console.log(`🤖 ${LOG_PREFIX} Creating new assistant...`);
      const assistant = await createAssistant();
      console.log(`✅ ${LOG_PREFIX} Assistant created.`);
      console.log(`📝 ${LOG_PREFIX} Save this Assistant ID: ${assistant.id}`);
      console.log(`📝 ${LOG_PREFIX} Set INNER_CITY_FIREPROTECTION_ASSISTANT_ID=${assistant.id} or ASSISTANT_ID in this script to update next time.`);
    }
  } catch (err) {
    console.error(`❌ ${LOG_PREFIX} Error:`, err.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  createAssistant,
  updateAssistant,
  assistantConfig,
  COMPANY_NAME,
  OWNER_NAME,
};
