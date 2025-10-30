import type { APIRoute } from "astro";

/**
 * Vapi.ai Status API
 *
 * Checks the status of Vapi.ai configuration without requiring assistant setup
 */

export const GET: APIRoute = async () => {
  try {
    const vapiApiKey = process.env.VAPI_API_KEY;
    const assistantId = process.env.VAPI_ASSISTANT_ID;
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;

    console.log("🔍 [VAPI-STATUS] Environment variables:", {
      apiKey: !!vapiApiKey,
      apiKeyValue: vapiApiKey ? vapiApiKey.substring(0, 8) + "..." : "undefined",
      assistantId: assistantId,
      webhookSecret: !!webhookSecret,
      allEnvKeys: Object.keys(process.env).filter((key) => key.includes("VAPI")),
    });

    // Temporary fix: manually set the assistant ID for testing
    const finalAssistantId = assistantId;

    return new Response(
      JSON.stringify({
        success: true,
        status: {
          apiKey: {
            configured: !!vapiApiKey,
            hasValue: vapiApiKey ? vapiApiKey.length > 0 : false,
          },
          assistant: {
            configured: !!finalAssistantId,
            id: finalAssistantId || null,
          },
          webhook: {
            configured: !!webhookSecret,
            hasValue: webhookSecret ? webhookSecret.length > 0 : false,
          },
          environment: {
            siteUrl: process.env.RAILWAY_PUBLIC_DOMAIN || "http://localhost:4321",
          },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [VAPI-STATUS] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        status: {
          apiKey: { configured: false, hasValue: false },
          assistant: { configured: false, id: null },
          webhook: { configured: false, hasValue: false },
          environment: { siteUrl: "http://localhost:4321" },
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
