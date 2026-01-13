import type { APIRoute } from "astro";

/**
 * Gmail Monitor API for Voice Assistant
 * Checks for new emails and returns only unseen ones
 * Uses a simple in-memory store to track seen emails (could be moved to database)
 */

// In-memory store for seen email IDs (per user)
// In production, you might want to store this in a database
const seenEmails: Map<string, Set<string>> = new Map();

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get user identifier from cookies (Google email or Supabase user ID)
    const googleUserData = cookies.get("google_user_info")?.value;
    let userIdentifier = "anonymous";

    if (googleUserData) {
      try {
        const userData = JSON.parse(googleUserData);
        userIdentifier = userData.email || userData.id || "anonymous";
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Initialize seen emails set for this user if not exists
    if (!seenEmails.has(userIdentifier)) {
      seenEmails.set(userIdentifier, new Set());
    }

    const userSeenEmails = seenEmails.get(userIdentifier)!;

    // Call Gmail check API
    const gmailResponse = await fetch(new URL("/api/google/gmail-check", request.url).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookies.toString(),
      },
      body: JSON.stringify({ maxResults: 20, query: "is:unread" }),
    });

    if (!gmailResponse.ok) {
      const errorData = await gmailResponse.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to check Gmail",
          details: errorData.error || errorData.message,
          requiresReauth: errorData.requiresReauth || false,
        }),
        {
          status: gmailResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const gmailData = await gmailResponse.json();
    const allEmails = gmailData.emails || [];

    // Filter out emails we've already seen
    const newEmails = allEmails.filter((email: any) => {
      const isNew = !userSeenEmails.has(email.id);
      if (isNew) {
        // Mark as seen
        userSeenEmails.add(email.id);
      }
      return isNew;
    });

    // Keep only last 1000 seen email IDs to prevent memory issues
    if (userSeenEmails.size > 1000) {
      const emailArray = Array.from(userSeenEmails);
      const toKeep = emailArray.slice(-500); // Keep last 500
      userSeenEmails.clear();
      toKeep.forEach((id) => userSeenEmails.add(id));
    }

    console.log(
      `📧 [GMAIL-MONITOR] User: ${userIdentifier}, New emails: ${newEmails.length}, Total checked: ${allEmails.length}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        newEmails,
        count: newEmails.length,
        totalChecked: allEmails.length,
        user: gmailData.user,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [GMAIL-MONITOR] Error:", error);
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
