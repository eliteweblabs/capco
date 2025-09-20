import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Check authentication
    const { currentUser } = await checkAuth(cookies);

    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Server-Sent Events stream
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(
          `data: ${JSON.stringify({ type: "connected", userId: currentUser.id })}\n\n`
        );

        // Keep connection alive with periodic pings
        const pingInterval = setInterval(() => {
          controller.enqueue(
            `data: ${JSON.stringify({ type: "ping", timestamp: Date.now() })}\n\n`
          );
        }, 30000); // Ping every 30 seconds

        // Cleanup on close
        const cleanup = () => {
          clearInterval(pingInterval);
        };

        // Handle client disconnect
        // Note: This is a simplified example - in production you'd want proper connection management
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("📱 [NOTIFICATION-STREAM] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
