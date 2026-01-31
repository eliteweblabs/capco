import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { checkAuth } from "../../../../lib/auth";

/**
 * Gmail Disconnect Endpoint
 *
 * Revokes Gmail access and removes stored tokens
 */

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase configuration missing");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const POST: APIRoute = async ({ cookies }) => {
  try {
    const { currentUser } = await checkAuth(cookies);

    if (!currentUser) {
      return new Response(JSON.stringify({ success: false, error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete tokens from database
    const { error } = await supabase.from("gmail_tokens").delete().eq("user_id", currentUser.id);

    if (error) {
      console.error("[GMAIL-DISCONNECT] Error:", error);
      return new Response(JSON.stringify({ success: false, error: "Failed to disconnect Gmail" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[GMAIL-DISCONNECT] Successfully disconnected Gmail for user ${currentUser.id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Gmail disconnected successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[GMAIL-DISCONNECT] Error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
