import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser } = await checkAuth(cookies);
    const currentRole = currentUser?.profile?.role;
    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { punchlistId, projectId, title, message, markCompleted, internal } = body;

    // Check if this is an update or create operation
    const isUpdate = !!punchlistId;

    if (isUpdate) {
      // UPDATE OPERATION
      // Validate required fields for update
      if (markCompleted === undefined) {
        return new Response(JSON.stringify({ error: "Completion status is required for update" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log("🔔 [UPDATE-PUNCHLIST] Updating punchlist completion status:", {
        punchlistId,
        markCompleted,
        userId: currentUser.id,
        userRole: currentRole,
      });

      // First, check if user has permission to update this punchlist item
      const { data: punchlistItem, error: fetchError } = await supabase
        .from("punchlist")
        .select("authorId, projectId, message")
        .eq("id", punchlistId)
        .single();

      if (fetchError) {
        console.error("❌ [UPDATE-PUNCHLIST] Error fetching punchlist item:", fetchError);
        return new Response(
          JSON.stringify({
            error: "Punchlist item not found",
            details: fetchError.message,
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Check permissions - Admin/Staff can update any
      const canUpdate = currentRole === "Admin" || currentRole === "Staff";

      if (!canUpdate) {
        return new Response(
          JSON.stringify({
            error: "Permission denied - only Admin/Staff can update punchlist items",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Update the punchlist item completion status
      const { data: updatedPunchlist, error: updateError } = await supabase
        .from("punchlist")
        .update({
          markCompleted,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", punchlistId)
        .select("*")
        .single();

      if (updateError) {
        console.error("❌ [UPDATE-PUNCHLIST] Database update error:", updateError);
        return new Response(
          JSON.stringify({
            error: "Failed to update punchlist completion status",
            details: updateError.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.log("✅ [UPDATE-PUNCHLIST] Punchlist completion status updated successfully");

      return new Response(
        JSON.stringify({
          success: true,
          punchlist: updatedPunchlist,
          message: `Punchlist item marked as ${markCompleted ? "completed" : "incomplete"}`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      // CREATE OPERATION
      // Validate required fields for create
      if (!projectId || !message) {
        return new Response(JSON.stringify({ error: "Project ID and message are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Only Admin/Staff can create punchlist items
      const canCreate = currentRole === "Admin" || currentRole === "Staff";

      if (!canCreate) {
        return new Response(
          JSON.stringify({
            error: "Permission denied - only Admin/Staff can create punchlist items",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.log("🔔 [CREATE-PUNCHLIST] Creating new punchlist item:", {
        projectId,
        message,
        userId: currentUser.id,
        userRole: currentRole,
      });

      // Create new punchlist item
      const { data: newPunchlist, error: createError } = await supabase
        .from("punchlist")
        .insert({
          projectId: parseInt(projectId),
          authorId: currentUser.id,
          message,
          markCompleted: markCompleted || false,
          internal: internal || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (createError) {
        console.error("❌ [CREATE-PUNCHLIST] Database insert error:", createError);
        return new Response(
          JSON.stringify({
            error: "Failed to create punchlist item",
            details: createError.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.log("✅ [CREATE-PUNCHLIST] Punchlist item created successfully");

      // Log activity
      try {
        await SimpleProjectLogger.addLogEntry(
          parseInt(projectId),
          "info",
          "Punchlist item created",
          {
            userId: currentUser.id,
            punchlistId: newPunchlist.id,
            message: message.substring(0, 100),
          }
        );
      } catch (logError) {
        console.error("⚠️ [CREATE-PUNCHLIST] Failed to log activity:", logError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          punchlist: newPunchlist,
          message: "Punchlist item created successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("❌ [UPDATE-PUNCHLIST-COMPLETED] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
