import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser, currentRole } = await checkAuth(cookies);

    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only allow Admin and Staff to send push notifications
    if (currentRole !== "Admin" && currentRole !== "Staff") {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { userEmails, notification } = body;

    if (!userEmails || !Array.isArray(userEmails) || userEmails.length === 0) {
      return new Response(JSON.stringify({ error: "User emails are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!notification || !notification.title || !notification.body) {
      return new Response(JSON.stringify({ error: "Notification title and body are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // // // console.log("📱 [PUSH-NOTIFICATION] Sending push notifications to:", userEmails);
    // // console.log("📱 [PUSH-NOTIFICATION] Sent by:", currentUser.email, `(${currentRole})`);
    // // // console.log("📱 [PUSH-NOTIFICATION] Notification data:", notification);

    // Get user IDs from emails
    const { data: users, error: userError } = await supabase
      .from("profiles")
      .select("id, email")
      .in("email", userEmails);

    if (userError) {
      console.error("📱 [PUSH-NOTIFICATION] Error fetching users:", userError);
      return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!users || users.length === 0) {
      console.warn("📱 [PUSH-NOTIFICATION] No users found for emails:", userEmails);
      return new Response(
        JSON.stringify({
          success: true,
          message: "No users found for the provided emails",
          sent: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // // // console.log("📱 [PUSH-NOTIFICATION] Found users:", users.length);

    // For now, we'll just log the notification data
    // In a real implementation, you would:
    // 1. Store the notification in a database
    // 2. Use a push notification service (like Firebase Cloud Messaging, OneSignal, etc.)
    // 3. Send the notification to each user's registered devices

    // Log the notification for debugging
    users.forEach((user) => {
      // // console.log(`📱 [PUSH-NOTIFICATION] Would send to ${user.email} (${user.id}):`, {
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });
    });

    // TODO: Implement actual push notification sending
    // This could involve:
    // - Storing notifications in a database table
    // - Using a service worker to handle notifications
    // - Integrating with a push notification service
    // - Sending to user's registered devices

    return new Response(
      JSON.stringify({
        success: true,
        message: "Push notifications queued for sending",
        sent: users.length,
        users: users.map((u) => ({ id: u.id, email: u.email })),
        notification: notification,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("📱 [PUSH-NOTIFICATION] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
