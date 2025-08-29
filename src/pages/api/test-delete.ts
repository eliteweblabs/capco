import type { APIRoute } from "astro";

export const DELETE: APIRoute = async ({ request }) => {
  try {
    console.log("Test delete endpoint called");
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Test delete endpoint working",
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Test delete error:", error);
    return new Response(
      JSON.stringify({ error: "Test delete failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
