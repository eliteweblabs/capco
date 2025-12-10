import type { APIRoute } from "astro";
import { checkGoogleAuth } from "../../../lib/google-auth";

/**
 * Gmail Check API
 * Checks for new emails in the authenticated user's Gmail inbox
 */

async function getValidAccessToken(cookies: any): Promise<string | null> {
  // First try to get access token from cookies
  let accessToken = cookies.get("google_access_token")?.value;

  if (!accessToken) {
    return null;
  }

  // Verify token is still valid by making a test request
  try {
    const testResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
    );

    if (testResponse.ok) {
      return accessToken;
    }

    // Token expired, try to refresh
    console.log("🔄 [GMAIL-CHECK] Access token expired, refreshing...");
    const refreshResponse = await fetch(new URL("/api/google/refresh-token", request.url).toString(), {
      method: "POST",
      headers: {
        Cookie: request.headers.get("Cookie") || "",
      },
    });

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      return refreshData.access_token;
    }
  } catch (error) {
    console.error("❌ [GMAIL-CHECK] Error validating token:", error);
  }

  return null;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check if user is authenticated with Google
    const googleAuth = checkGoogleAuth(cookies);
    
    if (!googleAuth.isAuthenticated) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Not authenticated with Google",
          message: "Please sign in with Google first to access Gmail",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get valid access token (refresh if needed)
    const accessToken = await getValidAccessToken(cookies);

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No valid Google access token",
          message: "Please re-authenticate with Google",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { maxResults = 10, query = "is:unread" } = await request.json().catch(() => ({}));

    console.log("📧 [GMAIL-CHECK] Checking Gmail for:", {
      user: googleAuth.user?.email,
      query,
      maxResults,
    });

    // Get list of messages
    const messagesUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    messagesUrl.searchParams.set("maxResults", String(maxResults));
    messagesUrl.searchParams.set("q", query);

    const messagesResponse = await fetch(messagesUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!messagesResponse.ok) {
      const errorData = await messagesResponse.json().catch(() => ({}));
      console.error("❌ [GMAIL-CHECK] Gmail API error:", errorData);

      if (messagesResponse.status === 401) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Gmail API authentication failed",
            message: "Token may have expired. Please re-authenticate with Google.",
            requiresReauth: true,
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch emails",
          details: errorData.error?.message || messagesResponse.statusText,
        }),
        { status: messagesResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const messagesData = await messagesResponse.json();
    const messageIds = messagesData.messages || [];

    if (messageIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          emails: [],
          count: 0,
          message: "No new emails found",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get full message details
    const emailPromises = messageIds.slice(0, maxResults).map(async (msg: { id: string }) => {
      try {
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!messageResponse.ok) {
          return null;
        }

        const messageData = await messageResponse.json();
        
        // Extract headers
        const headers = messageData.payload?.headers || [];
        const from = headers.find((h: any) => h.name === "From")?.value || "Unknown";
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "(No Subject)";
        const date = headers.find((h: any) => h.name === "Date")?.value || "";

        return {
          id: messageData.id,
          threadId: messageData.threadId,
          from,
          subject,
          date,
          snippet: messageData.snippet || "",
          isUnread: messageData.labelIds?.includes("UNREAD") || false,
        };
      } catch (error) {
        console.error(`❌ [GMAIL-CHECK] Error fetching message ${msg.id}:`, error);
        return null;
      }
    });

    const emails = (await Promise.all(emailPromises)).filter((email) => email !== null);

    console.log(`✅ [GMAIL-CHECK] Found ${emails.length} emails`);

    return new Response(
      JSON.stringify({
        success: true,
        emails,
        count: emails.length,
        user: googleAuth.user?.email,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [GMAIL-CHECK] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

