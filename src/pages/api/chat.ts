import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL!,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY!
);

// In-memory storage for active connections (in production, use Redis)
const activeConnections = new Map<string, { userId: string; userName: string; userRole: string; lastSeen: Date }>();

export const POST: APIRoute = async ({ request }) => {
  try {
    const { action, userId, userName, userRole, message } = await request.json();

    switch (action) {
      case "join":
        // Add user to active connections
        activeConnections.set(userId, {
          userId,
          userName,
          userRole,
          lastSeen: new Date(),
        });

        // Get recent chat history
        const { data: messages, error: historyError } = await supabase
          .from("chat_messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (historyError) {
          console.error("❌ [CHAT-API] Error fetching chat history:", historyError);
          return new Response(JSON.stringify({ error: "Failed to fetch chat history" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Clean up old connections (older than 5 minutes)
        const now = new Date();
        for (const [id, connection] of activeConnections.entries()) {
          if (now.getTime() - connection.lastSeen.getTime() > 5 * 60 * 1000) {
            activeConnections.delete(id);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: "joined",
            chatHistory: messages?.reverse() || [],
            onlineUsers: Array.from(activeConnections.values()),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );

      case "message":
        // Save message to database
        const { data: savedMessage, error: messageError } = await supabase
          .from("chat_messages")
          .insert({
            user_id: userId,
            user_name: userName,
            user_role: userRole,
            message: message,
            timestamp: new Date().toISOString(),
          })
          .select()
          .single();

        if (messageError) {
          console.error("❌ [CHAT-API] Error saving message:", messageError);
          return new Response(JSON.stringify({ error: "Failed to save message" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Update user's last seen
        if (activeConnections.has(userId)) {
          const connection = activeConnections.get(userId)!;
          connection.lastSeen = new Date();
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: "message_saved",
            message: savedMessage,
            onlineUsers: Array.from(activeConnections.values()),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );

      case "heartbeat":
        // Update user's last seen
        if (activeConnections.has(userId)) {
          const connection = activeConnections.get(userId)!;
          connection.lastSeen = new Date();
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: "heartbeat",
            onlineUsers: Array.from(activeConnections.values()),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("❌ [CHAT-API] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
