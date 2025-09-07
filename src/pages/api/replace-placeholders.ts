import type { APIRoute } from "astro";

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

    // Replace placeholders in toast messages
    const replacePlaceholders = (message: string, data: any) => {
      if (!message) return null;
      return message
        .replace(/\{\{PROJECT_ADDRESS\}\}/g, data.projectAddress || "")
        .replace(/\{\{CLIENT_NAME\}\}/g, data.clientName || "")
        .replace(/\{\{CLIENT_EMAIL\}\}/g, data.clientEmail || "")
        .replace(/\{\{STATUS_NAME\}\}/g, data.statusName || "")
        .replace(/\{\{EST_TIME\}\}/g, data.estTime || "");
    };

    const processedMessages = {
      toast_admin: replacePlaceholders(mergedData.statusConfig.toast_admin, placeholderData),
      toast_client: replacePlaceholders(mergedData.statusConfig.toast_client, placeholderData),
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
