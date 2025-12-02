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

// Create rememberConversation tool for VAPI
async function createRememberTool() {
  try {
    console.log("🔧 Creating rememberConversation tool for VAPI...");

    const toolConfig = {
      type: "function",
      async: false,
      function: {
        name: "rememberConversation",
        description: "Save the current conversation to memory/knowledge base. Use this when the user says 'remember this', 'save this', or 'remember that'. This allows the assistant to learn from conversations.",
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "A brief title summarizing what was discussed (max 100 characters)",
            },
            content: {
              type: "string",
              description: "The full conversation content to save, including both user question and assistant response",
            },
            category: {
              type: "string",
              description: "Category for organizing the memory (e.g., 'conversation_memory', 'project_info', 'general')",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags to help organize and search this memory later",
            },
            priority: {
              type: "number",
              description: "Priority level (0=normal, 1=low, 5=medium, 10=high, 20=critical)",
            },
          },
          required: ["title", "content"],
        },
      },
      server: {
        url: finalWebhookUrl,
        timeoutSeconds: 20,
      },
      messages: [
        {
          type: "request-start",
          content: "Let me save that to memory.",
        },
        {
          type: "request-complete",
          content: "Saved!",
        },
        {
          type: "request-failed",
          content: "I'm having trouble saving that right now.",
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
    console.log("✅ Remember conversation tool created successfully!");
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

createRememberTool();

