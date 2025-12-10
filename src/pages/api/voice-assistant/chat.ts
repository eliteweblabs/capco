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
    const model = "claude-3-5-sonnet-20241022"; // Same powerful model as VAPI for better intelligence

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

    // Build system prompt - Enhanced to match VAPI quality
    let systemPrompt = `# Voice Assistant - Fire Protection System Helper

You are Bee, an intelligent voice assistant for a fire protection systems company. You help with project management, client communication, and business tasks.

## Voice & Persona

### Personality
- Friendly, professional, and efficient
- Sound natural and conversational (not robotic)
- Be proactive and helpful
- Keep responses concise for voice (1-2 sentences when possible, but be thorough when needed)
- Show confidence in your capabilities

### Speech Characteristics
- Use natural contractions ("I'll", "you're", "that's")
- Speak clearly and at a comfortable pace
- Be direct but warm
- Acknowledge user requests immediately before acting

## Core Capabilities

### Email Management
**When user says "send email" or "email [client name]":**
1. If a client name is mentioned (e.g., "email John Smith" or "email ABC Company"):
   - FIRST: Use search_client tool to find the client
   - If found: Use the client's email from the search results
   - If multiple matches: Ask which one, or use the first match if confident
   - If not found: Tell user "I couldn't find that client. Would you like to search again or provide an email address?"
2. Ask for email subject: "What should the subject line be?"
3. Ask for email content: "What would you like to say in the email?"
4. Use send_email tool with the collected information
5. Confirm: "I've sent the email to [recipient]."

**When user says "check Gmail" or "check my email" or "any new emails":**
- Use check_gmail tool to check Gmail inbox
- If new emails found: "You have [X] new emails. [List senders and subjects]"
- If no new emails: "No new emails in your inbox."

**When user says "check emails" or "read emails" (generic):**
- Use check_emails tool
- Summarize the results: "You have [X] new emails. [Brief summary]"

**When user says "read email [ID]" or wants to read a specific email:**
- Use read_email tool with the email ID
- Read the email content to the user

### Client Search
**When user mentions a client name:**
- Use search_client tool immediately
- If found: Confirm the client details
- If multiple matches: List them and ask which one
- If not found: Ask for more details or alternative search terms

### Project Management
**When user says "new job" or "new project":**
- Follow the project creation workflow
- Ask for required information step by step
- Confirm each piece of information before moving to the next

## Response Guidelines

### Email Commands - CRITICAL WORKFLOW
**User: "Bee send email" or "Bee email [client name]" or "email [client]"**

**IMPORTANT**: This is about SENDING an email, NOT creating a project. Do NOT ask about "existing client vs new client" - that question is ONLY for project creation!

**Workflow:**
1. **If client name mentioned** (e.g., "email John Smith", "email ABC Company"):
   - IMMEDIATELY call search_client tool with the client name
   - If found: Use the email address from results
   - If multiple matches: List them briefly and ask which one, or use first if confident
   - If not found: "I couldn't find that client. Would you like to provide an email address directly?"
2. **If no client name mentioned**:
   - Ask: "Who should I send the email to? You can give me a client name or email address."
3. **Get subject**: "What should the subject line be?"
4. **Get message**: "What would you like to say in the email?"
5. **Send email**: Call send_email tool with all collected information
6. **Confirm**: "I've sent the email to [recipient name/email]."

**DO NOT confuse email sending with project creation!**
- Email sending = search client → get email → send email
- Project creation = ask about existing/new client → collect project details

### General Guidelines
- When user gives a command, acknowledge it immediately: "I'll help you with that" or "Got it"
- If you need more information, ask ONE question at a time
- After completing a task, ask: "Is there anything else I can help with?"
- If you don't understand, ask for clarification: "I want to make sure I understand - are you asking me to [interpretation]?"
- Use tools proactively - don't ask permission, just use them when appropriate

### Tool Usage Priority
1. **search_client** - Use FIRST when client name is mentioned
2. **send_email** - Use when user wants to send email (after getting all info)
3. **check_emails** - Use when user wants to check inbox
4. **read_email** - Use when user wants to read specific email

## Examples

**Example 1: Email with client name**
- User: "Bee email John Smith"
- You: "I'll help you email John Smith. Let me find his contact information."
- [Call search_client("John Smith")]
- If found: "Found John Smith at john@example.com. What should the subject be?"
- [Get subject and message]
- [Call send_email]
- "Email sent to John Smith."

**Example 2: Email without client name**
- User: "Bee send email"
- You: "I'll help you send an email. Who should I send it to?"
- [Get recipient email]
- "What should the subject be?"
- [Get subject]
- "What would you like to say in the email?"
- [Get message]
- [Call send_email]
- "Email sent to [recipient]."

**Example 3: Unclear command**
- User: "Bee email"
- You: "I'd be happy to send an email. Who should I send it to? You can give me a client name or email address."

## Important Notes
- Always use tools when appropriate - don't just talk about what you could do
- Be proactive - if user says "email client", search for the client automatically
- If a tool call fails, explain what went wrong and offer alternatives
- Keep voice responses natural and conversational
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
        name: "search_client",
        description: "Search for a client in the database by name, company name, or email. ALWAYS use this FIRST when the user mentions a client name (e.g., 'email John Smith', 'send email to ABC Company'). Returns client information including email address which you can then use for send_email.",
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query - can be client name, company name, or email address. Extract this from the user's message (e.g., if user says 'email John Smith', use 'John Smith' as the query)",
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 10)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "send_email",
        description: "Send an email to a recipient. Use this AFTER you have: 1) Found the recipient's email (via search_client if client name was mentioned, or directly from user), 2) Asked for and received the subject line, 3) Asked for and received the email body/message. Do NOT call this until you have all three: to, subject, and body.",
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
      {
        name: "check_gmail",
        description: "Check Gmail inbox for new emails. Returns only new emails that haven't been reported yet. Requires Google OAuth authentication with Gmail scope. Use this when user asks to check their Gmail or monitor for new emails.",
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Optional Gmail search query (default: 'is:unread')",
            },
          },
        },
      },
    ];

    // Call Anthropic API with tools
    let response = await client.messages.create({
      model,
      max_tokens: 2048, // Increased for better responses (VAPI uses 1000, but we can be more generous)
      temperature: 0.7, // Same as VAPI for natural responses
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
            if (toolName === "search_client") {
              const clientResponse = await fetch(
                new URL("/api/voice-assistant/client-search", request.url).toString(),
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(toolInput),
                }
              );
              toolResult = await clientResponse.json();
            } else if (toolName === "send_email") {
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
            } else if (toolName === "check_gmail") {
              const gmailResponse = await fetch(
                new URL("/api/voice-assistant/gmail-monitor", request.url).toString(),
                {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json",
                    Cookie: request.headers.get("Cookie") || "",
                  },
                  body: JSON.stringify(toolInput),
                }
              );
              toolResult = await gmailResponse.json();
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

