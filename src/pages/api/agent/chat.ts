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
  images?: string[]; // Array of image URLs
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
    const { message, conversationId, context, images } = body;

    // Require either message text or images
    if (!message?.trim() && (!images || images.length === 0)) {
      return new Response(
        JSON.stringify({ error: "Message or images are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize AI agent
    // Railway exposes env vars via process.env at runtime
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Debug logging (always log in production to help diagnose Railway issues)
    console.log("[---AGENT-CHAT] Environment check:", {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + "..." : "none",
      allAnthropicKeys: Object.keys(process.env).filter(k => k.includes('ANTHROPIC')),
      nodeEnv: process.env.NODE_ENV,
    });

    if (!apiKey) {
      console.error("❌ [AGENT-CHAT] AI API key not configured");
      console.error("❌ [AGENT-CHAT] Checking environment variables...");
      console.error("❌ [AGENT-CHAT] process.env.ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "***exists***" : "undefined");
      console.error("❌ [AGENT-CHAT] import.meta.env.ANTHROPIC_API_KEY:", import.meta.env.ANTHROPIC_API_KEY ? "***exists***" : "undefined");
      console.error("❌ [AGENT-CHAT] Available env vars with 'ANTHROPIC':", Object.keys(process.env).filter(k => k.includes('ANTHROPIC')));
      console.error("❌ [AGENT-CHAT] Available env vars with 'API':", Object.keys(process.env).filter(k => k.includes('API')).slice(0, 10));
      console.error("❌ [AGENT-CHAT] Total env vars:", Object.keys(process.env).length);
      
      return new Response(JSON.stringify({ 
        error: "AI API key not configured",
        hint: "Please ensure ANTHROPIC_API_KEY is set in Railway environment variables",
        debug: {
          checkedProcessEnv: true,
          checkedImportMetaEnv: true,
          anthropicKeysFound: Object.keys(process.env).filter(k => k.includes('ANTHROPIC')),
        }
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate API key format (should start with sk-ant-)
    if (!apiKey.startsWith('sk-ant-')) {
      console.error("❌ [AGENT-CHAT] Invalid API key format (should start with 'sk-ant-')");
      return new Response(JSON.stringify({ 
        error: "Invalid API key format",
        hint: "ANTHROPIC_API_KEY should start with 'sk-ant-'"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[---AGENT-CHAT] API key found, initializing agent...");
    const agent = new UnifiedFireProtectionAgent(apiKey);

    console.log(`🤖 [AGENT-CHAT] Processing message from user ${currentUser.id}`);

    // Get or create conversation
    let finalConversationId: string | null = null;
    try {
      finalConversationId = await getOrCreateConversation(
        currentUser.id,
        conversationId,
        context?.projectId
      );
    } catch (dbError: any) {
      console.error("❌ [AGENT-CHAT] Database error creating conversation:", dbError);
      // If tables don't exist, continue without conversation history
      if (dbError?.code === "42P01" || dbError?.message?.includes("does not exist")) {
        console.warn("⚠️ [AGENT-CHAT] Conversation tables not found - run database migration");
        // Continue without conversation history - agent will still work
        finalConversationId = null;
      } else {
        return new Response(
          JSON.stringify({
            error: "Database error",
            message: "Failed to create conversation. Please check database setup.",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // If conversation creation failed and we don't have a conversationId, create a temporary one
    if (!finalConversationId && !conversationId) {
      finalConversationId = `temp_${Date.now()}_${currentUser.id.substring(0, 8)}`;
    }

    // Load conversation history (only if we have a real conversation ID)
    let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (finalConversationId && !finalConversationId.startsWith("temp_")) {
      try {
        conversationHistory = await loadConversationHistory(finalConversationId);
      } catch (dbError: any) {
        console.error("❌ [AGENT-CHAT] Error loading conversation history:", dbError);
        // Continue without history if tables don't exist
        conversationHistory = [];
      }
    }

      // Build agent context (include images)
      const agentContext = {
        userId: currentUser.id,
        conversationHistory,
        images: images || [],
        ...context,
      };

    // Save user message (only if we have a real conversation ID)
    if (finalConversationId && !finalConversationId.startsWith("temp_")) {
      try {
        await saveConversationMessage(finalConversationId, "user", message);
        // Update conversation title if this is the first message
        if (conversationHistory.length === 0) {
          await updateConversationTitle(finalConversationId, message);
        }
      } catch (dbError: any) {
        console.error("❌ [AGENT-CHAT] Error saving message:", dbError);
        // Continue even if save fails
      }
    }

    // Process the query (include images)
    const response = await agent.processQuery({
      message: message || (images && images.length > 0 ? "Please analyze these images" : ""),
      images: images || [],
      context: agentContext,
    });

    // Save assistant response (only if we have a real conversation ID)
    let savedMessageId: string | null = null;
    if (finalConversationId && !finalConversationId.startsWith("temp_")) {
      try {
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
        savedMessageId = savedMessage?.id || null;
      } catch (dbError: any) {
        console.error("❌ [AGENT-CHAT] Error saving assistant message:", dbError);
        // Continue even if save fails
      }
    }

    // Track usage (only if tables exist)
    try {
      const inputTokens = response.metadata.inputTokens || 0;
      const outputTokens = response.metadata.outputTokens || 0;
      
      await trackUsage(
        currentUser.id,
        finalConversationId && !finalConversationId.startsWith("temp_") ? finalConversationId : null,
        savedMessageId,
        response.metadata.model,
        inputTokens,
        outputTokens,
        "chat"
      );
    } catch (dbError: any) {
      console.error("❌ [AGENT-CHAT] Error tracking usage:", dbError);
      // Continue even if tracking fails
    }

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
    console.error("❌ [AGENT-CHAT] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });
    
    // Provide more helpful error messages
    let errorMessage = "Failed to process message";
    if (error.message?.includes("API key")) {
      errorMessage = "API key error: " + error.message;
    } else if (error.message?.includes("rate limit") || error.status === 429) {
      errorMessage = "Rate limit exceeded. Please try again in a moment.";
    } else if (error.status === 401 || error.message?.includes("401")) {
      errorMessage = "Authentication failed. Please check API key configuration.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        message: error.message,
        type: error.name || "UnknownError",
      }),
      {
        status: error.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

