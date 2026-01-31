import type { APIRoute } from "astro";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

/**
 * Gmail OAuth Callback Endpoint
 *
 * Receives authorization code from Google and exchanges it for tokens
 */

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SECRET || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase configuration missing");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const GET: APIRoute = async ({ url, redirect }) => {
  try {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // This is the user ID
    const error = url.searchParams.get("error");

    if (error) {
      console.error("[GMAIL-CALLBACK] Authorization error:", error);
      return redirect("/voice-assistant-vapi?error=gmail_access_denied");
    }

    if (!code || !state) {
      console.error("[GMAIL-CALLBACK] Missing code or state");
      return redirect("/voice-assistant-vapi?error=gmail_invalid_request");
    }

    const userId = state;

    const oauth2Client = new google.auth.OAuth2(
      import.meta.env.GMAIL_CLIENT_ID,
      import.meta.env.GMAIL_CLIENT_SECRET,
      `${import.meta.env.PUBLIC_URL || "http://localhost:4321"}/api/auth/gmail/callback`
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error("[GMAIL-CALLBACK] Missing tokens in response");
      return redirect("/voice-assistant-vapi?error=gmail_token_missing");
    }

    // Get user's email address
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const emailAddress = userInfo.data.email;

    // Store tokens in database
    const { error: dbError } = await supabase.from("gmail_tokens").upsert(
      {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(tokens.expiry_date!).toISOString(),
        scope: tokens.scope?.split(" ") || [],
        email_address: emailAddress,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (dbError) {
      console.error("[GMAIL-CALLBACK] Database error:", dbError);
      return redirect("/voice-assistant-vapi?error=gmail_storage_failed");
    }

    // Create default email preferences if they don't exist
    const { error: prefsError } = await supabase.from("email_preferences").upsert(
      {
        user_id: userId,
        enabled: true,
        announce_all: false,
        vip_senders: [],
        blocked_senders: [],
        urgent_keywords: ["urgent", "asap", "important", "critical", "immediate"],
        quiet_hours_enabled: false,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: true,
      }
    );

    if (prefsError) {
      console.warn("[GMAIL-CALLBACK] Error creating preferences:", prefsError);
      // Don't fail the auth flow for this
    }

    console.log(
      `[GMAIL-CALLBACK] Successfully authorized Gmail for user ${userId} (${emailAddress})`
    );

    return redirect("/voice-assistant-vapi?gmail=connected");
  } catch (error: any) {
    console.error("[GMAIL-CALLBACK] Error:", error);
    return redirect("/voice-assistant-vapi?error=gmail_callback_failed");
  }
};
