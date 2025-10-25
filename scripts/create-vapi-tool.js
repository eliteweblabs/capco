import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SITE_URL = "https://capcofire.com";

// Create a Custom Tool (not a function in the assistant)
async function createTool() {
  try {
    console.log("🔧 Creating VAPI Custom Tool...");

    const toolConfig = {
      type: "function",
      async: false,
      function: {
        name: "getAccountInfo",
        description: "Get Cal.com account information",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      server: {
        url: `${SITE_URL}/api/vapi/webhook`,
        timeoutSeconds: 20,
      },
      messages: [
        {
          type: "request-start",
          content: "Let me get your account information.",
        },
        {
          type: "request-complete",
          content: "Got it!",
        },
        {
          type: "request-failed",
          content: "I'm having trouble accessing that right now.",
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
    console.log("✅ Tool created successfully!");
    console.log("📋 Tool ID:", tool.id);
    console.log("\nNow add this tool ID to your assistant using:");
    console.log(`node scripts/add-tool-to-assistant.js ${tool.id}`);

    return tool;
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

createTool();
