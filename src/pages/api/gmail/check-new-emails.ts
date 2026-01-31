import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { getNewEmailsSince, isImportantEmail } from "../../../lib/gmail";

/**
 * Check New Emails Endpoint
 *
 * Called periodically during active VAPI sessions to check for new emails
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase configuration missing");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId, lastCheckTimestamp } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: "User ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if Gmail is connected
    const { data: tokenData, error: tokenError } = await supabase
      .from("gmail_tokens")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({
          success: true,
          newEmails: [],
          gmailConnected: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get new emails since last check
    const timestamp = lastCheckTimestamp || Date.now() - 300000; // Default: last 5 minutes
    const newEmails = await getNewEmailsSince(userId, timestamp);

    console.log(`[EMAIL-CHECK] Found ${newEmails.length} new emails for user ${userId}`);

    // Filter for important emails only
    const importantEmails = [];
    for (const email of newEmails) {
      const important = await isImportantEmail(userId, email);
      if (important) {
        importantEmails.push({
          id: email.id,
          from: email.from,
          subject: email.subject,
          snippet: email.snippet,
          date: email.date,
        });
      }
    }

    console.log(`[EMAIL-CHECK] ${importantEmails.length} important emails for user ${userId}`);

    // Log check history
    await supabase.from("email_check_history").insert({
      user_id: userId,
      last_check_at: new Date().toISOString(),
      emails_found: newEmails.length,
      important_emails_found: importantEmails.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        newEmails: importantEmails,
        gmailConnected: true,
        totalFound: newEmails.length,
        importantFound: importantEmails.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[EMAIL-CHECK] Error:", error);

    // Return success with empty array to not break VAPI session
    return new Response(
      JSON.stringify({
        success: true,
        newEmails: [],
        error: error.message,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
};
