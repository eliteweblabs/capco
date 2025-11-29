import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

/**
 * Voice Assistant Chat API
 * Processes voice commands using Anthropic's Claude API
 * Leverages Supabase learning tables for context
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("❌ [VOICE-ASSISTANT-API] ANTHROPIC_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Anthropic client
    const client = new Anthropic({ apiKey });
    const model = "claude-3-haiku-20240307"; // Fast and cost-effective for voice

    // Initialize Supabase client
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SECRET ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.PUBLIC_SUPABASE_PUBLISHABLE;

    let knowledgeEntries: Array<{ title: string; content: string; category?: string }> = [];

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });

        // Load knowledge from Supabase
        const { data, error } = await supabase
          .from("ai_agent_knowledge")
          .select("title, content, category")
          .eq("isActive", true)
          .is("projectId", null)
          .order("priority", { ascending: false })
          .order("createdAt", { ascending: false })
          .limit(20);

        if (!error && data) {
          knowledgeEntries = data;
        }
      } catch (error) {
        console.error("❌ [VOICE-ASSISTANT-API] Error loading knowledge:", error);
        // Continue without knowledge if there's an error
      }
    }

    // Build system prompt
    let systemPrompt = `You are a helpful personal voice assistant, similar to Siri or Alexa. You are always-on and ready to help with various tasks.

Your personality:
- Friendly and conversational
- Concise in responses (voice responses should be brief - 1-2 sentences when possible)
- Helpful and proactive
- Natural and human-like

Capabilities:
- Answer questions
- Provide information
- Help with tasks
- Remember context from the conversation
- Learn from interactions

Guidelines:
- Keep responses short and natural for voice (1-2 sentences when possible)
- Be conversational, not robotic
- If you don't know something, say so honestly
- Use the knowledge base below to inform your responses
`;

    // Add knowledge base if available
    if (knowledgeEntries.length > 0) {
      systemPrompt += "\n\nKnowledge Base:\n";
      knowledgeEntries.forEach((entry, index) => {
        systemPrompt += `${index + 1}. [${entry.category || "general"}] ${entry.title}: ${entry.content}\n`;
      });
    }

    systemPrompt += `\n\nCurrent conversation context: You are in an active voice conversation. Respond naturally and helpfully.`;

    // Build messages array
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    // Add conversation history (last 10 exchanges)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role && msg.content) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({
      role: "user",
      content: message,
    });

    // Call Anthropic API
    const response = await client.messages.create({
      model,
      max_tokens: 1024, // Shorter responses for voice
      system: systemPrompt,
      messages,
    });

    // Extract response content
    let responseText = "I'm not sure how to respond to that.";
    if (response.content && response.content.length > 0) {
      const firstBlock = response.content[0];
      if (firstBlock.type === "text") {
        responseText = firstBlock.text;
      }
    }

    return new Response(
      JSON.stringify({
        response: responseText,
        metadata: {
          tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens || 0,
          model,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [VOICE-ASSISTANT-API] Error:", error);

    // Return user-friendly error
    let errorMessage = "I encountered an error processing your request.";
    if (error.status === 401) {
      errorMessage = "Authentication error. Please check API configuration.";
    } else if (error.status === 429) {
      errorMessage = "Rate limit exceeded. Please try again in a moment.";
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: error.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

