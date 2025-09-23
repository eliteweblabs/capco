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

    // Only allow Admin and Staff to create notifications
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

    // console.log("📱 [STORE-NOTIFICATION] Storing notifications for:", userEmails);
    // console.log("📱 [STORE-NOTIFICATION] Sent by:", currentUser.email, `(${currentRole})`);

    // Get user IDs from emails
    const { data: users, error: userError } = await supabase
      .from("profiles")
      .select("id, email")
      .in("email", userEmails);

    if (userError) {
      console.error("📱 [STORE-NOTIFICATION] Error fetching users:", userError);
      return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!users || users.length === 0) {
      console.warn("📱 [STORE-NOTIFICATION] No users found for emails:", userEmails);
      return new Response(
        JSON.stringify({
          success: true,
          message: "No users found for the provided emails",
          stored: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Store notification for each user
    const notifications = users.map((user) => ({
      user_id: user.id,
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/favicon.svg",
      data: notification.data || {},
      read: false,
      created_at: new Date().toISOString(),
      created_by: currentUser.id,
    }));

    const { data: storedNotifications, error: storeError } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (storeError) {
      console.error("📱 [STORE-NOTIFICATION] Error storing notifications:", storeError);
      return new Response(JSON.stringify({ error: "Failed to store notifications" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // console.log("📱 [STORE-NOTIFICATION] Stored notifications:", storedNotifications?.length);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notifications stored successfully",
        stored: storedNotifications?.length || 0,
        notifications: storedNotifications,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("📱 [STORE-NOTIFICATION] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
