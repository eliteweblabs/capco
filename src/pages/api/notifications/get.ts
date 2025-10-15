import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

// GET - Fetch user notifications
export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const unreadOnly = url.searchParams.get("unread_only") === "true";

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Add timeout handling for Supabase connection issues
    const queryPromise = supabase
      .from("notifications")
      .select("*")
      .eq("userId", currentUser.id)
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout")), 15000)
    );

    let query = queryPromise;

    if (unreadOnly) {
      query = query.eq("viewed", false);
    }

    let result;
    try {
      result = await Promise.race([query, timeoutPromise]);
    } catch (error) {
      if (error instanceof Error && error.message === "Database connection timeout") {
        console.warn(
          "🔔 [NOTIFICATIONS] Database connection timeout - returning empty notifications"
        );
        return new Response(
          JSON.stringify({
            success: true,
            notifications: [],
            unreadCount: 0,
            limit,
            offset,
            warning: "Database connection timeout - notifications temporarily unavailable",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    const { data: notifications, error } = result as { data: any; error: any };

    if (error) {
      console.error("❌ [NOTIFICATIONS] Error fetching notifications:", error);

      // Check if the error is due to table not existing
      if (error.message && error.message.includes('relation "notifications" does not exist')) {
        return new Response(
          JSON.stringify({
            error: "Notifications table not found. Please run the database migration.",
            migrationRequired: true,
            instructions: [
              "1. Go to your Supabase dashboard",
              "2. Navigate to SQL Editor",
              "3. Run the SQL script from: sql-queriers/create-notifications-table.sql",
            ],
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ error: "Failed to fetch notifications" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("userId", currentUser.id)
      .eq("viewed", false);

    return new Response(
      JSON.stringify({
        success: true,
        notifications: notifications || [],
        unreadCount: unreadCount || 0,
        limit,
        offset,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [NOTIFICATIONS] Error in GET:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// POST - Mark notifications as viewed
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { notificationIds } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return new Response(JSON.stringify({ error: "Invalid notification IDs" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("notifications")
      .update({ viewed: true })
      .in("id", notificationIds)
      .eq("userId", currentUser.id);

    if (error) {
      console.error("❌ [NOTIFICATIONS] Error marking notifications as viewed:", error);
      return new Response(JSON.stringify({ error: "Failed to mark notifications as viewed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notifications marked as viewed",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [NOTIFICATIONS] Error in POST:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// DELETE - Delete notification
export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return new Response(JSON.stringify({ error: "Notification ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("userId", currentUser.id);

    if (error) {
      console.error("❌ [NOTIFICATIONS] Error deleting notification:", error);
      return new Response(JSON.stringify({ error: "Failed to delete notification" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification deleted",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [NOTIFICATIONS] Error in DELETE:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
