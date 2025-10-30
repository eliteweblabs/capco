import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const RAILWAY_PUBLIC_DOMAIN = "https://capcofire.com";
const TOOL_ID = "5b8ac059-9bbe-4a27-985d-70df87f9490d";

async function updateBookingTool() {
  try {
    console.log("🔧 Updating bookAppointment tool to include phone...");

    const toolConfig = {
      async: false,
      function: {
        name: "bookAppointment",
        description: "Book an appointment for a user",
        parameters: {
          type: "object",
          properties: {
            start: {
              type: "string",
              description:
                "ISO timestamp of appointment start time (e.g., 2025-10-27T09:00:00.000Z)",
            },
            name: {
              type: "string",
              description: "Customer's full name",
            },
            email: {
              type: "string",
              description: "Customer's email address",
            },
            phone: {
              type: "string",
              description:
                "Customer's phone number for SMS reminders (E.164 format, e.g., +12345678900)",
            },
          },
          required: ["start", "name", "email"],
        },
      },
      server: {
        url: `${RAILWAY_PUBLIC_DOMAIN}/api/vapi/webhook`,
        timeoutSeconds: 20,
      },
    };

    const response = await fetch(`https://api.vapi.ai/tool/${TOOL_ID}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toolConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update tool: ${response.status} ${error}`);
    }

    const tool = await response.json();
    console.log("✅ bookAppointment tool updated with phone parameter!");

    return tool;
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

updateBookingTool();
