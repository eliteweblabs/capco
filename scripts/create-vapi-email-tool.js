/**
 * VAPI Tool Creation Script for Email Confirmation
 *
 * This script creates a VAPI tool for sending confirmation emails
 * after appointments are booked through the VAPI assistant.
 */

import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SITE_URL = "https://capcofire.com";

// Tool definition for sending confirmation emails
const emailConfirmationTool = {
  type: "function",
  function: {
    name: "sendConfirmationEmail",
    description: "Send a confirmation email to the customer after booking an appointment",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Customer's full name",
        },
        email: {
          type: "string",
          description: "Customer's email address",
        },
        appointmentDetails: {
          type: "object",
          description: "Details about the booked appointment",
          properties: {
            date: {
              type: "string",
              description: "Appointment date",
            },
            time: {
              type: "string",
              description: "Appointment time",
            },
            duration: {
              type: "string",
              description: "Appointment duration",
            },
            location: {
              type: "string",
              description: "Meeting location or type",
            },
            meetingType: {
              type: "string",
              description: "Type of meeting (consultation, review, etc.)",
            },
          },
        },
      },
      required: ["name", "email", "appointmentDetails"],
    },
    server: {
      url: `${SITE_URL}/api/vapi/send-confirmation-email`,
    },
  },
};

// Create the tool
async function createEmailConfirmationTool() {
  try {
    console.log("📧 [VAPI-EMAIL-TOOL] Creating email confirmation tool...");

    const response = await fetch("https://api.vapi.ai/tool", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailConfirmationTool),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [VAPI-EMAIL-TOOL] Failed to create tool:", errorText);
      return;
    }

    const result = await response.json();
    console.log("✅ [VAPI-EMAIL-TOOL] Tool created successfully!");
    console.log("📧 [VAPI-EMAIL-TOOL] Tool ID:", result.id);
    console.log("📧 [VAPI-EMAIL-TOOL] Tool Name:", result.function.name);

    console.log("\n🔧 [VAPI-EMAIL-TOOL] Next steps:");
    console.log("1. Copy the Tool ID above");
    console.log("2. Update the vapi-assistant-config.js file with the new Tool ID");
    console.log("3. Replace 'email-confirmation-tool-id' with the actual Tool ID");
  } catch (error) {
    console.error("❌ [VAPI-EMAIL-TOOL] Error creating tool:", error);
  }
}

// Run the tool creation
createEmailConfirmationTool();
