import type { APIRoute } from "astro";

// MessageBird API endpoint to fetch voice connectors
export const GET: APIRoute = async ({ request }) => {
  try {
    const accessKey = import.meta.env.BIRD_ACCESS_KEY;
    const workspaceId = import.meta.env.BIRD_WORKSPACE_ID;

    if (!accessKey || !workspaceId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "MessageBird API credentials not configured",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch voice connectors from MessageBird API
    const response = await fetch(`https://api.bird.com/workspaces/${workspaceId}/connectors`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `AccessKey ${accessKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [MESSAGEBIRD-API] Failed to fetch voice connectors:", errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to fetch voice connectors: ${response.status} - ${errorText}`,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("✅ [MESSAGEBIRD-API] Voice connectors fetched:", data);

    return new Response(
      JSON.stringify({
        success: true,
        connectors: data || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ [MESSAGEBIRD-API] Error fetching voice connectors:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
