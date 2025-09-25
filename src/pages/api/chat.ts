import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

// In-memory storage for active connections (in production, use Redis)
const activeConnections = new Map<
  string,
  { userId: string; userName: string; userRole: string; lastSeen: Date }
>();

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("🔔 [CHAT-API] ===== CHAT API CALLED =====");
    console.log("🔔 [CHAT-API] API called, checking supabase connection...");

    if (!supabase) {
      console.error("🔔 [CHAT-API] Supabase client is null - database connection not available");
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await request.json();
    const { action, userId, userName, userRole, message } = body;
    console.log("🔔 [CHAT-API] Request data:", {
      action,
      userId,
      userName,
      userRole,
      message: message ? message.substring(0, 50) + "..." : "N/A",
    });

    switch (action) {
      case "join":
        // Add user to active connections
        activeConnections.set(userId, {
          userId,
          userName,
          userRole,
          lastSeen: new Date(),
        });
        console.log("🔔 [CHAT-API] User joined:", { userId, userName, userRole });
        console.log("🔔 [CHAT-API] Total active connections:", activeConnections.size);

        if (!supabaseAdmin) {
          console.error(
            "❌ [CHAT-API] Supabase admin client is null - database connection not available"
          );
          return new Response(JSON.stringify({ error: "Database connection not available" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        // Get recent chat history using admin client
        const { data: messages, error: historyError } = await supabaseAdmin
          .from("chat_messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (historyError) {
          console.error("❌ [CHAT-API] Error fetching chat history:", historyError);
          return new Response(JSON.stringify({ error: "Failed to fetch chat history" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Clean up old connections (older than 5 minutes)
        const now = new Date();
        for (const [id, connection] of activeConnections.entries()) {
          if (now.getTime() - connection.lastSeen.getTime() > 5 * 60 * 1000) {
            activeConnections.delete(id);
          }
        }

        const responseData = {
          success: true,
          action: "joined",
          chatHistory: messages?.reverse() || [],
          onlineUsers: Array.from(activeConnections.values()),
        };

        console.log("🔔 [CHAT-API] Join response data:", responseData);

        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });

      case "message":
        console.log("🔔 [CHAT-API] Saving message:", { userId, userName, userRole, message });

        if (!supabaseAdmin) {
          console.error(
            "❌ [CHAT-API] Supabase admin client is null - database connection not available"
          );
          return new Response(JSON.stringify({ error: "Database connection not available" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        // Save message to database using admin client to bypass RLS
        const { data: savedMessage, error: messageError } = await supabaseAdmin
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
          console.error("❌ [CHAT-API] Error code:", messageError.code);
          console.error("❌ [CHAT-API] Error message:", messageError.message);
          console.error("❌ [CHAT-API] Error details:", messageError.details);
          console.error("❌ [CHAT-API] Error hint:", messageError.hint);
          console.error("❌ [CHAT-API] User ID being inserted:", userId);
          console.error("❌ [CHAT-API] User name being inserted:", userName);
          console.error("❌ [CHAT-API] User role being inserted:", userRole);
          console.error("❌ [CHAT-API] Message being inserted:", message);
          return new Response(
            JSON.stringify({ error: "Failed to save message", details: messageError.message }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        console.log("✅ [CHAT-API] Message saved successfully:", savedMessage);

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
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );

      case "heartbeat":
        // Update user's last seen
        if (activeConnections.has(userId)) {
          const connection = activeConnections.get(userId)!;
          connection.lastSeen = new Date();
          console.log("🔔 [CHAT-API] Updated heartbeat for user:", userId);
        } else {
          console.log("🔔 [CHAT-API] User not found in active connections:", userId);
        }

        console.log("🔔 [CHAT-API] Active connections:", Array.from(activeConnections.keys()));
        console.log("🔔 [CHAT-API] Online users:", Array.from(activeConnections.values()));

        return new Response(
          JSON.stringify({
            success: true,
            action: "heartbeat",
            onlineUsers: Array.from(activeConnections.values()),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );

      case "get_messages":
        // Get recent messages using admin client
        if (!supabaseAdmin) {
          console.error(
            "❌ [CHAT-API] Supabase admin client is null - database connection not available"
          );
          return new Response(JSON.stringify({ error: "Database connection not available" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        const { data: recentMessages, error: recentError } = await supabaseAdmin
          .from("chat_messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (recentError) {
          console.error("❌ [CHAT-API] Error fetching recent messages:", recentError);
          return new Response(JSON.stringify({ error: "Failed to fetch messages" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: "get_messages",
            messages: recentMessages || [],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
  } catch (error) {
    console.error("❌ [CHAT-API] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }
};

// CORS preflight handler
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};
