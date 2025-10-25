import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;

async function listTools() {
  try {
    console.log("🔧 Fetching all VAPI tools...\n");

    const response = await fetch("https://api.vapi.ai/tool", {
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed: ${response.status} ${await response.text()}`);
    }

    const tools = await response.json();
    console.log(`Found ${tools.length} tools:\n`);

    tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name || tool.type}`);
      console.log(`   ID: ${tool.id}`);
      console.log(`   Type: ${tool.type}`);
      if (tool.function) {
        console.log(`   Function: ${tool.function.name}`);
      }
      if (tool.server) {
        console.log(`   Server URL: ${tool.server.url}`);
      }
      console.log("");
    });

    return tools;
  } catch (error) {
    console.error("Error:", error);
  }
}

listTools();
