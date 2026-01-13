/**
 * AI Agent Conversations API
 *
 * Manage conversations (list, get, delete)
 *
 * GET /api/agent/conversations - List user's conversations
 * GET /api/agent/conversations/[id] - Get conversation with messages
 * DELETE /api/agent/conversations/[id] - Delete conversation
 */

import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

// List conversations
export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const conversationId = url.searchParams.get("id");

    // Get specific conversation with messages
    if (conversationId) {
      const { data: conversation, error: convError } = await supabaseAdmin
        .from("ai_agent_conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("userId", currentUser.id)
        .single();

      if (convError || !conversation) {
        return new Response(JSON.stringify({ error: "Conversation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get messages
      const { data: messages, error: msgError } = await supabaseAdmin
        .from("ai_agent_messages")
        .select("*")
        .eq("conversationId", conversationId)
        .order("createdAt", { ascending: true });

      return new Response(
        JSON.stringify({
          success: true,
          conversation: {
            ...conversation,
            messages: messages || [],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // List all conversations for user
    const { data: conversations, error } = await supabaseAdmin
      .from("ai_agent_conversations")
      .select("id, title, projectId, createdAt, updatedAt")
      .eq("userId", currentUser.id)
      .order("updatedAt", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ [AGENT-CONVERSATIONS] Error fetching conversations:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch conversations" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        conversations: conversations || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-CONVERSATIONS] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Delete conversation
export const DELETE: APIRoute = async ({ request, cookies, url }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const conversationId = url.searchParams.get("id");

    if (!conversationId) {
      return new Response(JSON.stringify({ error: "Conversation ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify conversation belongs to user
    const { data: conversation, error: checkError } = await supabaseAdmin
      .from("ai_agent_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("userId", currentUser.id)
      .single();

    if (checkError || !conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete conversation (messages will be cascade deleted)
    const { error: deleteError } = await supabaseAdmin
      .from("ai_agent_conversations")
      .delete()
      .eq("id", conversationId);

    if (deleteError) {
      console.error("❌ [AGENT-CONVERSATIONS] Error deleting conversation:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete conversation" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conversation deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-CONVERSATIONS] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
