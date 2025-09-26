import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("🔔 [UPDATE-DISCUSSION] API endpoint called");
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    console.log("🔔 [UPDATE-DISCUSSION] Auth check result:", {
      isAuth,
      hasUser: !!currentUser,
    });

    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    console.log("🔔 [UPDATE-DISCUSSION] Request body:", body);
    const { discussionId, mark_completed } = body;

    // Ensure discussionId is a number
    const discussionIdNum = parseInt(discussionId, 10);
    console.log(
      "🔔 [UPDATE-DISCUSSION] Parsed discussionId:",
      discussionIdNum,
      "Original:",
      discussionId
    );

    if (isNaN(discussionIdNum) || mark_completed === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid discussion ID or missing required fields",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // First, check if the discussion exists and get its current state
    console.log(
      "🔍 [UPDATE-DISCUSSION] Looking for discussion with ID:",
      discussionIdNum,
      "Type:",
      typeof discussionIdNum
    );

    if (!supabase || !supabaseAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: existingDiscussion, error: fetchError } = await supabase
      .from("discussion")
      .select("id, mark_completed")
      .eq("id", discussionIdNum)
      .single();

    if (fetchError) {
      console.error("❌ [UPDATE-DISCUSSION] Error fetching existing discussion:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Discussion not found or access denied" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔍 [UPDATE-DISCUSSION] Found existing discussion:", existingDiscussion);

    // Update the discussion using admin client to bypass RLS
    const { data: updateResult, error } = await supabaseAdmin
      .from("discussion")
      .update({ mark_completed: mark_completed })
      .eq("id", discussionIdNum)
      .select("id, mark_completed");

    if (error) {
      console.error("❌ [UPDATE-DISCUSSION] Database error:", error);
      console.error("❌ [UPDATE-DISCUSSION] Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return new Response(
        JSON.stringify({ success: false, error: `Failed to update discussion: ${error.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ [UPDATE-DISCUSSION] Discussion updated successfully:", updateResult);

    // Get discussion details for logging
    const { data: discussionData, error: discussionError } = await supabaseAdmin
      .from("discussion")
      .select("project_id, message")
      .eq("id", discussionIdNum)
      .single();

    // Log the discussion toggle to project activity
    if (discussionData && !discussionError) {
      try {
        console.log("📝 [UPDATE-DISCUSSION] Logging discussion toggle:", {
          projectId: discussionData.project_id,
          discussionId: discussionIdNum,
          isCompleted: mark_completed,
          user: currentUser?.email || "Unknown",
        });

        await SimpleProjectLogger.addLogEntry(
          discussionData.project_id,
          mark_completed ? "discussion_completed" : "discussion_incomplete",
          currentUser,
          `Discussion ${mark_completed ? "marked as completed" : "marked as incomplete"}: ${(discussionData.message?.substring(0, 50) || "No message") + "..."}`,
          { discussionId: discussionIdNum, completed: mark_completed }
        );

        console.log("✅ [UPDATE-DISCUSSION] Project logging completed successfully");
      } catch (logError) {
        console.error("❌ [UPDATE-DISCUSSION] Project logging failed:", logError);
        // Don't fail the entire request if logging fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Discussion status updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [UPDATE-DISCUSSION] Unexpected error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
