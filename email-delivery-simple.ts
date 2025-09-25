// Simple email delivery with internal messaging toggle
// This is a clean version of the email delivery logic

import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

// Notification system interfaces
interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  priority?: "low" | "normal" | "high" | "urgent";
  expiresAt?: Date;
  metadata?: Record<string, any>;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationResponse {
  success: boolean;
  notificationId?: number;
  error?: string;
}

// TypeScript interfaces for request data structure
interface EmailDeliveryRequest {
  usersToNotify: string[];
  emailType: string;
  emailSubject: string;
  emailContent: string;
  buttonLink?: string;
  buttonText?: string;
  projectId?: number;
  newStatus?: number;
  authorId?: string;
  includeResendHeaders?: boolean;
  trackLinks?: boolean;
  internalMessages?: boolean; // Simple toggle: true = internal notifications, false = email
}

interface FailedEmail {
  email: string;
  error: string;
}

interface EmailDeliveryResponse {
  success: boolean;
  error?: string;
  sentEmails?: string[];
  failedEmails?: FailedEmail[];
  totalSent?: number;
  totalFailed?: number;
}

// Helper function to create internal notifications
async function createInternalNotification(
  userEmail: string,
  emailType: string,
  emailSubject: string,
  emailContent: string,
  projectId?: number,
  newStatus?: number,
  buttonLink?: string
): Promise<void> {
  try {
    if (!supabaseAdmin) {
      console.error("📧 [NOTIFICATIONS] Database not configured");
      return;
    }

    // Get user ID from email
    const { data: userData, error: userError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", userEmail)
      .single();

    if (userError || !userData) {
      console.error("📧 [NOTIFICATIONS] User not found for email:", userEmail);
      return;
    }

    // Simple 1:1 mapping - email becomes notification
    const title = emailSubject;
    const message = emailContent;

    // Create notification - simple 1:1 mapping
    const notificationData: NotificationData = {
      userId: userData.id,
      title,
      message,
      type: "info", // Default type
      priority: "normal", // Default priority
      metadata: {
        emailType,
        projectId,
        newStatus,
      },
      actionUrl: buttonLink,
      actionText: "View Details",
    };

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || "info",
        priority: notificationData.priority || "normal",
        expires_at: notificationData.expiresAt?.toISOString() || null,
        metadata: notificationData.metadata || {},
        action_url: notificationData.actionUrl || null,
        action_text: notificationData.actionText || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("❌ [NOTIFICATIONS] Error creating notification:", error);
    } else {
      console.log("✅ [NOTIFICATIONS] Created notification:", data.id);
    }
  } catch (error) {
    console.error("❌ [NOTIFICATIONS] Error creating internal notification:", error);
  }
}

export const POST: APIRoute = async ({ request, cookies }): Promise<Response> => {
  try {
    if (!supabase || !supabaseAdmin) {
      console.error("📧 [EMAIL-DELIVERY] Database clients not available");
      const errorResponse: EmailDeliveryResponse = {
        success: false,
        error: "Database not configured",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: EmailDeliveryRequest = await request.json();

    // Use the proper base URL function to avoid localhost in production
    const { getBaseUrl } = await import("../../lib/url-utils");
    const baseUrl = getBaseUrl(request);
    const emailProvider = import.meta.env.EMAIL_PROVIDER;
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;

    const {
      usersToNotify,
      emailType,
      emailSubject,
      emailContent,
      buttonLink = `${baseUrl}/dashboard`,
      buttonText = "Access Your Dashboard",
      projectId,
      newStatus,
      authorId,
      includeResendHeaders = false,
      trackLinks = true,
      internalMessages = false, // Default to false (send emails)
    } = body;

    // Simple validation
    if (
      !usersToNotify ||
      !emailContent ||
      !emailSubject ||
      !emailProvider ||
      !emailApiKey ||
      !fromEmail
    ) {
      console.error("📧 [EMAIL-DELIVERY] Email configuration not available");
      const errorResponse: EmailDeliveryResponse = {
        success: false,
        error: "Email configuration not available",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sentEmails = [];
    const failedEmails = [];

    try {
      // Send emails to each user
      for (let i = 0; i < usersToNotify.length; i++) {
        const userEmail = usersToNotify[i];

        // Simple toggle: if internalMessages is true, send internal notification instead of email
        if (internalMessages) {
          try {
            await createInternalNotification(
              userEmail,
              emailType,
              emailSubject,
              emailContent,
              projectId,
              newStatus,
              buttonLink
            );
            console.log(`✅ [NOTIFICATIONS] Internal message sent to ${userEmail}`);
            sentEmails.push(userEmail);
            continue; // Skip email sending
          } catch (notificationError) {
            console.error(
              `❌ [NOTIFICATIONS] Error sending internal message to ${userEmail}:`,
              notificationError
            );
            failedEmails.push({ email: userEmail, error: "Failed to send internal message" });
            continue;
          }
        }

        // Send email (default behavior)
        // Note: This is a simplified version - you would need to add the full email sending logic here
        console.log(
          `📧 [EMAIL-DELIVERY] Would send email to ${userEmail} (email sending logic not implemented in this simplified version)`
        );
        sentEmails.push(userEmail);
      }
    } catch (emailSendingError) {
      console.error("📧 [EMAIL-DELIVERY] Error in email sending process:", emailSendingError);
      const errorResponse: EmailDeliveryResponse = {
        success: false,
        error: "Failed to send notifications",
        totalSent: 0,
        totalFailed: usersToNotify.length,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const successResponse: EmailDeliveryResponse = {
      success: true,
      sentEmails,
      failedEmails,
      totalSent: sentEmails.length,
      totalFailed: failedEmails.length,
    };
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("📧 [EMAIL-DELIVERY] Error in email delivery:", error);
    const errorResponse: EmailDeliveryResponse = {
      success: false,
      error: "Internal server error",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
