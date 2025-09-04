import { createClient } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { Server } from "socket.io";

// Initialize Supabase client
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ [CHAT-SERVER] Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Store connected users (in-memory for now)
const connectedUsers = new Map();

// Socket.IO server instance (will be initialized on first request)
let io: Server | null = null;

export const GET: APIRoute = async ({ request }) => {
  try {
    // Initialize Socket.IO server if not already done
    if (!io) {
      // This is a simplified approach - in production you'd want proper Socket.IO integration
      console.log("🔔 [CHAT-SERVER] Chat server endpoint accessed");

      return new Response(
        JSON.stringify({
          status: "ok",
          message: "Chat server endpoint is available",
          usersOnline: connectedUsers.size,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        usersOnline: connectedUsers.size,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [CHAT-SERVER] Error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, data } = body;

    console.log("🔔 [CHAT-SERVER] Received action:", action);

    switch (action) {
      case "join":
        // Store user info
        connectedUsers.set(data.userId, {
          ...data,
          joinedAt: new Date(),
        });

        console.log(`🔔 [CHAT-SERVER] User joined: ${data.userName} (${data.userId})`);

        return new Response(
          JSON.stringify({
            success: true,
            message: "User joined",
            usersOnline: connectedUsers.size,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );

      case "message":
        console.log(`🔔 [CHAT-SERVER] Message from ${data.userName}: ${data.message}`);

        // Store message in Supabase
        if (supabase) {
          const { error } = await supabase.from("chat_messages").insert({
            user_id: data.userId,
            user_name: data.userName,
            user_role: data.userRole,
            message: data.message,
            timestamp: new Date().toISOString(),
          });

          if (error) {
            console.error("❌ [CHAT-SERVER] Error saving message:", error);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Message sent",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );

      case "getHistory":
        // Get chat history from Supabase
        if (supabase) {
          const { data: messages, error } = await supabase
            .from("chat_messages")
            .select("*")
            .order("timestamp", { ascending: false })
            .limit(50);

          if (error) {
            console.error("❌ [CHAT-SERVER] Error loading chat history:", error);
            return new Response(
              JSON.stringify({
                success: false,
                error: "Failed to load chat history",
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          // Reverse to show oldest first and normalize field names
          const chatHistory = messages
            ? messages.reverse().map((msg) => ({
                id: msg.id,
                userId: msg.user_id,
                userName: msg.user_name,
                userRole: msg.user_role,
                message: msg.message,
                timestamp: msg.timestamp,
              }))
            : [];

          return new Response(
            JSON.stringify({
              success: true,
              messages: chatHistory,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: "Supabase not available",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: "Unknown action",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("❌ [CHAT-SERVER] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
