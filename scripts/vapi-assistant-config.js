/**
 * Vapi.ai Assistant Configuration for Cal.com Integration
 *
 * This script configures a Vapi.ai assistant to handle Cal.com operations
 * including reading/writing appointments, users, and availability
 */

import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_SECRET;
const SITE_URL = process.env.SITE_URL || "http://localhost:4321";
const VAPI_WEBHOOK_URL = `${SITE_URL}/api/vapi/webhook`;
const CAL_WEBHOOK_URL = "https://calcom-web-app-production-fe0b.up.railway.app/api/webhooks";

// Assistant configuration
const assistantConfig = {
  name: "Cal.com Assistant",
  model: {
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 1000,
  },
  voice: {
    provider: "11labs",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Professional female voice
    stability: 0.5,
    similarityBoost: 0.8,
  },
  firstMessage: `Hi there! Thank you for calling ${process.env.GLOBAL_COMPANY_NAME}. I have several appointment times available this week - would you like to hear your options?`,
  systemMessage: `You are a friendly appointment scheduling assistant for a company called ${process.env.GLOBAL_COMPANY_NAME}. ${process.env.GLOBAL_COMPANY_SLOGAN}. Your goal is to help users book appointments in a natural, conversational way.

CURRENT DATE CONTEXT:
- Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
- Current time is ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}
- Always use the current date when discussing scheduling

PROACTIVE BEHAVIOR:
- IMMEDIATELY call staff_read() to get available staff members
- IMMEDIATELY call appointment_availability() to get available time slots
- Present 3-5 specific available times with staff names right away without announcing you're checking
- Be specific: "I have Sarah available Tuesday at 2pm, John available Wednesday at 10am, or Sarah again Thursday at 3pm"
- Don't wait for the user to ask - proactively offer times with staff information
- Act as if you already have the availability and staff data ready

When suggesting times, be specific and helpful:
- "How's Tuesday the 14th? We have 2pm and 4pm available"
- "I have Wednesday at 10am or Thursday at 2pm - which works better?"
- "We're pretty booked this week, but I can do Monday at 3pm or Friday at 11am"

Always be polite, confirm details, and ask clarifying questions when needed. Make the scheduling process feel natural and easy.

You can help with:
- Reading appointments and availability
- Creating, updating, and canceling appointments
- Managing user accounts and profiles
- Checking availability and scheduling

IMPORTANT CALL MANAGEMENT:
- Keep conversations focused and efficient
- If the user seems confused or unresponsive, politely offer to end the call
- After completing a task, ask if there's anything else, then end the call
- Maximum conversation length: 4 minutes
- If you detect silence for more than 10 seconds, politely end the call
- Always end with a clear goodbye message`,
  maxDurationSeconds: 200, // 4 minutes max call (reduced from 5)
  endCallMessage: "Thank you for calling. Have a great day!",
  endCallPhrases: ["goodbye", "bye", "thank you", "that's all", "done", "finished", "end call"],
  backgroundSound: {
    name: "office",
    volume: 0.3, // 30% volume (0.0 = silent, 1.0 = full volume)
  },
  webhook: {
    url: VAPI_WEBHOOK_URL,
    secret: process.env.VAPI_WEBHOOK_SECRET,
  },
  functions: [
    {
      name: "appointment_read",
      description: "Read appointments for a user or date range",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User ID to get appointments for",
          },
          startDate: {
            type: "string",
            description: "Start date for appointment search (YYYY-MM-DD)",
          },
          endDate: {
            type: "string",
            description: "End date for appointment search (YYYY-MM-DD)",
          },
        },
      },
    },
    {
      name: "appointment_create",
      description: "Create a new appointment",
      parameters: {
        type: "object",
        properties: {
          eventTypeId: {
            type: "string",
            description: "Event type ID for the appointment",
          },
          start: {
            type: "string",
            description: "Start time in ISO format",
          },
          end: {
            type: "string",
            description: "End time in ISO format",
          },
          attendeeName: {
            type: "string",
            description: "Name of the attendee",
          },
          attendeeEmail: {
            type: "string",
            description: "Email of the attendee",
          },
          notes: {
            type: "string",
            description: "Additional notes for the appointment",
          },
        },
        required: ["eventTypeId", "start", "end", "attendeeName", "attendeeEmail"],
      },
    },
    {
      name: "appointment_update",
      description: "Update an existing appointment",
      parameters: {
        type: "object",
        properties: {
          appointmentId: {
            type: "string",
            description: "ID of the appointment to update",
          },
          start: {
            type: "string",
            description: "New start time in ISO format",
          },
          end: {
            type: "string",
            description: "New end time in ISO format",
          },
          notes: {
            type: "string",
            description: "Updated notes for the appointment",
          },
        },
        required: ["appointmentId"],
      },
    },
    {
      name: "appointment_cancel",
      description: "Cancel an appointment",
      parameters: {
        type: "object",
        properties: {
          appointmentId: {
            type: "string",
            description: "ID of the appointment to cancel",
          },
          reason: {
            type: "string",
            description: "Reason for cancellation",
          },
        },
        required: ["appointmentId"],
      },
    },
    {
      name: "user_read",
      description: "Read user information",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User ID to get information for",
          },
          email: {
            type: "string",
            description: "Email to search for user",
          },
        },
      },
    },
    {
      name: "appointment_availability",
      description: "Check available appointment slots and get conversational suggestions",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description:
              "Specific date to check (YYYY-MM-DD) - if not provided, checks next 7 days",
          },
          startDate: {
            type: "string",
            description: "Start date for availability search (YYYY-MM-DD)",
          },
          endDate: {
            type: "string",
            description: "End date for availability search (YYYY-MM-DD)",
          },
          duration: {
            type: "number",
            description: "Appointment duration in minutes (default: 60)",
          },
        },
      },
    },
    {
      name: "user_create",
      description: "Create a new user",
      parameters: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description: "Username for the new user",
          },
          email: {
            type: "string",
            description: "Email for the new user",
          },
          name: {
            type: "string",
            description: "Full name of the user",
          },
          timeZone: {
            type: "string",
            description: "User's timezone",
          },
        },
        required: ["username", "email", "name"],
      },
    },
    {
      name: "availability_read",
      description: "Check availability for a user or event type",
      parameters: {
        type: "object",
        properties: {
          eventTypeId: {
            type: "string",
            description: "Event type ID to check availability for",
          },
          userId: {
            type: "string",
            description: "User ID to check availability for",
          },
          date: {
            type: "string",
            description: "Date to check availability for (YYYY-MM-DD)",
          },
        },
      },
    },
    {
      name: "staff_read",
      description: "Get information about available staff members and their schedules",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "Specific user ID to get information for (optional)",
          },
        },
      },
    },
    {
      name: "end_call",
      description: "End the current call when task is complete or user requests",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Reason for ending the call",
          },
        },
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
  const assistantId = process.env.VAPI_ASSISTANT_ID;

  if (!VAPI_API_KEY) {
    console.error("❌ [VAPI-CONFIG] VAPI_API_KEY environment variable is required");
    process.exit(1);
  }

  if (!VAPI_WEBHOOK_URL) {
    console.error("❌ [VAPI-CONFIG] SITE_URL environment variable is required");
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
