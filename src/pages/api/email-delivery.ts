// do not change this page is formatting whatsoever
// if the email doesn't send change the formatting of the data that's being sent to this API

import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { SimpleProjectLogger } from "../../lib/simple-logging";
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

// Notification system functions
export async function createNotification(
  notificationData: NotificationData
): Promise<NotificationResponse> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        error: "Database not configured",
      };
    }

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
      return {
        success: false,
        error: error.message,
      };
    }

    console.log("✅ [NOTIFICATIONS] Created notification:", data.id);
    return {
      success: true,
      notificationId: data.id,
    };
  } catch (error) {
    console.error("❌ [NOTIFICATIONS] Error creating notification:", error);
    return {
      success: false,
      error: "Failed to create notification",
    };
  }
}

export async function createBulkNotifications(
  notifications: NotificationData[]
): Promise<{ success: boolean; created: number; errors: string[] }> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        created: 0,
        errors: ["Database not configured"],
      };
    }

    const insertData = notifications.map((notification) => ({
      user_id: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || "info",
      priority: notification.priority || "normal",
      expires_at: notification.expiresAt?.toISOString() || null,
      metadata: notification.metadata || {},
      action_url: notification.actionUrl || null,
      action_text: notification.actionText || null,
    }));

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert(insertData)
      .select("id");

    if (error) {
      console.error("❌ [NOTIFICATIONS] Error creating bulk notifications:", error);
      return {
        success: false,
        created: 0,
        errors: [error.message],
      };
    }

    console.log("✅ [NOTIFICATIONS] Created bulk notifications:", data.length);
    return {
      success: true,
      created: data.length,
      errors: [],
    };
  } catch (error) {
    console.error("❌ [NOTIFICATIONS] Error creating bulk notifications:", error);
    return {
      success: false,
      created: 0,
      errors: ["Failed to create bulk notifications"],
    };
  }
}

export async function markNotificationAsViewed(
  notificationId: number,
  userId: string
): Promise<boolean> {
  try {
    if (!supabase) {
      return false;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ viewed: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("❌ [NOTIFICATIONS] Error marking notification as viewed:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ [NOTIFICATIONS] Error marking notification as viewed:", error);
    return false;
  }
}

export async function markMultipleNotificationsAsViewed(
  notificationIds: number[],
  userId: string
): Promise<boolean> {
  try {
    if (!supabase) {
      return false;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ viewed: true })
      .in("id", notificationIds)
      .eq("user_id", userId);

    if (error) {
      console.error("❌ [NOTIFICATIONS] Error marking multiple notifications as viewed:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ [NOTIFICATIONS] Error marking multiple notifications as viewed:", error);
    return false;
  }
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

    // Determine notification type and priority based on email type
    let notificationType: "info" | "success" | "warning" | "error" = "info";
    let priority: "low" | "normal" | "high" | "urgent" = "normal";
    let title = emailSubject;
    let message = emailContent;

    // Customize notification based on email type
    switch (emailType) {
      case "proposal_submitted":
        notificationType = "success";
        priority = "high";
        title = "New Proposal Submitted";
        message = `A new proposal has been submitted for your project.`;
        break;
      case "proposal_approved":
        notificationType = "success";
        priority = "high";
        title = "Proposal Approved";
        message = `Your proposal has been approved and is ready for next steps.`;
        break;
      case "proposal_rejected":
        notificationType = "warning";
        priority = "high";
        title = "Proposal Requires Changes";
        message = `Your proposal needs some adjustments before it can be approved.`;
        break;
      case "payment_received":
        notificationType = "success";
        priority = "normal";
        title = "Payment Received";
        message = `We have received your payment. Thank you!`;
        break;
      case "project_status_change":
        notificationType = "info";
        priority = "normal";
        title = "Project Status Updated";
        message = `Your project status has been updated.`;
        break;
      case "document_uploaded":
        notificationType = "info";
        priority = "normal";
        title = "New Document Uploaded";
        message = `A new document has been uploaded to your project.`;
        break;
      case "system_alert":
        notificationType = "warning";
        priority = "high";
        title = "System Alert";
        message = emailContent;
        break;
      default:
        // Use email subject and content as-is
        break;
    }

    // Create notification
    const notificationData: NotificationData = {
      userId: userData.id,
      title,
      message,
      type: notificationType,
      priority,
      metadata: {
        emailType,
        projectId,
        newStatus,
        originalSubject: emailSubject,
      },
      actionUrl: buttonLink,
      actionText: "View Details",
    };

    const result = await createNotification(notificationData);

    if (result.success) {
      console.log(
        `✅ [NOTIFICATIONS] Created notification for ${userEmail}:`,
        result.notificationId
      );
    } else {
      console.error(
        `❌ [NOTIFICATIONS] Failed to create notification for ${userEmail}:`,
        result.error
      );
    }
  } catch (error) {
    console.error("❌ [NOTIFICATIONS] Error creating internal notification:", error);
  }
}

export const POST: APIRoute = async ({ request, cookies }): Promise<Response> => {
  // Log to file for debugging
  const fs = await import("fs");
  const logEntry = `[${new Date().toISOString()}] EMAIL-DELIVERY API called\n`;
  fs.appendFileSync("/tmp/astro-email.log", logEntry);

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
    let emailTemplate: string;

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
      trackLinks = true, // Default to true for backward compatibility
    } = body;

    // Determine if click tracking should be disabled based on email type
    // Magic link emails should not be tracked to prevent URL wrapping
    const shouldDisableTracking =
      emailType === "magic_link" ||
      emailType === "authentication" ||
      emailType === "login" ||
      (buttonLink && buttonLink.includes("/dashboard") && !trackLinks);

    const finalTrackLinks = shouldDisableTracking ? false : trackLinks;

    // Debug logging for tracking configuration
    if (shouldDisableTracking) {
      console.log("📧 [EMAIL-DELIVERY] Click tracking disabled for email type:", emailType);
    } else {
      console.log("📧 [EMAIL-DELIVERY] Click tracking enabled for email type:", emailType);
    }

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

    // Read email template
    try {
      const templatePath = join(process.cwd(), "src", "templates-email", "template.html");

      emailTemplate = readFileSync(templatePath, "utf-8");

      if (!emailTemplate || emailTemplate.length === 0) {
        throw new Error("Email template is empty");
      }
    } catch (templateError) {
      console.error("📧 [EMAIL-DELIVERY] Template loading error:", templateError);
      console.error("📧 [EMAIL-DELIVERY] Template error details:", {
        message: templateError instanceof Error ? templateError.message : "Unknown error",
        stack: templateError instanceof Error ? templateError.stack : undefined,
      });
      throw templateError;
    }

    const sentEmails = [];
    const failedEmails = [];

    try {
      // Send emails to each user
      for (let i = 0; i < usersToNotify.length; i++) {
        const userEmail = usersToNotify[i];

        let emailHtml: string;
        try {
          // Replace template variables for regular emails
          emailHtml = emailTemplate.replace("{{CONTENT}}", emailContent);

          // must process LOGO before COMPANY_NAME for title tag
          emailHtml = emailHtml.replace(
            /{{GLOBAL_COMPANY_NAME}}/g,
            process.env.GLOBAL_COMPANY_NAME || "No Company Name"
          );

          emailHtml = emailHtml.replace(
            /{{PRIMARY_COLOR}}/g,
            process.env.PRIMARY_COLOR || "#3b82f6"
          );

          emailHtml = emailHtml.replace(/{{YEAR}}/g, process.env.YEAR || "No Year");

          emailHtml = emailHtml.replace(
            /{{GLOBAL_COMPANY_SLOGAN}}/g,
            process.env.GLOBAL_COMPANY_SLOGAN || "No Company Slogan"
          );
          emailHtml = emailHtml.replace(
            /{{COMPANY_LOGO_LIGHT}}/g,
            process.env.COMPANY_LOGO_LIGHT || "No Logo Img"
          );
          emailHtml = emailHtml.replace(
            /{{COMPANY_LOGO_DARK}}/g,
            process.env.COMPANY_LOGO_DARK || "No Logo Img"
          );

          // Override buttonLink with magic link for authentication
          let finalButtonLink = buttonLink;

          if (buttonLink && buttonLink.includes("/dashboard")) {
            try {
              const redirectUrl = `${baseUrl}${buttonLink}`;
              console.log("🔗 [EMAIL-DELIVERY] Magic link redirect URL:", redirectUrl);

              const { data: magicLinkData, error: magicLinkError } =
                await supabaseAdmin.auth.admin.generateLink({
                  type: "magiclink",
                  email: userEmail,
                  options: {
                    redirectTo: redirectUrl,
                  },
                });

              if (magicLinkError) {
                console.error("📧 [EMAIL-DELIVERY] Error generating magic link:", magicLinkError);
              } else {
                finalButtonLink = magicLinkData.properties.action_link;
                // console.log("📧 [EMAIL-DELIVERY] Generated magic link for:", userEmail);
              }
            } catch (error) {
              console.error("📧 [EMAIL-DELIVERY] Error generating magic link:", error);
            }
          }

          if (buttonText && finalButtonLink) {
            emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", buttonText);
            emailHtml = emailHtml.replace("{{BUTTON_LINK}}", finalButtonLink);
          }

          // // Validate from field
          const validFromName = fromName && fromName.trim() !== "" ? fromName.trim() : "CAPCo";
          const validFromEmail =
            fromEmail && fromEmail.trim() !== "" ? fromEmail.trim() : "noreply@capcofire.com";

          // Strip HTML from email subject line
          const cleanSubject = emailSubject.replace(/<[^>]*>/g, "").trim();

          const emailPayload = {
            from: `${validFromName} <${validFromEmail}>`,
            to: userEmail,
            subject: cleanSubject,
            html: emailHtml,
            text: emailContent,
            // Configure click tracking based on email type
            // Disable for magic links, enable for status updates and other emails
            track_links: finalTrackLinks,
            // Add proper content type and custom headers (only if values exist)
            headers: {
              "Content-Type": "text/html; charset=UTF-8",
              ...(includeResendHeaders && projectId && { "X-Project-ID": String(projectId) }),
              ...(includeResendHeaders &&
                newStatus !== undefined &&
                newStatus !== null && { "X-Project-Status": String(newStatus) }),
              ...(includeResendHeaders && authorId && { "X-Author-ID": String(authorId) }),
            },
          };

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${emailApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailPayload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`📧 [EMAIL-DELIVERY] Response status:`, response.status);
            console.error(`📧 [EMAIL-DELIVERY] Error response:`, errorText);
            console.error(
              `📧 [EMAIL-DELIVERY] Email payload that failed:`,
              JSON.stringify(emailPayload, null, 2)
            );
            failedEmails.push({ email: userEmail, error: errorText });

            // Log failed email delivery
            try {
              await SimpleProjectLogger.addLogEntry(
                projectId || 0,
                "email_delivery_failed",
                `System (${userEmail})`,
                `Email delivery failed to ${userEmail} - Type: ${emailType}, Subject: ${emailSubject}, Error: ${errorText}`,
                null,
                { emailType, emailSubject, error: errorText, status: response.status }
              );
            } catch (logError) {
              console.error("📧 [EMAIL-DELIVERY] Error logging failed email delivery:", logError);
            }
          } else {
            const responseData = await response.json();
            console.log(
              // `📧 [EMAIL-DELIVERY] Email sent successfully to ${userEmail}:`,
              responseData
            );
            sentEmails.push(userEmail);

            // Log successful email delivery
            try {
              await SimpleProjectLogger.addLogEntry(
                projectId || 0,
                "email_delivery_success",
                `System (${userEmail})`,
                `Email sent successfully to ${userEmail} - Type: ${emailType}, Subject: ${emailSubject}`,
                null,
                { emailType, emailSubject, responseId: responseData.id }
              );
            } catch (logError) {
              console.error(
                "📧 [EMAIL-DELIVERY] Error logging successful email delivery:",
                logError
              );
            }

            // Create internal notification for the user
            try {
              await this.createInternalNotification(
                userEmail,
                emailType,
                emailSubject,
                emailContent,
                projectId,
                newStatus,
                buttonLink
              );
            } catch (notificationError) {
              console.error(
                "📧 [EMAIL-DELIVERY] Error creating internal notification:",
                notificationError
              );
            }
          }
        } catch (userError) {
          console.error(
            `📧 [EMAIL-DELIVERY] Error sending notification to ${userEmail}:`,
            userError
          );
          console.error(`📧 [EMAIL-DELIVERY] Error details:`, {
            message: userError instanceof Error ? userError.message : "Unknown error",
            stack: userError instanceof Error ? userError.stack : undefined,
            userEmail,
          });
          failedEmails.push({
            email: userEmail,
            error: userError instanceof Error ? userError.message : "Unknown error",
          });

          // Log failed email delivery (catch block)
          try {
            await SimpleProjectLogger.addLogEntry(
              projectId || 0,
              "email_delivery_error",
              `System (${userEmail})`,
              `Email delivery error to ${userEmail} - Type: ${emailType}, Subject: ${emailSubject}, Error: ${userError instanceof Error ? userError.message : "Unknown error"}`,
              null,
              {
                emailType,
                emailSubject,
                error: userError instanceof Error ? userError.message : "Unknown error",
              }
            );
          } catch (logError) {
            console.error("📧 [EMAIL-DELIVERY] Error logging email delivery error:", logError);
          }
        }
      }
    } catch (emailSendingError) {
      console.error("📧 [EMAIL-DELIVERY] Error in email sending process:", emailSendingError);
      console.error("📧 [EMAIL-DELIVERY] Email sending error details:", {
        message: emailSendingError instanceof Error ? emailSendingError.message : "Unknown error",
        stack: emailSendingError instanceof Error ? emailSendingError.stack : undefined,
      });

      // If we have a critical error, return failure
      const errorResponse: EmailDeliveryResponse = {
        success: false,
        error: "Failed to send email notifications",
        totalSent: 0,
        totalFailed: usersToNotify.length,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // console.log("📧 [EMAIL-DELIVERY] Email delivery completed:");
    // console.log("  - Sent emails:", sentEmails);
    // console.log("  - Failed emails:", failedEmails);
    // console.log("  - Total sent:", sentEmails.length);
    // console.log("  - Total failed:", failedEmails.length);

    // Log overall email delivery completion
    try {
      await SimpleProjectLogger.addLogEntry(
        projectId || 0,
        "email_delivery_completed",
        "System",
        `Email delivery batch completed - Type: ${emailType}, Total sent: ${sentEmails.length}, Total failed: ${failedEmails.length}`,
        `System (${sentEmails.length} sent, ${failedEmails.length} failed)`,
        {
          emailType: emailType || "Unknown",
          totalSent: sentEmails.length,
          totalFailed: failedEmails.length,
          sentEmails: sentEmails,
          failedEmails: failedEmails,
        }
      );
    } catch (logError) {
      console.error("📧 [EMAIL-DELIVERY] Error logging email delivery completion:", logError);
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
    console.error("📧 [EMAIL-DELIVERY] Top-level error:", error);
    console.error(
      "📧 [EMAIL-DELIVERY] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    const errorResponse: EmailDeliveryResponse = {
      success: false,
      error: "Failed to send email notifications",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// CORS preflight handler
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};
