import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

/**
 * Standardized Notifications GET API
 * 
 * Fetches notifications for a user with pagination and filtering
 * 
 * Query Parameters:
 * - limit?: number (default: 20) - Number of notifications to return
 * - offset?: number (default: 0) - Pagination offset
 * - unread_only?: boolean - Only return unread notifications
 * - userId?: string - Admin only: Get notifications for specific user
 * 
 * Examples:
 * - GET /api/notifications/get - Get current user's notifications
 * - GET /api/notifications/get?unread_only=true - Get unread notifications
 * - GET /api/notifications/get?userId=123 (Admin only) - Get user's notifications
 */
export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse query parameters
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const unreadOnly = url.searchParams.get("unread_only") === "true";
    const requestedUserId = url.searchParams.get("userId");

    // If requesting another user's notifications, check admin role
    let targetUserId = currentUser.id;
    if (requestedUserId && requestedUserId !== currentUser.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      if (!profile || profile.role !== "Admin") {
        return new Response(JSON.stringify({ error: "Unauthorized - Admin access required" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      targetUserId = requestedUserId;
    }

    // Add timeout handling for Supabase connection issues
    const queryPromise = supabase
      .from("notifications")
      .select("*")
      .eq("userId", targetUserId)
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
        console.warn("🔔 [NOTIFICATIONS] Database connection timeout - returning empty notifications");
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
      .eq("userId", targetUserId)
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