import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PUBLIC_DOMAIN || "https://capcofire.com";

// Get the public domain, ensuring it's a valid URL
let webhookUrl = RAILWAY_PUBLIC_DOMAIN.replace(/\$\{[^}]+\}/g, "").trim();

// Ensure we have a valid HTTPS URL
if (!webhookUrl.startsWith("http")) {
  if (webhookUrl) {
    webhookUrl = `https://${webhookUrl}`;
  } else {
    webhookUrl = "https://capcofire.com";
  }
}

if (!webhookUrl.startsWith("https://")) {
  throw new Error(`Invalid RAILWAY_PUBLIC_DOMAIN: ${RAILWAY_PUBLIC_DOMAIN}. Must be a valid HTTPS URL.`);
}

const finalWebhookUrl = `${webhookUrl}/api/vapi/webhook`;
console.log(`🔧 Using webhook URL: ${finalWebhookUrl}`);

// Create loadKnowledge tool for VAPI
// This tool loads knowledge from Supabase to inform the assistant's responses
async function createLoadKnowledgeTool() {
  try {
    console.log("🔧 Creating loadKnowledge tool for VAPI...");

    const toolConfig = {
      type: "function",
      async: false,
      function: {
        name: "loadKnowledge",
        description: "Load relevant knowledge from the database to help answer questions. Use this when you need information that might be in your memory/knowledge base. This searches the Supabase ai_agent_knowledge table for relevant information.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query or topic to find relevant knowledge entries",
            },
            category: {
              type: "string",
              description: "Optional category filter (e.g., 'conversation_memory', 'project_info', 'general')",
            },
            limit: {
              type: "number",
              description: "Maximum number of knowledge entries to return (default: 10)",
            },
          },
          required: ["query"],
        },
      },
      server: {
        url: finalWebhookUrl,
        timeoutSeconds: 15,
      },
      messages: [
        {
          type: "request-start",
          content: "Let me check my memory for that.",
        },
        {
          type: "request-complete",
          content: "Found it!",
        },
        {
          type: "request-failed",
          content: "I'm having trouble accessing my memory right now.",
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
    console.log("✅ Load knowledge tool created successfully!");
    console.log("📋 Tool ID:", tool.id);
    console.log("\nNow add this tool ID to your assistant using:");
    console.log(`node scripts/add-tool-to-assistant.js ${tool.id}`);
    console.log("\nOr add it manually in the VAPI dashboard under your assistant's tools.");

    return tool;
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

createLoadKnowledgeTool();

