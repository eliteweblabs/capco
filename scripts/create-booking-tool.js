import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SITE_URL = "https://capcofire.com";

// Create bookAppointment tool
async function createBookingTool() {
  try {
    console.log("🔧 Creating bookAppointment tool...");

    const toolConfig = {
      type: "function",
      async: false,
      function: {
        name: "bookAppointment",
        description: "Book an appointment for a user",
        parameters: {
          type: "object",
          properties: {
            start: {
              type: "string",
              description: "ISO timestamp of appointment start time (e.g., 2025-10-27T09:00:00.000Z)",
            },
            name: {
              type: "string",
              description: "Customer's full name",
            },
            email: {
              type: "string",
              description: "Customer's email address",
            },
          },
          required: ["start", "name", "email"],
        },
      },
      server: {
        url: `${SITE_URL}/api/vapi/webhook`,
        timeoutSeconds: 20,
      },
      messages: [
        {
          type: "request-start",
          content: "Let me book that for you.",
        },
        {
          type: "request-complete",
          content: "Done!",
        },
        {
          type: "request-failed",
          content: "I'm having trouble booking that right now.",
        },
      ],
    };

    const response = await fetch("https://api.vapi.ai/tool", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toolConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create tool: ${response.status} ${error}`);
    }

    const tool = await response.json();
    console.log("✅ bookAppointment tool created!");
    console.log("📋 Tool ID:", tool.id);
    console.log("\nAdd this to your assistant's toolIds array");

    return tool;
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

createBookingTool();

