// do not change this page is formatting whatsoever
// if the email doesn't send change the formatting of the data that's being sent to this API

import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

// TypeScript interfaces for request data structure
interface EmailDeliveryRequest {
  usersToNotify: string[];
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
      emailSubject,
      emailContent,
      buttonLink,
      buttonText,
      project,
      currentUser,
      baseUrl,
    });

    console.log("🔔 [NOTIFICATION-FRAMEWORK] Notification results:", notificationResults);

    // If notification was sent via non-email method and fallback is disabled, skip email
    if (notificationResults.success && !prefs.fallbackToEmail && prefs.method !== "email") {
      console.log(
        "🔔 [NOTIFICATION-FRAMEWORK] Non-email notification sent, skipping email delivery"
      );
      return new Response(
        JSON.stringify({
          success: true,
          message: `Notification sent via ${prefs.method}`,
          notificationMethod: prefs.method,
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

          // Override buttonLink with magic link for authentication
          let finalButtonLink = buttonLink;

          // Generate magic links for authentication emails OR status updates with project URLs
          const shouldGenerateMagicLink = emailType === "magicLink";
          console.log("🔗 [EMAIL-DELIVERY] Should generate magic link:", shouldGenerateMagicLink);

          if (shouldGenerateMagicLink) {
            try {
              // Use the verify endpoint with redirect parameter
              // Ensure buttonLink is properly formatted (starts with /)
              const cleanButtonLink = buttonLink.startsWith("/") ? buttonLink : `/${buttonLink}`;
              const verifyUrl = `${baseUrl}/api/auth/verify?redirect=${encodeURIComponent(cleanButtonLink)}`;

              console.log("🔗 [EMAIL-DELIVERY] Magic link configuration:", {
                buttonLink,
                cleanButtonLink,
                verifyUrl,
                baseUrl,
              });

              const { data: magicLinkData, error: magicLinkError } =
                await supabaseAdmin.auth.admin.generateLink({
                  type: "magiclink",
                  email: userEmail,
                  options: {
                    redirectTo: verifyUrl,
                  },
                });

              if (magicLinkError) {
                console.error("📧 [EMAIL-DELIVERY] Error generating magic link:", magicLinkError);
                console.error("📧 [EMAIL-DELIVERY] Magic link error details:", {
                  message: magicLinkError.message,
                  status: magicLinkError.status,
                  code: magicLinkError.code,
                });
              } else {
                // Use proxy page to prevent email client prefetching
                const magicLinkUrl = magicLinkData.properties.action_link;

                // Don't double-encode the URL - just pass it as a query parameter
                const proxyUrl = `${baseUrl}/magic-link-proxy?link=${magicLinkUrl}`;
                finalButtonLink = proxyUrl;

                console.log("🔗 [EMAIL-DELIVERY] Generated magic link successfully");
                console.log("🔗 [EMAIL-DELIVERY] Original magic link URL:", magicLinkUrl);
                console.log("🔗 [EMAIL-DELIVERY] Proxy URL:", proxyUrl);
                console.log("🔗 [EMAIL-DELIVERY] Magic link properties:", magicLinkData.properties);
              }
            } catch (error) {
              console.error("📧 [EMAIL-DELIVERY] Error generating magic link:", error);
            }
          } else if (buttonLink && !buttonLink.startsWith("http")) {
            // For non-magic-link emails, convert relative URLs to absolute URLs
            finalButtonLink = `${baseUrl}${buttonLink.startsWith("/") ? buttonLink : `/${buttonLink}`}`;
          }
          // } else if (buttonLink && !buttonLink.startsWith("http")) {
          // For non-magic-link emails, convert relative URLs to absolute URLs
          //   finalButtonLink = `${baseUrl}${buttonLink.startsWith("/") ? buttonLink : `/${buttonLink}`}`;
          // }

          if (buttonText && finalButtonLink) {
            emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", buttonText);
            emailHtml = emailHtml.replace("{{BUTTON_LINK}}", finalButtonLink);
          } else if (!buttonText && finalButtonLink) {
            emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", "Access Your Dashboard");
            emailHtml = emailHtml.replace("{{BUTTON_LINK}}", finalButtonLink);
          } else if (buttonText && !finalButtonLink) {
            emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", buttonText);
            emailHtml = emailHtml.replace("{{BUTTON_LINK}}", `${baseUrl}/dashboard`);
          } else if (!buttonText && !finalButtonLink) {
            emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", "Access Your Dashboard");
            emailHtml = emailHtml.replace("{{BUTTON_LINK}}", `${baseUrl}/dashboard`);
          }

          console.log("🔗 [EMAIL-DELIVERY] Email HTML:", emailHtml);
          console.log("🔗 [EMAIL-DELIVERY] Email finalButtonLink:", finalButtonLink);

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
          console.log("📧 [EMAIL-DELIVERY] Email payload:", {
            emailType,
            track_links: emailPayload.track_links,
            track_opens: emailPayload.track_opens,
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
 * Send browser push notification
 */
async function sendBrowserNotification(
  preferences: NotificationPreferences,
  context: NotificationContext
): Promise<NotificationResult> {
  try {
    console.log("🔔 [BROWSER-NOTIFICATION] Sending browser notification");

    // Store notification in database for client-side retrieval
    const notificationData = {
      title: preferences.browserNotificationTitle || context.emailSubject,
      body: preferences.browserNotificationBody || context.emailContent,
      icon: preferences.browserNotificationIcon || "/favicon.png",
      url: context.buttonLink,
      users: context.usersToNotify,
      type: "browser_push",
      created_at: new Date().toISOString(),
    };

    // Store in database for client-side polling
    const { error } = await supabase.from("notifications").insert(notificationData);

    if (error) {
      console.error("🔔 [BROWSER-NOTIFICATION] Database error:", error);
      return { success: false, method: "browser", error: error.message };
    }

    console.log("🔔 [BROWSER-NOTIFICATION] Browser notification queued successfully");
    return { success: true, method: "browser", message: "Browser notification queued" };
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
 * Send internal system notification
 */
async function sendInternalNotification(
  preferences: NotificationPreferences,
  context: NotificationContext
): Promise<NotificationResult> {
  try {
    console.log("🔔 [INTERNAL-NOTIFICATION] Sending internal notification");

    const notificationData = {
      title: context.emailSubject,
      content: context.emailContent,
      type: preferences.internalNotificationType || "status_update",
      users: context.usersToNotify,
      project_id: context.project?.id || null,
      created_at: new Date().toISOString(),
    };

    // Store in internal notifications table
    const { error } = await supabase.from("internal_notifications").insert(notificationData);

    if (error) {
      console.error("🔔 [INTERNAL-NOTIFICATION] Database error:", error);
      return { success: false, method: "internal", error: error.message };
    }

    console.log("🔔 [INTERNAL-NOTIFICATION] Internal notification created successfully");
    return { success: true, method: "internal", message: "Internal notification created" };
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
