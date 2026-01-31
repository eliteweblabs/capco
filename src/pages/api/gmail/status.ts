import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { checkAuth } from "../../../lib/auth";

/**
 * Gmail Status Check Endpoint
 *
 * Returns whether Gmail is connected and email address
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase configuration missing");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { currentUser } = await checkAuth(cookies);

    if (!currentUser) {
      return new Response(JSON.stringify({ success: false, error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if Gmail is connected
    const { data: tokenData, error } = await supabase
      .from("gmail_tokens")
      .select("email_address, created_at, updated_at")
      .eq("user_id", currentUser.id)
      .single();

    if (error || !tokenData) {
      return new Response(
        JSON.stringify({
          success: true,
          connected: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get preferences
    const { data: prefs } = await supabase
      .from("email_preferences")
      .select("*")
      .eq("user_id", currentUser.id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        connected: true,
        emailAddress: tokenData.email_address,
        connectedAt: tokenData.created_at,
        lastUpdated: tokenData.updated_at,
        preferences: prefs
          ? {
              enabled: prefs.enabled,
              announceAll: prefs.announce_all,
              vipSenders: prefs.vip_senders || [],
              blockedSenders: prefs.blocked_senders || [],
              urgentKeywords: prefs.urgent_keywords || [],
              quietHoursEnabled: prefs.quiet_hours_enabled,
              quietHoursStart: prefs.quiet_hours_start,
              quietHoursEnd: prefs.quiet_hours_end,
            }
          : null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[GMAIL-STATUS] Error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
