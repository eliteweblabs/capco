import type { APIRoute } from "astro";
import { google } from "googleapis";
import { checkAuth } from "../../../../lib/auth";

/**
 * Gmail OAuth Authorization Endpoint
 *
 * Redirects user to Google for Gmail authorization
 */

export const GET: APIRoute = async ({ cookies, redirect }) => {
  try {
    const { currentUser } = await checkAuth(cookies);

    if (!currentUser) {
      return redirect("/login?redirect=/api/auth/gmail/authorize");
    }

    // Debug: Check environment variables
    const clientId = import.meta.env.GMAIL_CLIENT_ID;
    const clientSecret = import.meta.env.GMAIL_CLIENT_SECRET;
    const publicUrl = import.meta.env.PUBLIC_URL || "http://localhost:4321";

    console.log("[GMAIL-AUTH] Environment check:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasPublicUrl: !!publicUrl,
      clientIdPreview: clientId?.substring(0, 20) + "...",
    });

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${publicUrl}/api/auth/gmail/callback`
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/gmail.compose",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      state: currentUser.id, // Pass user ID for callback
      prompt: "consent", // Force consent screen to get refresh token
    });

    console.log(`[GMAIL-AUTH] Redirecting user ${currentUser.id} to Gmail authorization`);

    return redirect(authUrl);
  } catch (error) {
    console.error("[GMAIL-AUTH] Error generating auth URL:", error);
    return redirect("/voice-assistant-vapi?error=gmail_auth_failed");
  }
};
