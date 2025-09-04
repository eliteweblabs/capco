import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("🔔 [UPDATE-DISCUSSION] API endpoint called");
  try {
    // Check authentication
    const { isAuth, user, role } = await checkAuth(cookies);
    console.log("🔔 [UPDATE-DISCUSSION] Auth check result:", { isAuth, hasUser: !!user, role });

    if (!isAuth || !user) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only Admin and Staff can update discussion status
    if (role !== "Admin" && role !== "Staff") {
      return new Response(JSON.stringify({ success: false, error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    console.log("🔔 [UPDATE-DISCUSSION] Request body:", body);
    const { discussionId, mark_completed } = body;
    
    // Ensure discussionId is a number
    const discussionIdNum = parseInt(discussionId, 10);
    console.log("🔔 [UPDATE-DISCUSSION] Parsed discussionId:", discussionIdNum, "Original:", discussionId);

    if (isNaN(discussionIdNum) || mark_completed === undefined) {
      return new Response(JSON.stringify({ success: false, error: "Invalid discussion ID or missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🔔 [UPDATE-DISCUSSION] Updating discussion:", {
      discussionId: discussionIdNum,
      mark_completed,
      userRole: role,
      userId: user.id,
    });

    // First, check if the discussion exists and get its current state
    console.log("🔍 [UPDATE-DISCUSSION] Looking for discussion with ID:", discussionIdNum, "Type:", typeof discussionIdNum);
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

    // Update the discussion
    const { data: updateResult, error } = await supabase
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
