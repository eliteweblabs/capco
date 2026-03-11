import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

interface NotificationRequest {
  // Create/Update fields
  userId?: string;
  userEmail?: string;
  allUsers?: boolean;
  groupType?: "admins" | "staff" | "clients";
  title?: string;
  message?: string;
  type?: "info" | "success" | "warning" | "error";
  priority?: "low" | "normal" | "high" | "urgent";
  actionUrl?: string;
  actionText?: string;
  // Mark viewed fields
  notificationIds?: number[];
  viewed?: boolean;
}

/**
 * Standardized Notifications UPSERT API
 *
 * Handles creating, updating, and marking notifications as viewed
 *
 * POST Body for Creating/Updating:
 * - userId?: string (target specific user)
 * - userEmail?: string (target user by email)
 * - allUsers?: boolean (send to all users)
 * - groupType?: "admins" | "staff" | "clients" (target by role group)
 * - title: string
 * - message: string
 * - type?: "info" | "success" | "warning" | "error" (default: "info")
 * - priority?: "low" | "normal" | "high" | "urgent" (default: "normal")
 * - actionUrl?: string
 * - actionText?: string
 *
 * POST Body for Marking as Viewed:
 * - notificationIds: number[] (IDs to mark as viewed)
 * - viewed: boolean (true/false)
 *
 * Examples:
 * - Individual: POST /api/notifications/upsert { userId, title, message }
 * - Group: POST /api/notifications/upsert { groupType: "admins", title, message }
 * - All Users: POST /api/notifications/upsert { allUsers: true, title, message }
 * - Mark Viewed: POST /api/notifications/upsert { notificationIds: [1,2,3], viewed: true }
 */
export const POST: APIRoute = async ({ request, cookies }): Promise<Response> => {
  const traceId =
    request.headers.get("x-trace-id") ||
    `notif-upsert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const traceName = request.headers.get("x-trace-name") || "api.notifications.upsert";
  const json = (payload: Record<string, unknown>, status: number) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: {
        "Content-Type": "application/json",
        "x-trace-id": traceId,
        "x-trace-name": traceName,
      },
    });
  console.log("🔔 [NOTIFICATIONS-UPSERT] API endpoint called");
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    console.log("🔔 [NOTIFICATIONS-UPSERT] Auth check:", { isAuth, hasUser: !!currentUser });
    if (!isAuth || !currentUser) {
      return json({ error: "Authentication required" }, 401);
    }

    if (!supabaseAdmin) {
      console.error("Supabase admin client not initialized");
      return json({ error: "Server configuration error" }, 500);
    }

    const body: NotificationRequest = await request.json();

    // Handle marking notifications as viewed (archive = mark as viewed)
    if (body.notificationIds && Array.isArray(body.notificationIds)) {
      console.log(
        "🔔 [NOTIFICATIONS-UPSERT] Mark as viewed: notificationIds =",
        body.notificationIds,
        "viewed =",
        body.viewed ?? true
      );
      const { data, error } = await supabaseAdmin
        .from("notifications")
        .update({ viewed: body.viewed ?? true })
        .in("id", body.notificationIds)
        .eq("userId", currentUser.id)
        .select();

      if (error) {
        console.error("❌ [NOTIFICATIONS-UPSERT] Error marking notifications as viewed:", error);
        return json({ error: "Failed to mark notifications as viewed" }, 500);
      }

      console.log(
        "🔔 [NOTIFICATIONS-UPSERT] Marked",
        data?.length || 0,
        "notifications as",
        body.viewed ? "viewed" : "unviewed"
      );

      return json(
        {
          success: true,
          updatedCount: data?.length || 0,
        },
        200
      );
    }

    // Handle creating/updating notifications
    console.log("🔔 [NOTIFICATIONS-UPSERT] Request body:", {
      hasUserId: !!body.userId,
      hasUserEmail: !!body.userEmail,
      hasAllUsers: !!body.allUsers,
      hasGroupType: !!body.groupType,
      hasTitle: !!body.title,
      hasMessage: !!body.message,
      userId: body.userId,
      userEmail: body.userEmail,
      allUsers: body.allUsers,
      groupType: body.groupType,
    });

    const {
      userId,
      userEmail,
      allUsers = false,
      groupType,
      title,
      message,
      type = "info",
      priority = "normal",
      actionUrl,
      actionText,
    } = body;

    if (!title || !message) {
      return json({ error: "Title and message are required" }, 400);
    }

    if (!allUsers && !userId && !userEmail && !groupType) {
      return json({ error: "Either userId, userEmail, allUsers, or groupType is required" }, 400);
    }

    // Send to all users
    if (allUsers) {
      const { data: allUsersData, error: usersError } = await supabaseAdmin
        .from("profiles")
        .select("id");

      if (usersError || !allUsersData) {
        return json({ error: "Failed to fetch users" }, 500);
      }

      const notifications = allUsersData.map((user) => ({
        userId: user.id,
        title,
        message,
        type,
        priority,
        actionUrl: actionUrl,
        actionText: actionText,
        viewed: false,
      }));

      const { error: insertError } = await supabaseAdmin
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        return json({ error: "Failed to create notifications" }, 500);
      }

      return json(
        {
          success: true,
          message: `Notification sent to ${allUsersData.length} users`,
          count: allUsersData.length,
        },
        200
      );
    }

    // Send to role group
    if (groupType) {
      const roleMap = {
        admins: "Admin",
        staff: "Staff",
        clients: "Client",
      };

      const role = roleMap[groupType];
      if (!role) {
        return json({ error: "Invalid group type" }, 400);
      }

      const { data: groupUsersData, error: groupUsersError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("role", role);

      if (groupUsersError || !groupUsersData) {
        return json({ error: "Failed to fetch group users" }, 500);
      }

      if (groupUsersData.length === 0) {
        return json(
          {
            success: true,
            message: `No users found with role ${role}`,
            count: 0,
          },
          200
        );
      }

      const notifications = groupUsersData.map((user) => ({
        userId: user.id,
        title,
        message,
        type,
        priority,
        actionUrl: actionUrl,
        actionText: actionText,
        viewed: false,
      }));

      const { error: insertError } = await supabaseAdmin
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("❌ [NOTIFICATIONS] Error creating group notifications:", insertError);
        return json({ error: "Failed to create group notifications" }, 500);
      }

      console.log(
        `✅ [NOTIFICATIONS] Created ${groupUsersData.length} notifications for ${groupType} group`
      );

      return json(
        {
          success: true,
          message: `Notification sent to ${groupUsersData.length} ${groupType}`,
          count: groupUsersData.length,
        },
        200
      );
    }

    // Send to individual user
    let targetUserId = userId;

    // Validate userId is not "all" or other invalid values
    if (
      userId &&
      (userId === "all" ||
        userId === "allUsers" ||
        !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))
    ) {
      return json(
        {
          error:
            "Invalid userId. Use 'allUsers: true' for all users or 'groupType' for role groups",
        },
        400
      );
    }

    // If userEmail is provided, look up the user ID
    if (userEmail && !userId) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", userEmail)
        .single();

      if (userError || !userData) {
        return json({ error: "User not found for email" }, 404);
      }

      targetUserId = userData.id;
    }

    // Validate we have a valid UUID before inserting
    if (
      !targetUserId ||
      !targetUserId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    ) {
      return json({ error: "Invalid userId format. Must be a valid UUID." }, 400);
    }

    // Create the notification
    // Try camelCase first (if table was migrated), fallback to snake_case
    console.log("🔔 [NOTIFICATIONS] Attempting to create notification:", {
      targetUserId,
      title: title?.substring(0, 50),
      hasActionUrl: !!actionUrl,
      hasActionText: !!actionText,
    });

    let data, error;

    // First try camelCase (preferred)
    const insertData = {
      userId: targetUserId,
      title,
      message,
      type,
      priority,
      actionUrl: actionUrl || null,
      actionText: actionText || null,
      viewed: false,
    };

    const result = await supabaseAdmin.from("notifications").insert(insertData).select().single();

    data = result.data;
    error = result.error;

    // If camelCase fails, try snake_case (legacy table format)
    if (error && error.code === "42703") {
      // Column doesn't exist error
      console.log("🔔 [NOTIFICATIONS] camelCase failed, trying snake_case...");
      const snakeCaseResult = await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: targetUserId,
          title,
          message,
          type,
          priority,
          action_url: actionUrl || null,
          action_text: actionText || null,
          viewed: false,
        })
        .select()
        .single();

      data = snakeCaseResult.data;
      error = snakeCaseResult.error;
    }

    if (error) {
      console.error("❌ [NOTIFICATIONS] Error creating notification:", {
        error: error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        targetUserId,
      });
      return json(
        {
          error: "Failed to create notification",
          details: error.message,
          code: error.code,
        },
        500
      );
    }

    console.log(`✅ [NOTIFICATIONS] Created notification ${data.id} for user ${targetUserId}`);

    return json(
      {
        success: true,
        notificationId: data.id,
        notification: data,
      },
      200
    );
  } catch (error) {
    console.error("❌ [NOTIFICATIONS] Error in notifications API:", error);
    return json({ error: "Internal server error" }, 500);
  }
};
