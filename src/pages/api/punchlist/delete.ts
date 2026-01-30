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

    // Only Admin/Staff can delete punchlist items
    const canDelete = currentRole === "Admin" || currentRole === "Staff";

    if (!canDelete) {
      return new Response(
        JSON.stringify({
          error: "Permission denied - only Admin/Staff can delete punchlist items",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { itemId } = body;

    // Validate required fields
    if (!itemId) {
      return new Response(JSON.stringify({ error: "Item ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🔔 [DELETE-PUNCHLIST] Deleting punchlist item:", {
      itemId,
      userId: currentUser.id,
      userRole: currentRole,
    });

    // First, get the punchlist item to log details
    const { data: punchlistItem, error: fetchError } = await supabase
      .from("punchlist")
      .select("projectId, message")
      .eq("id", itemId)
      .single();

    if (fetchError) {
      console.error("❌ [DELETE-PUNCHLIST] Error fetching punchlist item:", fetchError);
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

    // Delete the punchlist item
    const { error: deleteError } = await supabase.from("punchlist").delete().eq("id", itemId);

    if (deleteError) {
      console.error("❌ [DELETE-PUNCHLIST] Database delete error:", deleteError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete punchlist item",
          details: deleteError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ [DELETE-PUNCHLIST] Punchlist item deleted successfully");

    // Log activity
    try {
      await SimpleProjectLogger({
        projectId: punchlistItem.projectId,
        userId: currentUser.id,
        action: "punchlist_deleted",
        details: {
          message: punchlistItem.message?.substring(0, 100),
          punchlistId: itemId,
        },
      });
    } catch (logError) {
      console.error("⚠️ [DELETE-PUNCHLIST] Failed to log activity:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Punchlist item deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [DELETE-PUNCHLIST] Unexpected error:", error);
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
