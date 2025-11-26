/**
 * Unified AI Agent Chat API
 * 
 * This is the main endpoint for interacting with the AI agent
 * Similar to Claude.ai's chat interface
 * 
 * POST /api/agent/chat
 */

import type { APIRoute } from "astro";
import { UnifiedFireProtectionAgent } from "../../../lib/ai/unified-agent";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

interface ChatRequest {
  message: string;
  conversationId?: string; // Optional: for maintaining conversation context
  context?: {
    projectId?: number;
    [key: string]: any;
  };
}

// Load conversation history from database
async function loadConversationHistory(conversationId: string) {
  if (!supabaseAdmin || !conversationId) return [];

  const { data: messages, error } = await supabaseAdmin
    .from("ai_agent_messages")
    .select("role, content")
    .eq("conversationId", conversationId)
    .order("createdAt", { ascending: true });

  if (error) {
    console.error("❌ [AGENT-CHAT] Error loading conversation history:", error);
    return [];
  }

  return (messages || []).map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));
}

// Save conversation message to database
async function saveConversationMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: any
) {
  if (!supabaseAdmin) return;

  const { error } = await supabaseAdmin
    .from("ai_agent_messages")
    .insert({
      conversationId,
      role,
      content,
      metadata: metadata || {},
    });

  if (error) {
    console.error("❌ [AGENT-CHAT] Error saving message:", error);
  }
}

// Create or get conversation
async function getOrCreateConversation(
  userId: string,
  conversationId?: string,
  projectId?: number
) {
  if (!supabaseAdmin) return null;

  if (conversationId) {
    // Verify conversation exists and belongs to user
    const { data: conv } = await supabaseAdmin
      .from("ai_agent_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("userId", userId)
      .single();

    if (conv) return conversationId;
  }

  // Create new conversation
  const { data: newConv, error } = await supabaseAdmin
    .from("ai_agent_conversations")
    .insert({
      userId,
      projectId: projectId || null,
      title: null, // Will be auto-generated from first message
    })
    .select("id")
    .single();

  if (error || !newConv) {
    console.error("❌ [AGENT-CHAT] Error creating conversation:", error);
    return null;
  }

  return newConv.id;
}

// Track usage for billing/monitoring
async function trackUsage(
  userId: string,
  conversationId: string | null,
  messageId: string | null,
  model: string,
  inputTokens: number,
  outputTokens: number,
  requestType: string = "chat"
) {
  if (!supabaseAdmin) return;

  const totalTokens = inputTokens + outputTokens;

  // Calculate estimated cost using database function
  const { data: costData, error: costError } = await supabaseAdmin.rpc(
    "calculate_ai_cost",
    {
      p_model: model,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
    }
  );

  const estimatedCost = costError ? null : costData;

  const { error } = await supabaseAdmin.from("ai_agent_usage").insert({
    userId,
    conversationId,
    messageId,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCost,
    requestType,
  });

  if (error) {
    console.error("❌ [AGENT-CHAT] Error tracking usage:", error);
  }
}

// Auto-generate conversation title from first message
async function updateConversationTitle(conversationId: string, firstMessage: string) {
  if (!supabaseAdmin) return;

  // Generate title from first 50 chars of message
  const title = firstMessage.substring(0, 50).trim();
  if (!title) return;

  await supabaseAdmin
    .from("ai_agent_conversations")
    .update({ title })
    .eq("id", conversationId)
    .is("title", null); // Only update if title is null
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
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

    const body: ChatRequest = await request.json();
    const { message, conversationId, context } = body;

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize AI agent
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error("❌ [AGENT-CHAT] AI API key not configured");
      console.error("❌ [AGENT-CHAT] Available env vars:", Object.keys(process.env).filter(k => k.includes('ANTHROPIC') || k.includes('API')));
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const agent = new UnifiedFireProtectionAgent(apiKey);

    console.log(`🤖 [AGENT-CHAT] Processing message from user ${currentUser.id}`);

    // Get or create conversation
    const finalConversationId = await getOrCreateConversation(
      currentUser.id,
      conversationId,
      context?.projectId
    );

    if (!finalConversationId) {
      return new Response(JSON.stringify({ error: "Failed to create conversation" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Load conversation history
    const conversationHistory = await loadConversationHistory(finalConversationId);

    // Build agent context
    const agentContext = {
      userId: currentUser.id,
      conversationHistory,
      ...context,
    };

    // Save user message
    await saveConversationMessage(finalConversationId, "user", message);

    // Update conversation title if this is the first message
    if (conversationHistory.length === 0) {
      await updateConversationTitle(finalConversationId, message);
    }

    // Process the query
    const response = await agent.processQuery({
      message,
      context: agentContext,
    });

    // Save assistant response
    const { data: savedMessage } = await supabaseAdmin
      .from("ai_agent_messages")
      .insert({
        conversationId: finalConversationId,
        role: "assistant",
        content: response.content,
        metadata: {
          actions: response.actions,
          model: response.metadata.model,
          tokensUsed: response.metadata.tokensUsed,
        },
      })
      .select("id")
      .single();

    // Track usage - use actual token counts from Claude API response
    const inputTokens = response.metadata.inputTokens || 0;
    const outputTokens = response.metadata.outputTokens || 0;
    
    await trackUsage(
      currentUser.id,
      finalConversationId,
      savedMessage?.id || null,
      response.metadata.model,
      inputTokens,
      outputTokens,
      "chat"
    );

    console.log(`✅ [AGENT-CHAT] Response generated (${response.metadata.tokensUsed} tokens)`);

    return new Response(
      JSON.stringify({
        success: true,
        response: response.content,
        actions: response.actions,
        metadata: response.metadata,
        conversationId: finalConversationId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-CHAT] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process message",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

