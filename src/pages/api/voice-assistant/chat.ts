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
- Send emails (use send_email tool when user wants to send an email)
- Check emails (use check_emails tool when user wants to check their inbox - note: requires additional setup)
- Read emails (use read_email tool when user wants to read a specific email - note: requires additional setup)

Guidelines:
- Keep responses short and natural for voice (1-2 sentences when possible)
- Be conversational, not robotic
- If you don't know something, say so honestly
- Use the knowledge base below to inform your responses
- When user asks to send an email, use the send_email tool with to, subject, and body parameters
- When user asks to check emails, use the check_emails tool
- When user asks to read a specific email, use the read_email tool with the email ID
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

    // Define email tools
    const tools = [
      {
        name: "send_email",
        description: "Send an email to a recipient. Use this when the user wants to send an email.",
        input_schema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "The recipient's email address",
            },
            subject: {
              type: "string",
              description: "The email subject line",
            },
            body: {
              type: "string",
              description: "The email body/content (plain text)",
            },
            html: {
              type: "string",
              description: "Optional HTML version of the email body",
            },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "check_emails",
        description: "Check the inbox for new emails. Returns a list of recent emails. Note: This requires email reading to be configured (Gmail API, Outlook API, or IMAP).",
        input_schema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of emails to return (default: 10)",
            },
          },
        },
      },
      {
        name: "read_email",
        description: "Read a specific email by its ID. Note: This requires email reading to be configured (Gmail API, Outlook API, or IMAP).",
        input_schema: {
          type: "object",
          properties: {
            emailId: {
              type: "string",
              description: "The ID of the email to read",
            },
          },
          required: ["emailId"],
        },
      },
    ];

    // Call Anthropic API with tools
    let response = await client.messages.create({
      model,
      max_tokens: 1024, // Shorter responses for voice
      system: systemPrompt,
      messages,
      tools,
    });

    // Handle tool calls
    let finalResponseText = "I'm not sure how to respond to that.";
    let toolResults: any[] = [];

    // Process tool calls if any
    if (response.content && response.content.length > 0) {
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const toolName = block.name;
          const toolInput = block.input;

          console.log(`🔧 [VOICE-ASSISTANT-API] Tool call: ${toolName}`, toolInput);

          let toolResult: any = {};

          try {
            if (toolName === "send_email") {
              const emailResponse = await fetch(
                new URL("/api/voice-assistant/email-send", request.url).toString(),
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(toolInput),
                }
              );
              toolResult = await emailResponse.json();
            } else if (toolName === "check_emails") {
              const emailResponse = await fetch(
                new URL("/api/voice-assistant/email-check", request.url).toString(),
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(toolInput),
                }
              );
              toolResult = await emailResponse.json();
            } else if (toolName === "read_email") {
              const emailResponse = await fetch(
                new URL("/api/voice-assistant/email-read", request.url).toString(),
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(toolInput),
                }
              );
              toolResult = await emailResponse.json();
            }

            toolResults.push({
              tool_use_id: block.id,
              type: "tool_result",
              content: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult),
            });
          } catch (error: any) {
            console.error(`❌ [VOICE-ASSISTANT-API] Error executing tool ${toolName}:`, error);
            toolResults.push({
              tool_use_id: block.id,
              type: "tool_result",
              content: JSON.stringify({
                success: false,
                error: error.message || "Tool execution failed",
              }),
              is_error: true,
            });
          }
        } else if (block.type === "text") {
          finalResponseText = block.text;
        }
      }
    }

    // If there are tool results, make another API call with the results
    if (toolResults.length > 0) {
      // Add tool results to messages
      messages.push({
        role: "assistant",
        content: response.content,
      });
      messages.push({
        role: "user",
        content: toolResults,
      });

      // Get final response with tool results
      response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        tools,
      });

      // Extract final response text
    if (response.content && response.content.length > 0) {
      const firstBlock = response.content[0];
      if (firstBlock.type === "text") {
          finalResponseText = firstBlock.text;
        }
      }
    }

    return new Response(
      JSON.stringify({
        response: finalResponseText,
        metadata: {
          tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens || 0,
          model,
          toolCalls: toolResults.length,
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

