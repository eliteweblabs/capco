import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

interface CreateNotificationRequest {
  userId?: string;
  userEmail?: string;
  allUsers?: boolean;
  groupType?: "admins" | "staff" | "clients";
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  priority?: "low" | "normal" | "high" | "urgent";
  actionUrl?: string;
  actionText?: string;
}

/**
 * Standardized Notifications UPSERT API
 *
 * Handles both creating new notifications and updating existing ones
 * Supports bulk notifications, group targeting, and individual targeting
 *
 * POST Body:
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
 * Examples:
 * - Individual: POST /api/notifications/upsert { userId, title, message }
 * - Group: POST /api/notifications/upsert { groupType: "admins", title, message }
 * - All Users: POST /api/notifications/upsert { allUsers: true, title, message }
 */

export const POST: APIRoute = async ({ request, cookies }): Promise<Response> => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: CreateNotificationRequest = await request.json();
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

    if (allUsers) {
      if (!supabaseAdmin) {
        console.error("Supabase admin client not initialized");
        return new Response(JSON.stringify({ error: "Server configuration error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      // Send notification to all users
      const { data: allUsersData, error: usersError } = await supabaseAdmin
        .from("profiles")
        .select("id");

      if (usersError || !allUsersData) {
        return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create notifications for all users
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

    if (groupType) {
      if (!supabaseAdmin) {
        console.error("Supabase admin client not initialized");
        return new Response(JSON.stringify({ error: "Server configuration error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Map groupType to role
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

      // Get users by role
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

      // Create notifications for group users
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

    let targetUserId = userId;

    if (!supabaseAdmin) {
      console.error("Supabase admin client not initialized");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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

    // Create the notification
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        userId: targetUserId,
        title,
        message,
        type,
        priority,
        actionUrl: actionUrl,
        actionText: actionText,
        viewed: false,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ [NOTIFICATIONS] Error creating notification:", error);
      return new Response(JSON.stringify({ error: "Failed to create notification" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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
    console.error("❌ [NOTIFICATIONS] Error in create notification API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
