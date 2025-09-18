import type { APIRoute } from "astro";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
console.log("🚧 [DEAD-STOP-2024-12-19] replace-placeholders.ts accessed - may be unused");

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

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { mergedData, placeholderData } = body;

    if (!mergedData || !placeholderData) {
      return new Response(
        JSON.stringify({ error: "Merged data and placeholder data are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔄 [REPLACE-PLACEHOLDERS] Received data:", { mergedData, placeholderData });

    // Replace placeholders in modal messages
    const replacePlaceholders = (message: string, data: any) => {
      if (!message) return null;

      let processedMessage = message;

      // Handle PROJECT_LINK with optional query parameters - extract to button on new line
      const baseProjectLink = `${new URL(request.url).origin}/project/${data.projectId}`;
      processedMessage = processedMessage.replace(
        /{{PROJECT_LINK(\?[^}]*)?}}/g,
        (match, queryParams) => {
          const fullUrl = baseProjectLink + (queryParams || "");

          // Extract tab parameter for display text
          let displayText = "View Project";
          if (queryParams) {
            const tabMatch = queryParams.match(/[?&]tab=([^&]*)/);
            if (tabMatch && tabMatch[1]) {
              const tabName = tabMatch[1]
                .replace(/([a-z])([A-Z])/g, "$1 $2")
                .replace(/[-_]/g, " ")
                .split(" ")
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ");
              displayText = `Go to ${tabName}`;
            }
          }

          // Return button on new line
          return `<br><br><a href="${fullUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background-color 0.2s;">${displayText}</a>`;
        }
      );

      // Replace other placeholders
      processedMessage = processedMessage
        .replace(/\{\{PROJECT_ADDRESS\}\}/g, "<b>" + (data.projectAddress || "") + "</b>")
        .replace(/\{\{ADDRESS\}\}/g, "<b>" + (data.projectAddress || "") + "</b>")
        .replace(/\{\{CLIENT_NAME\}\}/g, "<b>" + (data.clientName || "") + "</b>")
        .replace(/\{\{CLIENT_EMAIL\}\}/g, "<b>" + (data.clientEmail || "") + "</b>")
        .replace(/\{\{STATUS_NAME\}\}/g, "<b>" + (data.statusName || "") + "</b>")
        .replace(/\{\{EST_TIME\}\}/g, "<b>" + (data.estTime || "") + "</b>")
        .replace(/\{\{CONTRACT_URL\}\}/g, data.contractUrl || "")
        .replace(
          /\{\{PRIMARY_COLOR\}\}/g,
          (() => {
            // Handle PRIMARY_COLOR without bold tags (for CSS usage)
            let hexColor = data.primaryColor || "#3b82f6"; // Default blue if not provided
            if (!hexColor.startsWith("#")) {
              hexColor = "#" + hexColor;
            }
            return hexColor;
          })()
        )
        // Replace any remaining {{PLACEHOLDER}} with empty string
        .replace(/\{\{[^}]+\}\}/g, "");

      return processedMessage;
    };

    const processedMessages = {
      modal_admin: replacePlaceholders(mergedData.statusConfig.modal_admin, placeholderData),
      modal_client: replacePlaceholders(mergedData.statusConfig.modal_client, placeholderData),
      admin_email_subject: replacePlaceholders(
        mergedData.statusConfig.admin_email_subject,
        placeholderData
      ),
      admin_email_content: replacePlaceholders(
        mergedData.statusConfig.admin_email_content,
        placeholderData
      ),
      client_email_subject: replacePlaceholders(
        mergedData.statusConfig.client_email_subject,
        placeholderData
      ),
      client_email_content: replacePlaceholders(
        mergedData.statusConfig.client_email_content,
        placeholderData
      ),
      project_action: replacePlaceholders(mergedData.statusConfig.project_action, placeholderData),
    };

    console.log("🔄 [REPLACE-PLACEHOLDERS] Processed messages:", processedMessages);

    return new Response(
      JSON.stringify({
        success: true,
        mergedData,
        placeholderData,
        processedMessages,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error) {
    console.error("🔄 [REPLACE-PLACEHOLDERS] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
