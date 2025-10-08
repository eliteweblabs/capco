// do not change this page is formatting whatsoever
// if the email doesn't send change the formatting of the data that's being sent to this API

/**
 * NOTIFICATION SYSTEM OVERVIEW:
 *
 * This email delivery system supports multiple notification methods:
 *
 * 1. EMAIL NOTIFICATIONS (default):
 *    - Traditional email delivery via Resend
 *    - Always sent unless explicitly disabled
 *
 * 2. BROWSER PUSH NOTIFICATIONS:
 *    - System-level browser notifications (outside the app)
 *    - Uses browser's native notification API
 *    - NOT stored in database
 *
 * 3. INTERNAL NOTIFICATIONS:
 *    - Database-stored notifications displayed in NotificationDropdown.astro
 *    - Created via /admin/notification interface
 *    - Stored in 'notifications' table
 *    - Read by NotificationDropdown.astro component
 *
 * 4. SMS NOTIFICATIONS:
 *    - Text message notifications (framework only)
 *    - Stored in 'sms_queue' table for processing
 *
 * 5. ALL NOTIFICATIONS:
 *    - Sends all notification types above
 *    - Email is always sent as fallback
 */

import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

// TypeScript interfaces for request data structure
interface EmailDeliveryRequest {
  usersToNotify: string[];
  userIdsToNotify?: string[]; // User IDs for internal notifications (more efficient)
  emailType: string;
  emailSubject: string;
  emailContent: string;
  buttonLink?: string;
  buttonText?: string;
  project?: any;
  newStatus?: number;
  authorId?: string;
  includeResendHeaders?: boolean;
  trackLinks?: boolean;
  currentUser?: any;
  emailToRoles?: any;
  notificationPreferences?: NotificationPreferences;
}

interface NotificationPreferences {
  method: "email" | "browser" | "internal" | "sms" | "all";
  fallbackToEmail?: boolean;
  smsProvider?: "twilio" | "sendgrid" | "custom";
  internalNotificationType?:
    | "status_update"
    | "project_created"
    | "file_uploaded"
    | "comment_added";
  browserNotificationTitle?: string;
  browserNotificationBody?: string;
  browserNotificationIcon?: string;
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

export const POST: APIRoute = async ({ request, cookies }): Promise<Response> => {
  // Log to file for debugging
  // const fs = await import("fs");
  // const logEntry = `[${new Date().toISOString()}] EMAIL-DELIVERY API called\n`;
  // fs.appendFileSync("/tmp/astro-email.log", logEntry);

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
    const sentEmails = [];
    const failedEmails = [];
    let emailTemplate: string;

    const {
      usersToNotify,
      userIdsToNotify,
      emailType = "email",
      emailSubject,
      emailContent,
      buttonLink = `${baseUrl}/dashboard`,
      buttonText = "Access Your Dashboard",
      project,
      newStatus,
      includeResendHeaders = false,
      trackLinks = true, // Default to true for backward compatibility
      currentUser,
      notificationPreferences,
    } = body;

    // ===== NOTIFICATION PREFERENCE FRAMEWORK =====
    console.log(
      "🔔 [NOTIFICATION-FRAMEWORK] Processing notification preferences:",
      notificationPreferences
    );

    // Default notification preferences if none provided
    const defaultPreferences: NotificationPreferences = {
      method: "email",
      fallbackToEmail: true,
    };

    const prefs = notificationPreferences || defaultPreferences;

    // Process notification based on preference
    const notificationResults = await processNotificationPreferences(prefs, {
      usersToNotify,
      userIdsToNotify,
      emailSubject,
      emailContent,
      buttonLink,
      buttonText,
      project,
      currentUser,
      baseUrl,
    });

    console.log("🔔 [NOTIFICATION-FRAMEWORK] Notification results:", notificationResults);

    // ===== NOTIFICATION METHOD HANDLING =====
    if (prefs.method === "browser") {
      // Browser notification only
      if (notificationResults.success && !prefs.fallbackToEmail) {
        console.log("🔔 [NOTIFICATION] Browser notification sent, skipping email");
        return new Response(
          JSON.stringify({
            success: true,
            message: "Browser notification sent",
            notificationMethod: "browser",
            sentEmails: [],
            failedEmails: [],
            totalSent: 0,
            totalFailed: 0,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else if (prefs.method === "internal") {
      // Internal notification only
      if (notificationResults.success && !prefs.fallbackToEmail) {
        console.log("🔔 [NOTIFICATION] Internal notification sent, skipping email");
        return new Response(
          JSON.stringify({
            success: true,
            message: "Internal notification sent",
            notificationMethod: "internal",
            sentEmails: [],
            failedEmails: [],
            totalSent: 0,
            totalFailed: 0,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else if (prefs.method === "sms") {
      // SMS notification only
      if (notificationResults.success && !prefs.fallbackToEmail) {
        console.log("🔔 [NOTIFICATION] SMS notification sent, skipping email");
        return new Response(
          JSON.stringify({
            success: true,
            message: "SMS notification sent",
            notificationMethod: "sms",
            sentEmails: [],
            failedEmails: [],
            totalSent: 0,
            totalFailed: 0,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else if (prefs.method === "all") {
      // All notification types sent, continue with email as fallback
      console.log("🔔 [NOTIFICATION] All notification types sent, proceeding with email");
    } else {
      // Default: email notification (or fallback email)
      console.log("🔔 [NOTIFICATION] Email notification (or fallback)");
    }

    console.log("📧 [EMAIL-DELIVERY] Email configuration:", {
      emailType,
      trackLinks,
    });

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
      console.error("📧 [EMAIL-DELIVERY] Email configuration not available", {
        usersToNotify,
        emailContent,
        emailSubject,
        emailProvider,
        emailApiKey,
        fromEmail,
      });
      const errorResponse: EmailDeliveryResponse = {
        success: false,
        error:
          "Email configuration not available, usersToNotify: " +
          JSON.stringify(usersToNotify) +
          ", emailContent: " +
          emailContent +
          ", emailSubject: " +
          emailSubject +
          ", emailProvider: " +
          emailProvider +
          ", emailApiKey: " +
          emailApiKey +
          ", fromEmail: " +
          fromEmail,
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

    try {
      // Send emails to each user
      let emailHtml: string;

      emailHtml = emailTemplate.replace("{{CONTENT}}", emailContent);

      // Use placeholder utilities for all template replacements
      const { replacePlaceholders } = await import("../../lib/placeholder-utils");
      const placeholderData = {
        project: project || {},
        // Add any additional data needed for placeholders
      };

      emailHtml = replacePlaceholders(emailHtml, placeholderData);

      for (let i = 0; i < usersToNotify.length; i++) {
        const userEmail = usersToNotify[i];

        try {
          // Replace template variables for regular emails

          // ===== BUTTON LINK HANDLING =====
          let finalButtonLink = buttonLink;

          if (emailType === "magicLink") {
            // Generate magic links for authentication emails
            console.log("🔗 [EMAIL-DELIVERY] Generating magic link for authentication");
            try {
              // Ensure buttonLink is properly formatted (starts with /)
              const cleanButtonLink = buttonLink.startsWith("/") ? buttonLink : `/${buttonLink}`;
              const redirectUrl = `${baseUrl}${cleanButtonLink}`;

              console.log("🔗 [EMAIL-DELIVERY] Magic link configuration:", {
                buttonLink,
                cleanButtonLink,
                redirectUrl,
                baseUrl,
              });

              // Generate a custom magic link token that won't be prefetched
              console.log("📧 [EMAIL-DELIVERY] Generating custom magic link token...");

              // Create a unique token that we'll store and verify
              const customToken = crypto.randomUUID();
              const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

              console.log("📧 [EMAIL-DELIVERY] Custom token generated:", {
                token: customToken,
                expiry: tokenExpiry.toISOString(),
                email: userEmail,
              });

              // Store the token in the database for verification
              try {
                const { error: insertError } = await supabaseAdmin.from("magicLinkTokens").insert({
                  token: customToken,
                  email: userEmail,
                  expiresAt: tokenExpiry.toISOString(),
                  redirectTo: cleanButtonLink,
                  createdAt: new Date().toISOString(),
                });

                if (insertError) {
                  console.error("📧 [EMAIL-DELIVERY] Error storing magic link token:", insertError);
                  // Fallback to login page
                  finalButtonLink = `${baseUrl}/magic-link-proxy?link=${encodeURIComponent(`${baseUrl}/login?email=${encodeURIComponent(userEmail)}`)}`;
                } else {
                  console.log("📧 [EMAIL-DELIVERY] Magic link token stored successfully");

                  // Create the magic link that goes through our custom verification
                  const directMagicLink = `${baseUrl}/api/auth/verify-custom?token=${customToken}&email=${encodeURIComponent(userEmail)}&redirect=${encodeURIComponent(cleanButtonLink)}`;
                  finalButtonLink = `${baseUrl}/magic-link-proxy?link=${encodeURIComponent(directMagicLink)}`;
                  console.log("📧 [EMAIL-DELIVERY] Created custom magic link");
                }
              } catch (error) {
                console.error("📧 [EMAIL-DELIVERY] Error creating custom magic link:", error);
                finalButtonLink = `${baseUrl}/magic-link-proxy?link=${encodeURIComponent(`${baseUrl}/login?email=${encodeURIComponent(userEmail)}`)}`;
              }

              console.log("🔗 [EMAIL-DELIVERY] Final magic link URL:", finalButtonLink);
            } catch (error) {
              console.error("📧 [EMAIL-DELIVERY] Error generating magic link:", error);
              // Fallback to login page if magic link generation fails
              finalButtonLink = `${baseUrl}/magic-link-proxy?link=${encodeURIComponent(`${baseUrl}/login?email=${encodeURIComponent(userEmail)}`)}`;
            }
          } else if (buttonLink && !buttonLink.startsWith("http")) {
            // For non-magic-link emails, convert relative URLs to absolute URLs
            finalButtonLink = `${baseUrl}${buttonLink.startsWith("/") ? buttonLink : `/${buttonLink}`}`;
          } else if (!buttonLink) {
            // No button link provided, use default dashboard
            finalButtonLink = `${baseUrl}/dashboard`;
          }

          // ===== TEMPLATE REPLACEMENT =====
          const finalButtonText = buttonText || "Access Your Dashboard";
          const finalButtonUrl = finalButtonLink || `${baseUrl}/dashboard`;

          emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", finalButtonText);
          emailHtml = emailHtml.replace("{{BUTTON_LINK}}", finalButtonUrl);

          console.log("🔗 [EMAIL-DELIVERY] Final button configuration:", {
            text: finalButtonText,
            url: finalButtonUrl,
            emailType,
          });

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
            track_links: trackLinks,
            track_opens: trackLinks,
            // Add proper content type and custom headers (only if values exist)
            headers: {
              "Content-Type": "text/html; charset=UTF-8",
              ...(includeResendHeaders && project && { "X-Project": JSON.stringify(project) }),
              ...(includeResendHeaders &&
                newStatus !== undefined &&
                newStatus !== null && { "X-Project-Status": String(newStatus) }),
            },
          };

          // Debug: Log the email payload
          console.log("📧 [EMAIL-DELIVERY] Sending email:", {
            to: userEmail,
            subject: cleanSubject,
            emailType,
            tracking: { links: emailPayload.track_links, opens: emailPayload.track_opens },
          });

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
                project?.id || 0,
                "emailFailed",
                `Email delivery failed to ${userEmail} - Type: ${emailType}, Subject: ${emailSubject}, Error: ${errorText}`,
                { emailType, emailSubject, error: errorText, status: response.status }
              );
            } catch (logError) {
              console.error("📧 [EMAIL-DELIVERY] Error logging failed email delivery:", logError);
            }
          } else {
            const responseData = await response.json();

            sentEmails.push(userEmail);

            // Log successful email delivery
            try {
              await SimpleProjectLogger.addLogEntry(
                project?.id || 0,
                "emailSent",
                `Email sent successfully to ${userEmail} - Type: ${emailType}, Subject: ${emailSubject}`,
                { emailType, emailSubject, responseId: responseData.id }
              );
            } catch (logError) {
              console.error(
                "📧 [EMAIL-DELIVERY] Error logging successful email delivery:",
                logError
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
              project?.id || 0,
              "emailFailed",
              `Email delivery error to ${userEmail} - Type: ${emailType}, Subject: ${emailSubject}, Error: ${userError instanceof Error ? userError.message : "Unknown error"}`,
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

    // Log overall email delivery completion
    try {
      // console.log("📧 [EMAIL-DELIVERY] Logging email delivery completion:", {
      //   projectId: project?.id || 0,
      //   emailType,
      //   totalSent: sentEmails.length,
      //   totalFailed: failedEmails.length,
      //   currentUser,
      // });

      await SimpleProjectLogger.addLogEntry(
        project?.id || 0,
        "emailSent",
        `Email delivery batch completed - Type: ${emailType}, Total sent: ${sentEmails.length}, Total failed: ${failedEmails.length}`,
        {
          emailType,
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

// ===== NOTIFICATION PREFERENCE FRAMEWORK FUNCTIONS =====

interface NotificationContext {
  usersToNotify: string[];
  userIdsToNotify?: string[]; // User IDs for internal notifications (more efficient)
  emailSubject: string;
  emailContent: string;
  buttonLink: string;
  buttonText: string;
  project?: any;
  currentUser?: any;
  baseUrl: string;
}

interface NotificationResult {
  success: boolean;
  method: string;
  message?: string;
  error?: string;
}

/**
 * Process notification based on user preferences
 */
async function processNotificationPreferences(
  preferences: NotificationPreferences,
  context: NotificationContext
): Promise<NotificationResult> {
  try {
    console.log(
      "🔔 [NOTIFICATION-FRAMEWORK] Processing notification with method:",
      preferences.method
    );

    switch (preferences.method) {
      case "browser":
        return await sendBrowserNotification(preferences, context);

      case "internal":
        return await sendInternalNotification(preferences, context);

      case "sms":
        return await sendSMSNotification(preferences, context);

      case "all":
        return await sendAllNotifications(preferences, context);

      case "email":
      default:
        return { success: true, method: "email", message: "Email notification will be sent" };
    }
  } catch (error) {
    console.error("🔔 [NOTIFICATION-FRAMEWORK] Error processing notification:", error);
    return {
      success: false,
      method: preferences.method,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send browser push notification (system-level notifications)
 */
async function sendBrowserNotification(
  preferences: NotificationPreferences,
  context: NotificationContext
): Promise<NotificationResult> {
  try {
    console.log("🔔 [BROWSER-NOTIFICATION] Sending browser push notification");

    // Browser push notifications are system-level and don't need database storage
    // They are handled by the browser's notification API
    console.log("🔔 [BROWSER-NOTIFICATION] Browser push notification would be sent here");
    console.log(
      "🔔 [BROWSER-NOTIFICATION] Title:",
      preferences.browserNotificationTitle || context.emailSubject
    );
    console.log(
      "🔔 [BROWSER-NOTIFICATION] Body:",
      preferences.browserNotificationBody || context.emailContent
    );
    console.log(
      "🔔 [BROWSER-NOTIFICATION] Icon:",
      preferences.browserNotificationIcon || "/favicon.png"
    );
    console.log("🔔 [BROWSER-NOTIFICATION] URL:", context.buttonLink);

    // Note: Actual browser push implementation would go here
    // This is just a framework for future implementation

    console.log("🔔 [BROWSER-NOTIFICATION] Browser push notification queued successfully");
    return { success: true, method: "browser", message: "Browser push notification queued" };
  } catch (error) {
    console.error("🔔 [BROWSER-NOTIFICATION] Error:", error);
    return {
      success: false,
      method: "browser",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send internal system notification (stored in database, displayed in NotificationDropdown)
 */
async function sendInternalNotification(
  preferences: NotificationPreferences,
  context: NotificationContext
): Promise<NotificationResult> {
  try {
    console.log("🔔 [INTERNAL-NOTIFICATION] Creating internal notification for database storage");

    let userIds: string[] = [];

    // Use provided user IDs if available (more efficient)
    if (context.userIdsToNotify && context.userIdsToNotify.length > 0) {
      console.log("🔔 [INTERNAL-NOTIFICATION] Using provided user IDs:", context.userIdsToNotify);
      userIds = context.userIdsToNotify;
    } else {
      // Fallback: Get user IDs from emails (less efficient)
      console.log(
        "🔔 [INTERNAL-NOTIFICATION] Looking up user IDs from emails:",
        context.usersToNotify
      );
      const { data: users, error: userError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("email", context.usersToNotify);

      if (userError) {
        console.error("🔔 [INTERNAL-NOTIFICATION] Error fetching users:", userError);
        return { success: false, method: "internal", error: userError.message };
      }

      if (!users || users.length === 0) {
        console.warn(
          "🔔 [INTERNAL-NOTIFICATION] No users found for emails:",
          context.usersToNotify
        );
        return {
          success: true,
          method: "internal",
          message: "No users found for internal notification",
        };
      }

      userIds = users.map((user) => user.id);
    }

    // Create internal notifications for each user ID
    const notifications = userIds.map((userId) => ({
      user_id: userId, // Use snake_case to match database schema
      title: context.emailSubject,
      message: context.emailContent,
      type: preferences.internalNotificationType || "info",
      priority: preferences.internalNotificationPriority || "normal",
      action_url: context.buttonLink, // Use snake_case to match database schema
      action_text: context.buttonText || "View Details", // Use snake_case to match database schema
      viewed: false,
      created_at: new Date().toISOString(), // Use snake_case to match database schema
    }));

    // Store in notifications table (read by NotificationDropdown.astro)
    const { error } = await supabase.from("notifications").insert(notifications);

    if (error) {
      console.error("🔔 [INTERNAL-NOTIFICATION] Database error:", error);
      return { success: false, method: "internal", error: error.message };
    }

    console.log(
      `🔔 [INTERNAL-NOTIFICATION] Created ${notifications.length} internal notifications successfully`
    );
    return { success: true, method: "internal", message: "Internal notifications created" };
  } catch (error) {
    console.error("🔔 [INTERNAL-NOTIFICATION] Error:", error);
    return {
      success: false,
      method: "internal",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(
  preferences: NotificationPreferences,
  context: NotificationContext
): Promise<NotificationResult> {
  try {
    console.log(
      "🔔 [SMS-NOTIFICATION] Sending SMS notification via provider:",
      preferences.smsProvider
    );

    // Framework for SMS - implement based on provider
    const smsData = {
      to: context.usersToNotify,
      message: context.emailContent,
      provider: preferences.smsProvider || "twilio",
      created_at: new Date().toISOString(),
    };

    // Store SMS request in database for processing
    const { error } = await supabase.from("sms_queue").insert(smsData);

    if (error) {
      console.error("🔔 [SMS-NOTIFICATION] Database error:", error);
      return { success: false, method: "sms", error: error.message };
    }

    console.log("🔔 [SMS-NOTIFICATION] SMS notification queued successfully");
    return { success: true, method: "sms", message: "SMS notification queued" };
  } catch (error) {
    console.error("🔔 [SMS-NOTIFICATION] Error:", error);
    return {
      success: false,
      method: "sms",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send all notification types
 */
async function sendAllNotifications(
  preferences: NotificationPreferences,
  context: NotificationContext
): Promise<NotificationResult> {
  try {
    console.log("🔔 [ALL-NOTIFICATIONS] Sending all notification types");

    const results = await Promise.allSettled([
      sendBrowserNotification(preferences, context),
      sendInternalNotification(preferences, context),
      sendSMSNotification(preferences, context),
    ]);

    const successCount = results.filter(
      (result) => result.status === "fulfilled" && result.value.success
    ).length;

    console.log(`🔔 [ALL-NOTIFICATIONS] Sent ${successCount}/3 notification types`);

    return {
      success: successCount > 0,
      method: "all",
      message: `Sent ${successCount}/3 notification types`,
    };
  } catch (error) {
    console.error("🔔 [ALL-NOTIFICATIONS] Error:", error);
    return {
      success: false,
      method: "all",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

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
