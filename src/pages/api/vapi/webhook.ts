import type { APIRoute } from "astro";
import { getApiBaseUrl } from "../../../lib/url-utils";

/**
 * Vapi.ai Webhook Handler
 *
 * Handles incoming calls from Vapi.ai and routes them to Cal.com operations
 */

interface VapiWebhookData {
  call: {
    id: string;
    status: "queued" | "ringing" | "in-progress" | "ended" | "failed";
    startedAt?: string;
    endedAt?: string;
    cost?: number;
    costBreakdown?: any;
    transcript?: {
      messages: Array<{
        role: "user" | "assistant";
        message: string;
        timestamp: number;
      }>;
    };
    summary?: string;
    analysis?: {
      intent: string;
      entities: any;
      sentiment: string;
      topics: string[];
    };
  };
  message?: {
    type:
      | "transcript"
      | "function-call"
      | "tool-calls"
      | "status-update"
      | "speech-update"
      | "conversation-update";
    transcript?: {
      role: "user" | "assistant";
      message: string;
      timestamp: number;
    };
    functionCall?: {
      name: string;
      parameters: any;
    };
    toolCallList?: Array<{
      id: string;
      type: string;
      function?: {
        name: string;
        arguments: string;
      };
      name?: string;
    }>;
    speech?: {
      text: string;
      role: "user" | "assistant";
    };
    conversation?: {
      status: string;
      message: string;
    };
  };
}

export const POST: APIRoute = async ({ request, cookies }): Promise<Response> => {
  try {
    // Extract calendarType and defaultUsername from URL query parameters
    const url = new URL(request.url);
    const calendarType = url.searchParams.get("calendarType") || "calcom";
    const defaultUsername = url.searchParams.get("defaultUsername") || undefined;

    const body: VapiWebhookData = await request.json();
    const messageType = body.message?.type || "unknown";

    // Extract user metadata from VAPI call
    const callMetadata = (body as any).message?.call?.metadata || (body as any).call?.metadata;
    const metadataUserId = callMetadata?.userId;
    const metadataUserEmail = callMetadata?.userEmail;

    console.log(
      `[---VAPI-WEBHOOK] ${messageType}`,
      calendarType ? `(calendarType: ${calendarType})` : "",
      defaultUsername ? `(defaultUsername: ${defaultUsername})` : "",
      metadataUserId ? `(userId: ${metadataUserId})` : ""
    );

    // Only process function calls and call end status
    if (body.message?.type === "function-call") {
      return await handleFunctionCall(
        body.message.functionCall,
        calendarType,
        defaultUsername,
        request,
        callMetadata
      );
    } else if (body.message?.type === "tool-calls") {
      return await handleToolCalls(
        body.message,
        calendarType,
        defaultUsername,
        request,
        callMetadata
      );
    }

    // Acknowledge all other messages without processing
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[---VAPI-WEBHOOK] Error:", error);
    // Always return 200 to keep the call alive
    return new Response(
      JSON.stringify({
        success: false,
        error: "Request processing error",
        message: "Continuing with call...",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Handle tool calls (VAPI Custom Tools format)
async function handleToolCalls(
  message: any,
  calendarType: string = "calcom",
  defaultUsername?: string,
  request?: Request,
  callMetadata?: any
): Promise<Response> {
  try {
    console.log("[---VAPI-WEBHOOK] Processing tool calls...");

    const toolCallList = message.toolCallList || [];
    if (toolCallList.length === 0) {
      console.log("[---VAPI-WEBHOOK] No tool calls in list");
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const toolCall of toolCallList) {
      const functionName = toolCall.function?.name || toolCall.name;
      console.log(`[---VAPI-WEBHOOK] Tool call: ${functionName}`);

      let action = "";
      let params: any = {};

      // Route to appropriate action based on function name
      if (functionName === "getStaffSchedule") {
        action = "get_staff_schedule";
        // Parse arguments if they're a string
        const args =
          typeof toolCall.function?.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || {};
        params = {
          username: args.username || args.calname || defaultUsername, // Support both username and calname, fallback to defaultUsername
        };
        console.log(`[---VAPI-WEBHOOK] Get staff schedule params:`, params);
      } else if (functionName === "bookAppointment") {
        action = "create_booking";
        // Parse arguments if they're a string
        const args =
          typeof toolCall.function?.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || {};
        params = {
          start: args.start,
          name: args.name,
          email: args.email,
          smsReminderNumber: args.phone, // Map phone to smsReminderNumber
          username: args.username || args.calname || defaultUsername, // Support both username and calname, fallback to defaultUsername
        };
        console.log(`[---VAPI-WEBHOOK] Booking params:`, params);
      } else if (functionName === "lookupClient") {
        action = "lookup_client";
        // Parse arguments if they're a string
        const args =
          typeof toolCall.function?.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || {};
        params = {
          nameOrPhone: args.nameOrPhone || args.name || args.phone,
        };
        console.log(`[---VAPI-WEBHOOK] Lookup client params:`, params);
      } else if (functionName === "createProject") {
        // Handle project creation - route directly to projects API
        const args =
          typeof toolCall.function?.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || {};

        console.log(`[---VAPI-WEBHOOK] Creating project with params:`, args);

        // Add user context from call metadata if available
        if (callMetadata?.userId) {
          console.log(
            `[---VAPI-WEBHOOK] Adding authorId from call metadata: ${callMetadata.userId}`
          );
          args.authorId = callMetadata.userId;
        }

        // Get base URL - fallback to environment variable if request not available
        let baseUrl: string;
        try {
          baseUrl = request
            ? getApiBaseUrl(request)
            : process.env.PUBLIC_RAILWAY_STATIC_URL ||
              process.env.RAILWAY_PUBLIC_DOMAIN ||
              "https://capcofire.com";
        } catch (error) {
          console.error(`[---VAPI-WEBHOOK] Error getting base URL:`, error);
          baseUrl =
            process.env.PUBLIC_RAILWAY_STATIC_URL ||
            process.env.RAILWAY_PUBLIC_DOMAIN ||
            "https://capcofire.com";
        }

        const projectResponse = await fetch(`${baseUrl}/api/projects/upsert`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Pass user metadata from VAPI call for authentication
            ...(callMetadata?.userId && { "X-User-Id": callMetadata.userId }),
            ...(callMetadata?.userEmail && { "X-User-Email": callMetadata.userEmail }),
          },
          body: JSON.stringify({
            ...args,
            // Ensure authorId is set from call metadata
          }),
        });

        const projectData = await projectResponse.json();

        if (!projectResponse.ok || !projectData.success) {
          const errorMsg = projectData.error || "Failed to create project";
          console.error(`❌ [VAPI-WEBHOOK] Project creation failed:`, errorMsg);
          results.push({
            toolCallId: toolCall.id,
            result: `I'm sorry, I couldn't create that project. ${errorMsg}`,
          });
        } else {
          console.log(`✅ [VAPI-WEBHOOK] Project created successfully:`, projectData.project?.id);
          results.push({
            toolCallId: toolCall.id,
            result: `Great! I've created the project "${projectData.project?.title || args.title || args.address}" with ID ${projectData.project?.id}. The project is now in the system and ready for review.`,
          });
        }

        // Skip the cal-integration fetch for createProject
        continue;
      } else if (functionName === "rememberConversation") {
        // Handle saving conversation to knowledge base
        const args =
          typeof toolCall.function?.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || {};

        console.log(`[---VAPI-WEBHOOK] Saving conversation to memory:`, args);

        // Get base URL - fallback to environment variable if request not available
        let baseUrl: string;
        try {
          baseUrl = request
            ? getApiBaseUrl(request)
            : process.env.PUBLIC_RAILWAY_STATIC_URL ||
              process.env.RAILWAY_PUBLIC_DOMAIN ||
              "https://capcofire.com";
        } catch (error) {
          console.error(`[---VAPI-WEBHOOK] Error getting base URL:`, error);
          baseUrl =
            process.env.PUBLIC_RAILWAY_STATIC_URL ||
            process.env.RAILWAY_PUBLIC_DOMAIN ||
            "https://capcofire.com";
        }

        const rememberResponse = await fetch(`${baseUrl}/api/voice-assistant/remember`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Pass user metadata for authentication
            ...(callMetadata?.userId && { "X-User-Id": callMetadata.userId }),
            ...(callMetadata?.userEmail && { "X-User-Email": callMetadata.userEmail }),
          },
          body: JSON.stringify({
            title: args.title || "Conversation Memory",
            content: args.content || "",
            category: args.category || "conversation_memory",
            tags: args.tags || [],
            priority: args.priority || 0,
            // Add user context if available
            userId: callMetadata?.userId,
          }),
        });

        const rememberData = await rememberResponse.json();

        if (!rememberResponse.ok || !rememberData.success) {
          const errorMsg = rememberData.error || "Failed to save conversation";
          console.error(`❌ [VAPI-WEBHOOK] Remember failed:`, errorMsg);
          results.push({
            toolCallId: toolCall.id,
            result: `I'm sorry, I couldn't save that to memory. ${errorMsg}`,
          });
        } else {
          console.log(`✅ [VAPI-WEBHOOK] Conversation saved successfully:`, rememberData.id);
          const tagsDisplay =
            args.tags && args.tags.length > 0
              ? ` with tags: ${args.tags.map((t) => `#${t}`).join(", ")}`
              : "";
          results.push({
            toolCallId: toolCall.id,
            result: `I've saved that conversation to my memory${tagsDisplay}. I'll remember this for future conversations.`,
          });
        }

        // Skip the cal-integration fetch for rememberConversation
        continue;
      } else if (functionName === "loadKnowledge") {
        // Handle loading knowledge from Supabase
        const args =
          typeof toolCall.function?.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || {};

        console.log(`[---VAPI-WEBHOOK] Loading knowledge:`, args);

        try {
          const { createClient } = await import("@supabase/supabase-js");

          const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
          const supabaseKey =
            process.env.SUPABASE_SECRET ||
            process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.PUBLIC_SUPABASE_PUBLISHABLE;

          if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase not configured");
          }

          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          });

          // Build query
          let query = supabase
            .from("ai_agent_knowledge")
            .select("title, content, category, tags, priority")
            .eq("isActive", true)
            .is("projectId", null)
            .order("priority", { ascending: false })
            .order("createdAt", { ascending: false })
            .limit(args.limit || 10);

          // Filter by category if provided
          if (args.category) {
            query = query.eq("category", args.category);
          }

          // Search in title/content if query provided
          if (args.query) {
            // Use text search - Supabase supports ilike for case-insensitive search
            query = query.or(`title.ilike.%${args.query}%,content.ilike.%${args.query}%`);
          }

          const { data: knowledgeEntries, error } = await query;

          if (error) {
            console.error(`❌ [VAPI-WEBHOOK] Knowledge load error:`, error);
            results.push({
              toolCallId: toolCall.id,
              result: `I'm having trouble accessing my memory right now. ${error.message}`,
            });
          } else {
            console.log(
              `✅ [VAPI-WEBHOOK] Loaded ${knowledgeEntries?.length || 0} knowledge entries`
            );

            if (!knowledgeEntries || knowledgeEntries.length === 0) {
              results.push({
                toolCallId: toolCall.id,
                result: `I don't have any saved information about "${args.query || "that topic"}" in my memory.`,
              });
            } else {
              // Format knowledge for the assistant
              const knowledgeText = knowledgeEntries
                .map(
                  (entry, index) =>
                    `${index + 1}. [${entry.category || "general"}] ${entry.title}: ${entry.content}`
                )
                .join("\n");

              results.push({
                toolCallId: toolCall.id,
                result: `Here's what I found in my memory:\n\n${knowledgeText}`,
              });
            }
          }
        } catch (error: any) {
          console.error(`❌ [VAPI-WEBHOOK] Knowledge load exception:`, error);
          results.push({
            toolCallId: toolCall.id,
            result: `I'm having trouble accessing my memory right now. ${error.message || "Please try again."}`,
          });
        }

        // Skip the cal-integration fetch for loadKnowledge
        continue;
      } else if (functionName === "getUnreadEmails") {
        // Handle getting unread emails from Gmail
        const args =
          typeof toolCall.function?.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || {};

        console.log(`[---VAPI-WEBHOOK] Getting unread emails for user`);

        const userId = callMetadata?.userId;
        if (!userId) {
          results.push({
            toolCallId: toolCall.id,
            result: "I need you to be logged in to check your email.",
          });
          continue;
        }

        try {
          const { getUnreadEmails, extractName } = await import("../../../lib/gmail");
          const emails = await getUnreadEmails(userId, args.limit || 10);

          if (emails.length === 0) {
            results.push({
              toolCallId: toolCall.id,
              result: "You have no unread emails. Your inbox is clear!",
            });
          } else {
            const emailList = emails
              .slice(0, 5)
              .map((e, i) => `${i + 1}. From ${extractName(e.from)} about "${e.subject}"`)
              .join(". ");

            const moreText = emails.length > 5 ? ` and ${emails.length - 5} more` : "";

            results.push({
              toolCallId: toolCall.id,
              result: `You have ${emails.length} unread email${emails.length > 1 ? "s" : ""}. ${emailList}${moreText}. Which would you like me to read?`,
            });
          }
        } catch (error: any) {
          console.error(`❌ [VAPI-WEBHOOK] Error getting emails:`, error);
          const isNotConnected = error.message.includes("Gmail not connected");
          results.push({
            toolCallId: toolCall.id,
            result: isNotConnected
              ? "You need to connect your Gmail account first. Please visit the voice assistant page and click 'Connect Gmail'."
              : "I'm having trouble accessing your email right now. Please try again in a moment.",
          });
        }

        continue;
      } else if (functionName === "readEmail") {
        // Handle reading a specific email
        const args =
          typeof toolCall.function?.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || {};

        console.log(`[---VAPI-WEBHOOK] Reading email ${args.emailId}`);

        const userId = callMetadata?.userId;
        if (!userId) {
          results.push({
            toolCallId: toolCall.id,
            result: "I need you to be logged in to read emails.",
          });
          continue;
        }

        try {
          const { readEmail, markAsRead, extractName, formatDateForVoice } = await import(
            "../../../lib/gmail"
          );
          const email = await readEmail(userId, args.emailId);

          // Mark as read after fetching
          await markAsRead(userId, args.emailId);

          const fromName = extractName(email.from);
          const dateFormatted = formatDateForVoice(email.date);

          // Truncate very long emails
          let body = email.body || email.snippet;
          if (body.length > 1000) {
            body =
              body.substring(0, 1000) + "... The email continues but I've read the first part.";
          }

          const result = `Email from ${fromName}. Subject: ${email.subject}. Received ${dateFormatted}. The email says: ${body}`;

          results.push({
            toolCallId: toolCall.id,
            result: result,
          });
        } catch (error: any) {
          console.error(`❌ [VAPI-WEBHOOK] Error reading email:`, error);
          results.push({
            toolCallId: toolCall.id,
            result:
              "I couldn't read that email. It may have been deleted or archived, or there may be a connection issue.",
          });
        }

        continue;
      } else if (functionName === "sendEmail") {
        // Handle sending a new email
        const args =
          typeof toolCall.function?.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || {};

        console.log(`[---VAPI-WEBHOOK] Sending email to ${args.to}`);

        const userId = callMetadata?.userId;
        if (!userId) {
          results.push({
            toolCallId: toolCall.id,
            result: "I need you to be logged in to send emails.",
          });
          continue;
        }

        try {
          const { sendEmail } = await import("../../../lib/gmail");
          await sendEmail(userId, args.to, args.subject, args.body);

          results.push({
            toolCallId: toolCall.id,
            result: `Email sent successfully to ${args.to}.`,
          });
        } catch (error: any) {
          console.error(`❌ [VAPI-WEBHOOK] Error sending email:`, error);
          results.push({
            toolCallId: toolCall.id,
            result: "I couldn't send that email. Please check the recipient address and try again.",
          });
        }

        continue;
      } else if (functionName === "replyToEmail") {
        // Handle replying to an email
        const args =
          typeof toolCall.function?.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || {};

        console.log(`[---VAPI-WEBHOOK] Replying to email ${args.emailId}`);

        const userId = callMetadata?.userId;
        if (!userId) {
          results.push({
            toolCallId: toolCall.id,
            result: "I need you to be logged in to reply to emails.",
          });
          continue;
        }

        try {
          const { replyToEmail } = await import("../../../lib/gmail");
          await replyToEmail(userId, args.emailId, args.body);

          results.push({
            toolCallId: toolCall.id,
            result: "Reply sent successfully.",
          });
        } catch (error: any) {
          console.error(`❌ [VAPI-WEBHOOK] Error replying to email:`, error);
          results.push({
            toolCallId: toolCall.id,
            result:
              "I couldn't send that reply. The email may have been deleted or there may be a connection issue.",
          });
        }

        continue;
      } else if (functionName === "archiveEmail") {
        // Handle archiving an email
        const args =
          typeof toolCall.function?.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || {};

        console.log(`[---VAPI-WEBHOOK] Archiving email ${args.emailId}`);

        const userId = callMetadata?.userId;
        if (!userId) {
          results.push({
            toolCallId: toolCall.id,
            result: "I need you to be logged in to archive emails.",
          });
          continue;
        }

        try {
          const { archiveEmail } = await import("../../../lib/gmail");
          await archiveEmail(userId, args.emailId);

          results.push({
            toolCallId: toolCall.id,
            result: "Email archived successfully.",
          });
        } catch (error: any) {
          console.error(`❌ [VAPI-WEBHOOK] Error archiving email:`, error);
          results.push({
            toolCallId: toolCall.id,
            result: "I couldn't archive that email.",
          });
        }

        continue;
      } else if (functionName === "processFile") {
        // Handle file processing (PDF/image uploads)
        const args =
          typeof toolCall.function?.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || {};

        console.log(`[---VAPI-WEBHOOK] Processing file:`, args);

        try {
          // Get base URL - fallback to environment variable if request not available
          let baseUrl: string;
          try {
            baseUrl = request
              ? getApiBaseUrl(request)
              : process.env.PUBLIC_RAILWAY_STATIC_URL ||
                process.env.RAILWAY_PUBLIC_DOMAIN ||
                "https://capcofire.com";
          } catch (error) {
            console.error(`[---VAPI-WEBHOOK] Error getting base URL:`, error);
            baseUrl =
              process.env.PUBLIC_RAILWAY_STATIC_URL ||
              process.env.RAILWAY_PUBLIC_DOMAIN ||
              "https://capcofire.com";
          }

          // Download the file from the provided URL
          let fileBuffer: ArrayBuffer | null = null;
          if (args.fileUrl) {
            console.log(`[---VAPI-WEBHOOK] Downloading file from: ${args.fileUrl}`);
            const fileResponse = await fetch(args.fileUrl);
            if (fileResponse.ok) {
              fileBuffer = await fileResponse.arrayBuffer();
            } else {
              throw new Error(`Failed to download file: ${fileResponse.statusText}`);
            }
          } else {
            throw new Error("No file URL provided");
          }

          // Convert to File object for the API
          const fileBlob = new Blob([fileBuffer!], {
            type: args.fileType || "application/octet-stream",
          });
          const file = new File([fileBlob], args.fileName || "uploaded-file", {
            type: args.fileType,
          });

          // Create FormData and send to processing API
          const formData = new FormData();
          formData.append("file", file);
          if (args.saveToKnowledge) {
            formData.append("saveToKnowledge", "true");
          }

          const processResponse = await fetch(`${baseUrl}/api/voice-assistant/process-file`, {
            method: "POST",
            body: formData,
          });

          const processData = await processResponse.json();

          if (!processResponse.ok || !processData.success) {
            const errorMsg = processData.error || "Failed to process file";
            console.error(`❌ [VAPI-WEBHOOK] File processing failed:`, errorMsg);
            results.push({
              toolCallId: toolCall.id,
              result: `I'm sorry, I couldn't process that file. ${errorMsg}`,
            });
          } else {
            console.log(
              `✅ [VAPI-WEBHOOK] File processed successfully:`,
              processData.data?.fileName
            );
            const contentPreview =
              processData.data?.content?.substring(0, 500) || "No content extracted";
            const fieldsInfo =
              processData.data?.fields?.length > 0
                ? ` I found ${processData.data.fields.length} field(s): ${processData.data.fields.map((f: any) => f.name).join(", ")}.`
                : "";
            const savedInfo = processData.data?.knowledgeEntryId
              ? " I've also saved this to my knowledge base for future reference."
              : "";

            results.push({
              toolCallId: toolCall.id,
              result: `I've processed the file "${processData.data?.fileName || args.fileName}". Here's what I found:\n\n${contentPreview}${fieldsInfo}${savedInfo}`,
            });
          }
        } catch (error: any) {
          console.error(`❌ [VAPI-WEBHOOK] File processing exception:`, error);
          results.push({
            toolCallId: toolCall.id,
            result: `I'm sorry, I couldn't process that file. ${error.message || "Please try again."}`,
          });
        }

        // Skip the cal-integration fetch for processFile
        continue;
      }

      // Get base URL - fallback to environment variable if request not available
      let baseUrl: string;
      try {
        baseUrl = request
          ? getApiBaseUrl(request)
          : process.env.PUBLIC_RAILWAY_STATIC_URL ||
            process.env.RAILWAY_PUBLIC_DOMAIN ||
            "https://capcofire.com";
      } catch (error) {
        console.error(`[---VAPI-WEBHOOK] Error getting base URL:`, error);
        baseUrl =
          process.env.PUBLIC_RAILWAY_STATIC_URL ||
          process.env.RAILWAY_PUBLIC_DOMAIN ||
          "https://capcofire.com";
      }

      const response = await fetch(`${baseUrl}/api/vapi/cal-integration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Vapi-System": "true",
        },
        body: JSON.stringify({
          action,
          calendarType,
          ...params,
        }),
      });

      const data = await response.json();
      console.log(`[---VAPI-WEBHOOK] Result:`, data.result?.substring(0, 50) + "...");

      // Log any errors for debugging
      if (data.error) {
        console.error(`❌ [VAPI-WEBHOOK] Error from cal-integration:`, data.error);
      }

      // Log booking creation success/failure
      if (functionName === "bookAppointment") {
        if (data.data?.booking) {
          console.log(`✅ [VAPI-WEBHOOK] Booking created successfully:`, data.data.booking);
        } else {
          console.warn(
            `⚠️ [VAPI-WEBHOOK] Booking creation may have failed - no booking data in response`
          );
        }
      }

      // Log client lookup results
      if (functionName === "lookupClient") {
        if (data.data?.found) {
          console.log(
            `✅ [VAPI-WEBHOOK] Client found:`,
            data.data.name,
            `Preferred barber:`,
            data.data.preferredBarber
          );
        } else {
          console.log(`ℹ️ [VAPI-WEBHOOK] Client not found, proceeding as new client`);
        }
      }

      // Email is now sent directly by cal-integration.ts to avoid duplicate sends and date formatting issues
      // Removed duplicate email sending from webhook - cal-integration handles it with correct UTC formatting

      results.push({
        toolCallId: toolCall.id,
        result: data.result,
      });
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[---VAPI-WEBHOOK] Tool error:", error);
    console.error("[---VAPI-WEBHOOK] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return new Response(
      JSON.stringify({
        results: [
          {
            toolCallId: "error",
            result: `I'm having trouble accessing that information right now. ${error.message || ""}`,
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handle function calls from Vapi.ai (legacy format)
async function handleFunctionCall(
  functionCall: any,
  calendarType: string = "calcom",
  defaultUsername?: string,
  request?: Request,
  callMetadata?: any
): Promise<Response> {
  if (!functionCall) {
    return new Response(JSON.stringify({ success: false, error: "No function call provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only log function name for clarity
  console.log("🤖 [VAPI-WEBHOOK] Function call:", functionCall.name);

  // Validate date format (ISO with timezone)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

  try {
    // Handle call termination
    if (functionCall.name === "end_call") {
      console.log("🤖 [VAPI-WEBHOOK] Call termination requested:", functionCall.parameters.reason);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Call terminated successfully",
          reason: functionCall.parameters.reason,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Route Cal.com function calls to the integration API
    const calcomFunctions = [
      "getStaffSchedule",
      "checkAvailability",
      "bookAppointment",
      "lookupClient",
    ];
    if (calcomFunctions.includes(functionCall.name)) {
      console.log("🤖 [VAPI-WEBHOOK] Routing to Cal.com integration:", functionCall.name);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        // Map VAPI function calls to Cal.com integration actions
        let action = "";
        let params = {};

        switch (functionCall.name) {
          case "getStaffSchedule":
            action = "get_staff_schedule";
            params = {
              username:
                functionCall.parameters.username ||
                functionCall.parameters.calname ||
                defaultUsername, // Support both username and calname, fallback to defaultUsername
            };
            break;
          case "checkAvailability":
            // Validate required parameters
            if (!functionCall.parameters.dateFrom || !functionCall.parameters.dateTo) {
              console.error(
                "❌ [VAPI-WEBHOOK] Missing required parameters for checkAvailability:",
                functionCall.parameters
              );
              throw new Error(
                `Missing required parameters: ${[
                  !functionCall.parameters.dateFrom && "dateFrom",
                  !functionCall.parameters.dateTo && "dateTo",
                ]
                  .filter(Boolean)
                  .join(", ")}`
              );
            }
            // Validate date format (ISO with timezone)
            if (
              !isoDateRegex.test(functionCall.parameters.dateFrom) ||
              !isoDateRegex.test(functionCall.parameters.dateTo)
            ) {
              console.error("❌ [VAPI-WEBHOOK] Invalid date format:", functionCall.parameters);
              throw new Error(
                "Dates must be in ISO format with timezone (e.g., 2024-10-24T00:00:00.000Z)"
              );
            }
            action = "get_availability";
            params = {
              dateFrom: functionCall.parameters.dateFrom,
              dateTo: functionCall.parameters.dateTo,
            };
            break;
          case "bookAppointment":
            // Validate required parameters
            if (
              !functionCall.parameters.start ||
              !functionCall.parameters.name ||
              !functionCall.parameters.email
            ) {
              console.error(
                "❌ [VAPI-WEBHOOK] Missing required parameters for bookAppointment:",
                functionCall.parameters
              );
              throw new Error(
                `Missing required parameters: ${[
                  !functionCall.parameters.start && "start",
                  !functionCall.parameters.name && "name",
                  !functionCall.parameters.email && "email",
                ]
                  .filter(Boolean)
                  .join(", ")}`
              );
            }
            // Accept various date formats - cal-integration.ts will handle parsing
            // Don't validate format here, let cal-integration handle it
            console.log("📅 [VAPI-WEBHOOK] Received start time:", functionCall.parameters.start);
            // Validate phone number format if provided
            if (functionCall.parameters.smsReminderNumber) {
              const phoneRegex = /^\+\d{10,15}$/;
              if (!phoneRegex.test(functionCall.parameters.smsReminderNumber)) {
                console.error(
                  "❌ [VAPI-WEBHOOK] Invalid phone number format:",
                  functionCall.parameters
                );
                throw new Error("Phone number must be in E.164 format (e.g., +12345678900)");
              }
            }
            action = "create_booking";
            params = {
              start: functionCall.parameters.start,
              name: functionCall.parameters.name,
              email: functionCall.parameters.email,
              smsReminderNumber: functionCall.parameters.smsReminderNumber,
              username:
                functionCall.parameters.username ||
                functionCall.parameters.calname ||
                defaultUsername, // Support both username and calname, fallback to defaultUsername
            };
            break;
          case "lookupClient":
            // Validate required parameters
            if (
              !functionCall.parameters.nameOrPhone &&
              !functionCall.parameters.name &&
              !functionCall.parameters.phone
            ) {
              console.error(
                "❌ [VAPI-WEBHOOK] Missing required parameters for lookupClient:",
                functionCall.parameters
              );
              throw new Error("Missing required parameter: nameOrPhone, name, or phone");
            }
            action = "lookup_client";
            params = {
              nameOrPhone:
                functionCall.parameters.nameOrPhone ||
                functionCall.parameters.name ||
                functionCall.parameters.phone,
            };
            break;
        }

        // Get base URL - fallback to environment variable if request not available
        let baseUrl: string;
        try {
          baseUrl = request
            ? getApiBaseUrl(request)
            : process.env.PUBLIC_RAILWAY_STATIC_URL ||
              process.env.RAILWAY_PUBLIC_DOMAIN ||
              "https://capcofire.com";
        } catch (error) {
          console.error(`[---VAPI-WEBHOOK] Error getting base URL:`, error);
          baseUrl =
            process.env.PUBLIC_RAILWAY_STATIC_URL ||
            process.env.RAILWAY_PUBLIC_DOMAIN ||
            "https://capcofire.com";
        }

        const response = await fetch(`${baseUrl}/api/vapi/cal-integration`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Vapi-System": "true",
          },
          body: JSON.stringify({
            action,
            calendarType,
            ...params,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ [VAPI-WEBHOOK] Cal.com integration error:", errorText);
          throw new Error(`Cal.com integration failed: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ [VAPI-WEBHOOK] Cal.com integration success:", result);

        // Return the result - VAPI will read the 'result' field out loud
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    }

    // Handle other function calls
    console.log(
      "🤖 [VAPI-WEBHOOK] Function call received:",
      functionCall.name,
      functionCall.parameters
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Function call processed",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [VAPI-WEBHOOK] Function call error:", error);

    // Handle timeout specifically
    if (error instanceof Error && error.name === "AbortError") {
      console.log("⏰ [VAPI-WEBHOOK] Function call timed out");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Function call timed out",
          message:
            "I'm having trouble accessing our scheduling system right now. Let me help you with general availability instead.",
        }),
        {
          status: 200, // Return 200 to keep the call alive
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Function call failed",
        message:
          "I'm having trouble accessing our scheduling system right now. Let me help you with general availability instead.",
      }),
      {
        status: 200, // Return 200 to keep the call alive
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
