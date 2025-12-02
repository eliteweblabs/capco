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
    console.log("🔧 Fetching current assistant configuration...");

    // First, get the current assistant configuration
    const getResponse = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
      },
    });

    if (!getResponse.ok) {
      const error = await getResponse.text();
      throw new Error(`Failed to fetch assistant: ${getResponse.status} ${error}`);
    }

    const currentAssistant = await getResponse.json();
    console.log("✅ Current assistant configuration loaded");

    // Get existing toolIds or initialize empty array
    const existingToolIds = currentAssistant.model?.toolIds || [];

    // Check if tool already exists
    if (existingToolIds.includes(toolId)) {
      console.log(`⚠️  Tool ${toolId} is already in the assistant's tool list`);
      console.log("📋 Current tools:", existingToolIds);
      return;
    }

    // Add the new tool ID to the existing list
    const updatedToolIds = [...existingToolIds, toolId];
    console.log("📋 Adding tool to list. Updated tools:", updatedToolIds);

    // Update ONLY the toolIds, preserving all other configuration
    const updateResponse = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: {
          ...currentAssistant.model, // Preserve existing model config
          toolIds: updatedToolIds, // Only update toolIds
        },
      }),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update assistant: ${updateResponse.status} ${error}`);
    }

    const updatedAssistant = await updateResponse.json();
    console.log("✅ Assistant updated successfully!");
    console.log("📋 Tool added to assistant:", ASSISTANT_ID);
    console.log("📋 Total tools now:", updatedAssistant.model?.toolIds?.length || 0);
    console.log("📋 Tool IDs:", updatedAssistant.model?.toolIds || []);
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

addToolToAssistant();
