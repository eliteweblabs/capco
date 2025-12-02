import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;

// Get the public domain, ensuring it's a valid URL
let RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PUBLIC_DOMAIN || "https://capcofire.com";

// Remove any template literal syntax if present
RAILWAY_PUBLIC_DOMAIN = RAILWAY_PUBLIC_DOMAIN.replace(/\$\{[^}]+\}/g, "").trim();

// Ensure we have a valid HTTPS URL
if (!RAILWAY_PUBLIC_DOMAIN.startsWith("http")) {
  // If it doesn't start with http, assume https://
  if (RAILWAY_PUBLIC_DOMAIN) {
    RAILWAY_PUBLIC_DOMAIN = `https://${RAILWAY_PUBLIC_DOMAIN}`;
  } else {
    RAILWAY_PUBLIC_DOMAIN = "https://capcofire.com";
  }
}

// Final validation
if (!RAILWAY_PUBLIC_DOMAIN.startsWith("https://")) {
  throw new Error(`Invalid RAILWAY_PUBLIC_DOMAIN: ${RAILWAY_PUBLIC_DOMAIN}. Must be a valid HTTPS URL.`);
}

const webhookUrl = `${RAILWAY_PUBLIC_DOMAIN}/api/vapi/webhook`;
console.log(`🔧 Using webhook URL: ${webhookUrl}`);

// Create processFile tool for VAPI
async function createFileUploadTool() {
  try {
    console.log("🔧 Creating processFile tool for VAPI...");

    const toolConfig = {
      type: "function",
      async: false,
      function: {
        name: "processFile",
        description: "Process an uploaded PDF or image file. Extract text content using OCR for images or text extraction for PDFs. Use this when the user uploads a document or image file.",
        parameters: {
          type: "object",
          properties: {
            fileUrl: {
              type: "string",
              description: "The URL of the uploaded file (provided by VAPI when user uploads a file)",
            },
            fileName: {
              type: "string",
              description: "The name of the file",
            },
            fileType: {
              type: "string",
              description: "The MIME type of the file (e.g., 'application/pdf', 'image/png', 'image/jpeg')",
            },
            saveToKnowledge: {
              type: "boolean",
              description: "Whether to save the extracted content to the knowledge base for future reference",
              default: false,
            },
          },
          required: ["fileUrl", "fileName", "fileType"],
        },
      },
      server: {
        url: webhookUrl,
        timeoutSeconds: 60, // File processing may take longer
      },
      messages: [
        {
          type: "request-start",
          content: "Let me process that file for you.",
        },
        {
          type: "request-complete",
          content: "File processed successfully!",
        },
        {
          type: "request-failed",
          content: "I'm having trouble processing that file right now. Please try again.",
        },
      ],
    };

    const response = await fetch("https://api.vapi.ai/tool", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toolConfig),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create tool: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Tool created successfully!");
    console.log("📋 Tool ID:", result.id);
    console.log("\n💡 Next step: Add this tool ID to your VAPI assistant:");
    console.log(`   node scripts/add-tool-to-assistant.js ${result.id}`);
    
    return result.id;
  } catch (error) {
    console.error("❌ Error creating tool:", error);
    throw error;
  }
}

// Run the script
if (!VAPI_API_KEY) {
  console.error("❌ VAPI_API_KEY environment variable is required");
  process.exit(1);
}

createFileUploadTool()
  .then((toolId) => {
    console.log("\n✅ File upload tool created successfully!");
    console.log(`Tool ID: ${toolId}`);
  })
  .catch((error) => {
    console.error("\n❌ Failed to create file upload tool:", error);
    process.exit(1);
  });

