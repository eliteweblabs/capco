import type { APIRoute } from "astro";

/**
 * Vapi.ai Assistant API
 *
 * Returns the configured assistant for voice calls
 */

export const GET: APIRoute = async () => {
  try {
    const assistantId =
      process.env.PUBLIC_VAPI_ASSISTANT_ID || "3ae002d5-fe9c-4870-8034-4c66a9b43b51";

    if (!assistantId) {
      return new Response(
        JSON.stringify({
          error: "Vapi.ai assistant not configured",
          message: "Please run the Vapi.ai setup script first",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        assistant: {
          id: assistantId,
          name: "Cal.com Assistant",
          status: "active",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [VAPI-ASSISTANT] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
