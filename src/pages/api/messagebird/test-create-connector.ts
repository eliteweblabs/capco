import type { APIRoute } from "astro";

// Test endpoint to create voice connector with detailed debugging
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { phoneNumberId, name } = body;

    const accessKey = import.meta.env.BIRD_ACCESS_KEY;
    const workspaceId = import.meta.env.BIRD_WORKSPACE_ID;

    if (!accessKey || !workspaceId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "MessageBird API credentials not configured",
          debug: {
            accessKey: accessKey ? "Set" : "Not set",
            workspaceId: workspaceId ? "Set" : "Not set",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = `https://api.bird.com/workspaces/${workspaceId}/connectors`;
    const payload = {
      connectorTemplateRef: "voice-messagebird:1",
      name: name || "Test Voice Connector",
      arguments: {
        phoneNumberId: phoneNumberId,
      },
      channelConversationalStatusEnabled: true,
    };

    console.log("🔧 [DEBUG] Creating voice connector with:", {
      url,
      payload,
      accessKey: accessKey ? "Set" : "Not set",
      workspaceId,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `AccessKey ${accessKey}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("🔧 [DEBUG] Response status:", response.status);
    console.log("🔧 [DEBUG] Response body:", responseText);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create voice connector: ${response.status}`,
          debug: {
            status: response.status,
            statusText: response.statusText,
            responseBody: responseText,
            requestUrl: url,
            requestPayload: payload,
            headers: Object.fromEntries(response.headers.entries()),
          },
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = JSON.parse(responseText);
    return new Response(
      JSON.stringify({
        success: true,
        connector: data,
        debug: {
          requestUrl: url,
          requestPayload: payload,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [DEBUG] Error creating voice connector:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        debug: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
