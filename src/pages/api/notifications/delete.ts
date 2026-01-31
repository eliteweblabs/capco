import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Notifications DELETE API
 *
 * DELETE Body:
 * - id: number (notification ID to delete)
 *
 * Example:
 * - DELETE /api/notifications/delete { "id": 123 }
 */

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { id, itemId, notificationId } = body;
    const notifId = id || itemId || notificationId;

    if (!notifId) {
      return new Response(JSON.stringify({ error: "Notification ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`🔔 [NOTIFICATIONS-DELETE] Deleting notification:`, notifId);

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if notification exists
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from("notifications")
      .select("id, title, userId")
      .eq("id", notifId)
      .single();

    if (notificationError || !notification) {
      return new Response(JSON.stringify({ error: "Notification not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has permission to delete (owner or admin)
    const userRole = currentUser.profile?.role;
    const isAdmin = userRole === "Admin" || userRole === "Staff";
    const isOwner = notification.userId === currentUser.id;

    if (!isAdmin && !isOwner) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions to delete this notification" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete the notification
    const { error: deleteError } = await supabaseAdmin.from("notifications").delete().eq("id", notifId);

    if (deleteError) {
      console.error("❌ [NOTIFICATIONS-DELETE] Error deleting notification:", deleteError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete notification",
          details: deleteError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [NOTIFICATIONS-DELETE] Notification deleted successfully:`, notifId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification deleted successfully",
        deletedNotification: {
          id: notification.id,
          title: notification.title,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [NOTIFICATIONS-DELETE] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
