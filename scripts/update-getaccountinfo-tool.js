import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SITE_URL = "https://capcofire.com";
const TOOL_ID = "0b17d3bc-a697-432b-8386-7ed1235fd111"; // getAccountInfo tool ID

// Update the tool to remove interfering messages
async function updateTool() {
  try {
    console.log("🔧 Updating getAccountInfo tool to remove status messages...");

    const toolConfig = {
      async: false,
      function: {
        name: "getAccountInfo",
        description: "Get current date/time and available appointment slots. Call this IMMEDIATELY when the call starts without waiting for user input.",
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
      // Remove messages - let assistant speak the result directly
      messages: [],
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
    console.log("✅ getAccountInfo tool updated!");
    console.log("📋 Messages removed - assistant will now speak result directly");

    return tool;
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

updateTool();

