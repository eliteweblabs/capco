import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

interface CreateNotificationRequest {
  userId?: string;
  userEmail?: string;
  allUsers?: boolean;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  priority?: "low" | "normal" | "high" | "urgent";
  actionUrl?: string;
  actionText?: string;
}

export const POST: APIRoute = async ({ request }): Promise<Response> => {
  try {
    const body: CreateNotificationRequest = await request.json();
    const {
      userId,
      userEmail,
      allUsers = false,
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

    if (!allUsers && !userId && !userEmail) {
      return new Response(
        JSON.stringify({ error: "Either userId, userEmail, or allUsers is required" }),
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
