import { EventEmitter } from "events";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

/**
 * AI-powered command processor that uses Anthropic's Claude API
 * and leverages the learning tables from Supabase
 */
export class AICommandProcessor extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.conversationHistory = [];
    this.maxHistoryLength = 10; // Keep last 10 exchanges

    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }
    this.client = new Anthropic({ apiKey });
    this.model = "claude-3-haiku-20240307"; // Fast and cost-effective for voice

    // Initialize Supabase client for learning tables
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SECRET ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.PUBLIC_SUPABASE_PUBLISHABLE;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      console.log("✅ [AI-COMMAND-PROCESSOR] Supabase client initialized");
    } else {
      console.warn(
        "⚠️ [AI-COMMAND-PROCESSOR] Supabase not configured - learning tables unavailable"
      );
      this.supabase = null;
    }
  }

  /**
   * Process a voice command using AI
   */
  async process(text) {
    try {
      // Load knowledge from Supabase learning tables
      const knowledge = await this.loadKnowledge();

      // Build system prompt with knowledge context
      const systemPrompt = this.buildSystemPrompt(knowledge);

      // Add user message to conversation history
      this.conversationHistory.push({
        role: "user",
        content: text,
      });

      // Keep conversation history manageable
      if (this.conversationHistory.length > this.maxHistoryLength * 2) {
        // Keep first system message and last N exchanges
        const systemMsg = this.conversationHistory[0];
        const recent = this.conversationHistory.slice(-this.maxHistoryLength * 2);
        this.conversationHistory = [systemMsg, ...recent];
      }

      // Call Anthropic API
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024, // Shorter responses for voice
        system: systemPrompt,
        messages: this.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      // Extract response content
      const content = this.extractContent(response);

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: content,
      });

      // Update learning tables if the conversation contains learnable information
      await this.updateLearning(text, content);

      return content;
    } catch (error) {
      console.error("❌ [AI-COMMAND-PROCESSOR] Error processing command:", error);

      // Fallback response
      if (error.status === 401) {
        return "I'm having trouble authenticating. Please check my API configuration.";
      } else if (error.status === 429) {
        return "I'm being rate limited. Please try again in a moment.";
      } else {
        return `I encountered an error: ${error.message}. Could you try rephrasing that?`;
      }
    }
  }

  /**
   * Load knowledge from Supabase learning tables
   */
  async loadKnowledge() {
    if (!this.supabase) {
      return [];
    }

    try {
      // Load global knowledge (projectId is null)
      const { data: knowledgeEntries, error } = await this.supabase
        .from("ai_agent_knowledge")
        .select("title, content, category")
        .eq("isActive", true)
        .is("projectId", null)
        .order("priority", { ascending: false })
        .order("createdAt", { ascending: false })
        .limit(20); // Limit to most relevant entries

      if (error) {
        console.error("❌ [AI-COMMAND-PROCESSOR] Error loading knowledge:", error);
        return [];
      }

      return knowledgeEntries || [];
    } catch (error) {
      console.error("❌ [AI-COMMAND-PROCESSOR] Exception loading knowledge:", error);
      return [];
    }
  }

  /**
   * Build system prompt with knowledge context
   */
  buildSystemPrompt(knowledge) {
    let prompt = `You are a helpful personal voice assistant, similar to Siri or Alexa. You are always-on and ready to help with various tasks.

Your personality:
- Friendly and conversational
- Concise in responses (voice responses should be brief)
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
    if (knowledge && knowledge.length > 0) {
      prompt += "\n\nKnowledge Base:\n";
      knowledge.forEach((entry, index) => {
        prompt += `${index + 1}. [${entry.category || "general"}] ${entry.title}: ${entry.content}\n`;
      });
    }

    prompt += `\n\nCurrent conversation context: You are in an active voice conversation. Respond naturally and helpfully.`;

    return prompt;
  }

  /**
   * Extract content from Anthropic API response
   */
  extractContent(response) {
    if (response.content && response.content.length > 0) {
      const firstBlock = response.content[0];
      if (firstBlock.type === "text") {
        return firstBlock.text;
      }
    }
    return "I'm not sure how to respond to that.";
  }

  /**
   * Update learning tables with new information from conversation
   * This allows the assistant to learn from interactions
   */
  async updateLearning(userMessage, assistantResponse) {
    if (!this.supabase) {
      return;
    }

    // Simple heuristic: if user provides information or asks a complex question,
    // we could potentially learn from it. For now, we'll just log it.
    // In a more sophisticated implementation, you could:
    // - Extract facts from the conversation
    // - Store important information in ai_agent_knowledge
    // - Update project memory if relevant

    // This is a placeholder for future learning capabilities
    // You could add logic here to extract and store learnable information
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get current conversation history length
   */
  getHistoryLength() {
    return this.conversationHistory.length;
  }
}
