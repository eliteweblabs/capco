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
  console.log("🔔 [NOTIFICATIONS-UPSERT] API endpoint called");
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    console.log("🔔 [NOTIFICATIONS-UPSERT] Auth check:", { isAuth, hasUser: !!currentUser });
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      console.error("Supabase admin client not initialized");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: NotificationRequest = await request.json();

    // Handle marking notifications as viewed
    if (body.notificationIds && Array.isArray(body.notificationIds)) {
      const { data, error } = await supabaseAdmin
        .from("notifications")
        .update({ viewed: body.viewed ?? true })
        .in("id", body.notificationIds)
        .eq("userId", currentUser.id)
        .select();

      if (error) {
        console.error("❌ [NOTIFICATIONS] Error marking notifications as viewed:", error);
        return new Response(JSON.stringify({ error: "Failed to mark notifications as viewed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(
        `✅ [NOTIFICATIONS] Marked ${data?.length || 0} notifications as ${body.viewed ? "viewed" : "unviewed"} for user ${currentUser.id}`
      );

      return new Response(
        JSON.stringify({
          success: true,
          updatedCount: data?.length || 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
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
      return new Response(JSON.stringify({ error: "Title and message are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!allUsers && !userId && !userEmail && !groupType) {
      return new Response(
        JSON.stringify({ error: "Either userId, userEmail, allUsers, or groupType is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Send to all users
    if (allUsers) {
      const { data: allUsersData, error: usersError } = await supabaseAdmin
        .from("profiles")
        .select("id");

      if (usersError || !allUsersData) {
        return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
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
        return new Response(JSON.stringify({ error: "Failed to create notifications" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Notification sent to ${allUsersData.length} users`,
          count: allUsersData.length,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
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
        return new Response(JSON.stringify({ error: "Invalid group type" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { data: groupUsersData, error: groupUsersError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("role", role);

      if (groupUsersError || !groupUsersData) {
        return new Response(JSON.stringify({ error: "Failed to fetch group users" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (groupUsersData.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            message: `No users found with role ${role}`,
            count: 0,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
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
        return new Response(JSON.stringify({ error: "Failed to create group notifications" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(
        `✅ [NOTIFICATIONS] Created ${groupUsersData.length} notifications for ${groupType} group`
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: `Notification sent to ${groupUsersData.length} ${groupType}`,
          count: groupUsersData.length,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
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
      return new Response(
        JSON.stringify({
          error:
            "Invalid userId. Use 'allUsers: true' for all users or 'groupType' for role groups",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
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
        return new Response(JSON.stringify({ error: "User not found for email" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      targetUserId = userData.id;
    }

    // Validate we have a valid UUID before inserting
    if (
      !targetUserId ||
      !targetUserId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid userId format. Must be a valid UUID." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
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
      return new Response(
        JSON.stringify({
          error: "Failed to create notification",
          details: error.message,
          code: error.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ [NOTIFICATIONS] Created notification ${data.id} for user ${targetUserId}`);

    return new Response(
      JSON.stringify({
        success: true,
        notificationId: data.id,
        notification: data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [NOTIFICATIONS] Error in notifications API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
