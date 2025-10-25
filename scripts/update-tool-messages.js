import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const TOOL_ID = "0b17d3bc-a697-432b-8386-7ed1235fd111";

async function updateTool() {
  try {
    console.log("🔧 Updating VAPI tool messages...");
    const response = await fetch(`https://api.vapi.ai/tool/${TOOL_ID}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            type: "request-start",
            content: "",
          },
          {
            type: "request-complete",
            content: "",
          },
          {
            type: "request-failed",
            content: "I'm having trouble accessing that right now.",
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update tool: ${response.status} ${error}`);
    }

    const tool = await response.json();
    console.log("✅ Tool updated successfully!");
    return tool;
  } catch (error) {
    console.error("❌ Error updating tool:", error);
    return null;
  }
}

updateTool();
