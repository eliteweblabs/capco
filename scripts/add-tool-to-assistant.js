import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const ASSISTANT_ID = "3ae002d5-fe9c-4870-8034-4c66a9b43b51";

const toolId = process.argv[2];

if (!toolId) {
  console.error("❌ Please provide a tool ID:");
  console.error("Usage: node scripts/add-tool-to-assistant.js <TOOL_ID>");
  process.exit(1);
}

async function addToolToAssistant() {
  try {
    console.log("🔧 Adding tool to assistant...");

    const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: {
          provider: "openai",
          model: "gpt-4o",
          temperature: 0.7,
          maxTokens: 1000,
          toolIds: [toolId],
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant for CAPCO Fire Protection Systems. When the call starts, immediately call getAccountInfo() to get account information, then read the result to the user.",
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update assistant: ${response.status} ${error}`);
    }

    const assistant = await response.json();
    console.log("✅ Assistant updated successfully!");
    console.log("📋 Tool added to assistant:", ASSISTANT_ID);
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

addToolToAssistant();

