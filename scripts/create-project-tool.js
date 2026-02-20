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

const TOOL_NAME = "createProject";

/** List existing VAPI tools and return those named createProject */
async function listCreateProjectTools() {
  const response = await fetch("https://api.vapi.ai/tool", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to list tools: ${response.status} ${err}`);
  }
  const body = await response.json();
  const tools = Array.isArray(body) ? body : body?.tools ?? body?.data ?? [];
  const createProjectTools = (Array.isArray(tools) ? tools : []).filter(
    (t) => t?.function?.name === TOOL_NAME
  );
  return createProjectTools;
}

// Create createProject tool for VAPI (skips if one already exists)
async function createProjectTool() {
  try {
    const existing = await listCreateProjectTools();
    if (existing.length > 0) {
      console.log(`⚠️ Found ${existing.length} existing "${TOOL_NAME}" tool(s). Skipping creation to avoid duplicates.`);
      existing.forEach((t, i) => console.log(`   ${i + 1}. ID: ${t.id}`));
      console.log("\nUse one of the IDs above in your assistant, or delete duplicates in the VAPI dashboard first.");
      return existing[0];
    }

    console.log(`🔧 Creating ${TOOL_NAME} tool for VAPI...`);

    const toolConfig = {
      type: "function",
      async: false,
      function: {
        name: "createProject",
        description: "Create a new fire protection project. Use this when the user wants to create a new project or job.",
        parameters: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "The project address/location",
            },
            title: {
              type: "string",
              description: "Project title (can be same as address if not specified)",
            },
            firstName: {
              type: "string",
              description: "Client's first name (required for new clients)",
            },
            lastName: {
              type: "string",
              description: "Client's last name (required for new clients)",
            },
            email: {
              type: "string",
              description: "Client's email address (required for new clients)",
            },
            companyName: {
              type: "string",
              description: "Client's company name (optional)",
            },
            authorId: {
              type: "string",
              description: "Existing client ID if using existing client (UUID format)",
            },
            description: {
              type: "string",
              description: "Project description or notes",
            },
            sqFt: {
              type: "string",
              description: "Square footage of the project",
            },
            newConstruction: {
              type: "boolean",
              description: "Whether this is new construction (true) or existing building (false)",
            },
            building: {
              type: "array",
              items: { type: "string" },
              description: "Building types: Residential, Mixed use, Mercantile, Commercial, Storage, Warehouse, Institutional",
            },
            project: {
              type: "array",
              items: { type: "string" },
              description: "Project types: Sprinkler, Alarm, Mechanical, Electrical, Plumbing, Civil engineering, Other",
            },
            tier: {
              type: "array",
              items: { type: "string" },
              description: "Tier level: Tier I, Tier II, Tier III",
            },
          },
          required: ["address"],
        },
      },
      server: {
        url: webhookUrl,
        timeoutSeconds: 30,
      },
      messages: [
        {
          type: "request-start",
          content: "Let me create that project for you.",
        },
        {
          type: "request-complete",
          content: "Project created successfully!",
        },
        {
          type: "request-failed",
          content: "I'm having trouble creating that project right now. Please try again.",
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
    console.log("✅ Project creation tool created successfully!");
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

createProjectTool();


