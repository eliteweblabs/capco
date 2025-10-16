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
import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

// TypeScript interfaces for request data structure
interface EmailDeliveryRequest {
  usersToNotify?: string[]; // Email addresses
  rolesToNotify?: string[]; // Role names (Admin, Staff, Client)
  userIdsToNotify?: string[]; // User IDs for internal notifications (more efficient)
  selectedUsers?: any[]; // Full user objects from test page for SMS logic
  method: string;
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
  console.log("🔔 [UPDATE-DELIVERY] API endpoint called");
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

    // Debug: Log the entire request body
    console.log("📧 [EMAIL-DELIVERY] Full request body received:", JSON.stringify(body, null, 2));

    // Use the proper base URL function to avoid localhost in production
    const { getBaseUrl } = await import("../../../lib/url-utils");
    const baseUrl = getBaseUrl(request);

    // Debug: Log the base URL being used
    console.log("📧 [EMAIL-DELIVERY] Base URL:", baseUrl);
    const emailProvider = import.meta.env.EMAIL_PROVIDER;
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;
    const sentEmails = [];
    const failedEmails = [];
    let emailTemplate: string;

    const {
      usersToNotify = [],
      rolesToNotify = [],
      userIdsToNotify,
      selectedUsers,
      method = "email",
      emailSubject,
      emailContent,
      buttonLink = `${baseUrl}/dashboard`,
      buttonText = "Access Your Dashboard",
      project,
      newStatus,
      includeResendHeaders = false,
      trackLinks = true, // Default to true for backward compatibility
      currentUser,
    } = body;

    // Debug: Log the project object received
    console.log("📧 [EMAIL-DELIVERY] Project object received:", {
      project,
      projectId: project?.id,
      projectTitle: project?.title,
      projectAddress: project?.address,
    });

    // ===== RESOLVE ROLES TO EMAILS =====
    let roleEmails: string[] = [];

    if (rolesToNotify.length > 0) {
      console.log("🔔 [NOTIFICATION] Resolving roles to email addresses:", rolesToNotify);

      try {
        // Build query parameters for multiple roles
        const roleParams = rolesToNotify.map((role) => `role=${role}`).join("&");

        const roleResponse = await fetch(`${baseUrl}/api/users/get?${roleParams}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          const users = roleData.data || [];
          roleEmails = users.map((user: any) => user.email).filter(Boolean);
          console.log("🔔 [NOTIFICATION] Resolved roles to emails:", roleEmails);
        } else {
          console.error("🔔 [NOTIFICATION] Failed to resolve roles");
        }
      } catch (roleError) {
        console.error("🔔 [NOTIFICATION] Error resolving roles:", roleError);
      }
    }

    // Combine direct emails and role-resolved emails
    const resolvedUsersToNotify = [...usersToNotify, ...roleEmails];

    // ===== DIRECT METHOD HANDLING =====
    console.log("🔔 [NOTIFICATION] Processing method:", method);
    console.log("🔔 [NOTIFICATION] Full request body:", JSON.stringify(body, null, 2));

    // Handle internal notifications directly
    if (method === "internal") {
      console.log("🔔 [NOTIFICATION] Creating internal notifications only");

      // Get user IDs from emails if not provided
      let userIds = userIdsToNotify || [];
      if (userIds.length === 0) {
        const { data: users, error: userError } = await supabase
          .from("profiles")
          .select("id, email")
          .in("email", resolvedUsersToNotify);

        if (userError) {
          console.error("🔔 [INTERNAL-NOTIFICATION] Error fetching users:", userError);
          return new Response(
            JSON.stringify({
              success: false,
              error: "Failed to fetch user IDs for internal notifications",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        userIds = users?.map((user) => user.id) || [];
      }

      // Create internal notifications
      const notifications = userIds.map((userId) => ({
        userId: userId,
        title: emailSubject,
        message: emailContent,
        type: "info",
        priority: "normal",
        actionUrl: buttonLink,
        actionText: buttonText,
        viewed: false,
        createdAt: new Date().toISOString(),
      }));

      const { error } = await supabase.from("notifications").insert(notifications);

      if (error) {
        console.error("🔔 [INTERNAL-NOTIFICATION] Database error:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to create internal notifications",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log("🔔 [INTERNAL-NOTIFICATION] Created internal notifications successfully");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Internal notifications created",
          notificationMethod: "internal",
          sentEmails: [],
          failedEmails: [],
          totalSent: 0,
          totalFailed: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Simple validation
    if (
      !resolvedUsersToNotify ||
      !emailContent ||
      !emailSubject ||
      !emailProvider ||
      !emailApiKey ||
      !fromEmail
    ) {
      console.error("📧 [EMAIL-DELIVERY] Email configuration not available");
      console.error("📧 [EMAIL-DELIVERY] Email configuration not available", {
        resolvedUsersToNotify,
        emailContent,
        emailSubject,
        emailProvider,
        emailApiKey,
        fromEmail,
      });
      const errorResponse: EmailDeliveryResponse = {
        success: false,
        error:
          "Email configuration not available, resolvedUsersToNotify: " +
          JSON.stringify(resolvedUsersToNotify) +
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
      const { replacePlaceholders } = await import("../../../lib/placeholder-utils");
      const placeholderData = {
        project: project || {},
        // Add any additional data needed for placeholders
      };

      emailHtml = replacePlaceholders(emailHtml, placeholderData);

      // Apply SMS email logic if selectedUsers are provided (from test page)
      let finalUsersToNotify = resolvedUsersToNotify;
      console.log("📱 [EMAIL-DELIVERY] Checking for selectedUsers:", {
        hasSelectedUsers: !!selectedUsers,
        selectedUsersLength: selectedUsers?.length || 0,
        selectedUsers: selectedUsers,
      });

      if (selectedUsers && selectedUsers.length > 0) {
        console.log("📱 [EMAIL-DELIVERY] Applying SMS email logic from selectedUsers");

        // Import SMS utilities for carrier conversion
        const { SMS_UTILS } = await import("../../../lib/sms-utils");

        finalUsersToNotify = selectedUsers.map((user) => {
          console.log(`📱 [EMAIL-DELIVERY] Processing user ${user.name}:`, {
            smsAlerts: user.smsAlerts,
            mobileCarrier: user.mobileCarrier,
            phone: user.phone,
            hasSmsSetup: user.smsAlerts && user.mobileCarrier && user.phone,
          });

          if (user.smsAlerts && user.mobileCarrier && user.phone) {
            let smsEmail;

            // Check if mobileCarrier is already a gateway domain (starts with @)
            if (user.mobileCarrier.startsWith("@")) {
              // It's already a gateway domain, use it directly
              smsEmail = `${user.phone}${user.mobileCarrier}`;
              console.log(
                `📱 [EMAIL-DELIVERY] Using existing gateway for ${user.name}: ${smsEmail}`
              );
            } else {
              // It's a carrier ID, convert to gateway domain
              const carrierInfo = SMS_UTILS.getCarrierInfo(user.mobileCarrier);
              if (carrierInfo) {
                smsEmail = `${user.phone}@${carrierInfo.gateway}`;
                console.log(
                  `📱 [EMAIL-DELIVERY] Converting carrier ID to gateway for ${user.name}: ${smsEmail}`
                );
              }
            }

            if (smsEmail) {
              return smsEmail;
            }
          }
          console.log(`📱 [EMAIL-DELIVERY] Using regular email for ${user.name}: ${user.email}`);
          return user.email; // Keep original email
        });

        console.log("📱 [EMAIL-DELIVERY] Final users to notify:", finalUsersToNotify);
      }

      for (let i = 0; i < finalUsersToNotify.length; i++) {
        const userEmail = finalUsersToNotify[i];

        try {
          // Replace template variables for regular emails

          // ===== BUTTON LINK HANDLING =====
          let finalButtonLink = buttonLink;

          if (method === "magicLink") {
            // Generate magic links for authentication emails
            console.log("🔗 [EMAIL-DELIVERY] Generating magic link for authentication");
            console.log("🔗 [EMAIL-DELIVERY] Magic link method detected:", {
              method,
              userEmail,
              buttonLink,
            });

            // Ensure buttonLink is properly formatted (starts with /)
            const cleanButtonLink = buttonLink.startsWith("/") ? buttonLink : `/${buttonLink}`;
            const redirectUrl = `${baseUrl}${cleanButtonLink}`;

            try {
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
                  // Fallback to regular URL
                  finalButtonLink = cleanButtonLink;
                } else {
                  console.log("📧 [EMAIL-DELIVERY] Magic link token stored successfully");

                  // Create the custom magic link that goes directly to verify-custom
                  finalButtonLink = `${baseUrl}/api/auth/verify-custom?token=${customToken}&email=${encodeURIComponent(userEmail)}&redirect=${encodeURIComponent(cleanButtonLink)}`;
                  console.log("📧 [EMAIL-DELIVERY] Created custom magic link:", {
                    finalButtonLink,
                    cleanButtonLink,
                    userEmail,
                    baseUrl,
                    customToken,
                  });
                }
              } catch (error) {
                console.error("📧 [EMAIL-DELIVERY] Error creating custom magic link:", error);
                finalButtonLink = cleanButtonLink;
              }

              console.log("🔗 [EMAIL-DELIVERY] Final magic link URL:", finalButtonLink);
            } catch (error) {
              console.error("📧 [EMAIL-DELIVERY] Error generating magic link:", error);
              // Fallback to regular URL if magic link generation fails
              finalButtonLink = cleanButtonLink;
              console.log(
                "🔗 [EMAIL-DELIVERY] Magic link generation failed, using fallback:",
                finalButtonLink
              );
            }
          } else if (buttonLink && !buttonLink.startsWith("http")) {
            // For non-magic-link emails, convert relative URLs to absolute URLs
            finalButtonLink = `${baseUrl}${buttonLink.startsWith("/") ? buttonLink : `/${buttonLink}`}`;
            console.log("🔗 [EMAIL-DELIVERY] Non-magic-link email, using regular URL:", {
              method,
              finalButtonLink,
              buttonLink,
            });
          } else if (!buttonLink) {
            // No button link provided, use default dashboard
            finalButtonLink = `${baseUrl}/dashboard`;
            console.log(
              "🔗 [EMAIL-DELIVERY] No button link provided, using default dashboard:",
              finalButtonLink
            );
          }

          // ===== TEMPLATE REPLACEMENT =====
          const finalButtonText = buttonText || "Access Your Dashboard";

          emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", finalButtonText);
          emailHtml = emailHtml.replace("{{BUTTON_LINK}}", finalButtonLink);

          console.log("🔗 [EMAIL-DELIVERY] Final button configuration:", {
            text: finalButtonText,
            url: finalButtonLink,
            method,
          });

          // // Validate from field
          const validFromName = fromName && fromName.trim() !== "" ? fromName.trim() : "CAPCo";
          const validFromEmail =
            fromEmail && fromEmail.trim() !== "" ? fromEmail.trim() : "noreply@capcofire.com";

          // Strip HTML from email subject line
          const cleanSubject = emailSubject.replace(/<[^>]*>/g, "").trim();

          // Check if this is an SMS email (contains @gateway domain)
          const isSmsEmail =
            userEmail.includes("@vtext.com") ||
            userEmail.includes("@txt.att.net") ||
            userEmail.includes("@messaging.sprintpcs.com") ||
            userEmail.includes("@tmomail.net") ||
            userEmail.includes("@myboostmobile.com") ||
            userEmail.includes("@vzwpix.com") ||
            userEmail.includes("@pm.sprint.com");

          // For SMS emails, use plain text only and optimize content
          let emailPayload;
          if (isSmsEmail) {
            console.log(`📱 [EMAIL-DELIVERY] SMS email detected: ${userEmail}`);

            // Create SMS-optimized content (no HTML, include link, better formatting)
            let smsContent = emailContent
              .replace(/<[^>]*>/g, " ") // Replace HTML tags with single space
              .replace(/\s+/g, " ") // Replace multiple spaces with single space
              .replace(/\n\s*\n/g, "\n") // Remove extra line breaks
              .trim();

            // Add the button link to SMS content
            if (buttonLink && buttonText) {
              smsContent += `\n\n${buttonText}: ${buttonLink}`;
            }

            // Limit to reasonable SMS length (320 chars for longer messages)
            if (smsContent.length > 320) {
              smsContent = smsContent.substring(0, 317) + "...";
            }

            // Create SMS-friendly subject (short and clear)
            const smsSubject = "Project Update";

            emailPayload = {
              from: `${validFromName} <${validFromEmail}>`,
              to: userEmail,
              subject: smsSubject,
              text: smsContent,
              // No HTML for SMS
              track_links: false, // Disable tracking for SMS
              track_opens: false,
              headers: {
                "X-SMS-Gateway": "true",
                "Content-Type": "text/plain; charset=UTF-8",
              },
            };
          } else {
            // Regular email with HTML template
            emailPayload = {
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
          }

          // Debug: Log the email payload
          console.log("📧 [EMAIL-DELIVERY] Sending email:", {
            to: userEmail,
            subject: isSmsEmail ? "CAPCo Update" : cleanSubject,
            method,
            isSmsEmail,
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
                project.id,
                "emailFailed",
                `Email delivery failed to ${userEmail} - Type: ${method}, Subject: ${emailSubject}, Error: ${errorText}`,
                { method, emailSubject, error: errorText, status: response.status }
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
                project.id,
                "emailSent",
                `Email sent successfully to ${userEmail} - Type: ${method}, Subject: ${emailSubject}`,
                { method, emailSubject, responseId: responseData.id }
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
            if (project?.id) {
              await SimpleProjectLogger.addLogEntry(
                project.id,
                "emailFailed",
                `Email delivery error to ${userEmail} - Type: ${method}, Subject: ${emailSubject}, Error: ${userError instanceof Error ? userError.message : "Unknown error"}`,
                {
                  method,
                  emailSubject,
                  error: userError instanceof Error ? userError.message : "Unknown error",
                }
              );
            } else {
              console.log("📧 [EMAIL-DELIVERY] Email delivery error (no project context):", {
                userEmail,
                method,
                emailSubject,
                error: userError instanceof Error ? userError.message : "Unknown error",
              });
            }
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
        totalFailed: resolvedUsersToNotify.length,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log overall email delivery completion
    try {
      console.log("📧 [EMAIL-DELIVERY] Logging email delivery completion:", {
        projectId: project?.id || 0,
        method,
        totalSent: sentEmails.length,
        totalFailed: failedEmails.length,
        currentUser,
      });

      if (project?.id) {
        console.log("📧 [EMAIL-DELIVERY] Logging email delivery to database:", {
          projectId: project.id,
          method,
          totalSent: sentEmails.length,
          totalFailed: failedEmails.length,
        });

        try {
          await SimpleProjectLogger.addLogEntry(
            project.id,
            "emailSent",
            `Email delivery batch completed - Type: ${method}, Total sent: ${sentEmails.length}, Total failed: ${failedEmails.length}`,
            {
              method,
              totalSent: sentEmails.length,
              totalFailed: failedEmails.length,
              sentEmails: sentEmails,
              failedEmails: failedEmails,
            }
          );
          console.log("📧 [EMAIL-DELIVERY] Successfully logged to database");
        } catch (logError) {
          console.error("📧 [EMAIL-DELIVERY] Failed to log to database:", logError);
        }
      } else {
        console.log("📧 [EMAIL-DELIVERY] Email delivery batch completed (no project context):", {
          method,
          totalSent: sentEmails.length,
          totalFailed: failedEmails.length,
          sentEmails: sentEmails,
          failedEmails: failedEmails,
        });
      }
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

interface NotificationPreferences {
  method: string;
  browserNotificationTitle?: string;
  browserNotificationBody?: string;
  browserNotificationIcon?: string;
  internalNotificationType?: string;
  internalNotificationPriority?: string;
  smsProvider?: string;
}

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

    // Log browser notification delivery
    try {
      if (context.project?.id) {
        await SimpleProjectLogger.addLogEntry(
          context.project.id,
          "browserNotificationSent",
          `Browser push notification sent - Title: ${preferences.browserNotificationTitle || context.emailSubject}`,
          {
            method: "browser",
            title: preferences.browserNotificationTitle || context.emailSubject,
            body: preferences.browserNotificationBody || context.emailContent,
            icon: preferences.browserNotificationIcon || "/favicon.png",
            url: context.buttonLink,
          }
        );
      } else {
        console.log("🔔 [BROWSER-NOTIFICATION] Browser notification sent (no project context):", {
          method: "browser",
          title: preferences.browserNotificationTitle || context.emailSubject,
          body: preferences.browserNotificationBody || context.emailContent,
          icon: preferences.browserNotificationIcon || "/favicon.png",
          url: context.buttonLink,
        });
      }
    } catch (logError) {
      console.error("🔔 [BROWSER-NOTIFICATION] Error logging browser notification:", logError);
    }

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
      if (!supabase) {
        console.error("🔔 [INTERNAL-NOTIFICATION] Supabase client not available");
        return { success: false, method: "internal", error: "Database not available" };
      }
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
      userId: userId, // Use camelCase to match database schema
      title: context.emailSubject,
      message: context.emailContent,
      type: preferences.internalNotificationType || "info",
      priority: preferences.internalNotificationPriority || "normal",
      actionUrl: context.buttonLink, // Use camelCase to match database schema
      actionText: context.buttonText || "View Details", // Use camelCase to match database schema
      viewed: false,
      createdAt: new Date().toISOString(), // Use camelCase to match database schema
    }));

    // Store in notifications table (read by NotificationDropdown.astro)
    if (!supabase) {
      console.error("🔔 [INTERNAL-NOTIFICATION] Supabase client not available for insert");
      return { success: false, method: "internal", error: "Database not available" };
    }
    const { error } = await supabase.from("notifications").insert(notifications);

    if (error) {
      console.error("🔔 [INTERNAL-NOTIFICATION] Database error:", error);
      return { success: false, method: "internal", error: error.message };
    }

    console.log(
      `🔔 [INTERNAL-NOTIFICATION] Created ${notifications.length} internal notifications successfully`
    );

    // Log internal notification delivery
    try {
      if (context.project?.id) {
        await SimpleProjectLogger.addLogEntry(
          context.project.id,
          "internalNotificationSent",
          `Internal notification sent to ${userIds.length} users - Title: ${context.emailSubject}`,
          {
            method: "internal",
            userIds: userIds,
            notificationCount: notifications.length,
            title: context.emailSubject,
            type: preferences.internalNotificationType || "info",
            priority: preferences.internalNotificationPriority || "normal",
          }
        );
      } else {
        console.log("🔔 [INTERNAL-NOTIFICATION] Internal notification sent (no project context):", {
          method: "internal",
          userIds: userIds,
          notificationCount: notifications.length,
          title: context.emailSubject,
          type: preferences.internalNotificationType || "info",
          priority: preferences.internalNotificationPriority || "normal",
        });
      }
    } catch (logError) {
      console.error("🔔 [INTERNAL-NOTIFICATION] Error logging internal notification:", logError);
    }

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
    if (!supabase) {
      console.error("🔔 [SMS-NOTIFICATION] Supabase client not available");
      return { success: false, method: "sms", error: "Database not available" };
    }
    const { error } = await supabase.from("sms_queue").insert(smsData);

    if (error) {
      console.error("🔔 [SMS-NOTIFICATION] Database error:", error);
      return { success: false, method: "sms", error: error.message };
    }

    console.log("🔔 [SMS-NOTIFICATION] SMS notification queued successfully");

    // Log SMS notification delivery
    try {
      if (context.project?.id) {
        await SimpleProjectLogger.addLogEntry(
          context.project.id,
          "smsNotificationSent",
          `SMS notification queued for ${context.usersToNotify.length} users - Provider: ${preferences.smsProvider || "twilio"}`,
          {
            method: "sms",
            users: context.usersToNotify,
            provider: preferences.smsProvider || "twilio",
            message: context.emailContent,
            queuedAt: new Date().toISOString(),
          }
        );
      } else {
        console.log("🔔 [SMS-NOTIFICATION] SMS notification queued (no project context):", {
          method: "sms",
          users: context.usersToNotify,
          provider: preferences.smsProvider || "twilio",
          message: context.emailContent,
          queuedAt: new Date().toISOString(),
        });
      }
    } catch (logError) {
      console.error("🔔 [SMS-NOTIFICATION] Error logging SMS notification:", logError);
    }

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

    // Log all notifications delivery
    try {
      if (context.project?.id) {
        await SimpleProjectLogger.addLogEntry(
          context.project.id,
          "allNotificationsSent",
          `All notification types sent - ${successCount}/3 successful - Title: ${context.emailSubject}`,
          {
            method: "all",
            successCount: successCount,
            totalTypes: 3,
            title: context.emailSubject,
            results: results.map((result, index) => ({
              type: ["browser", "internal", "sms"][index],
              success: result.status === "fulfilled" && result.value.success,
              error: result.status === "rejected" ? result.reason : null,
            })),
          }
        );
      } else {
        console.log("🔔 [ALL-NOTIFICATIONS] All notification types sent (no project context):", {
          method: "all",
          successCount: successCount,
          totalTypes: 3,
          title: context.emailSubject,
          results: results.map((result, index) => ({
            type: ["browser", "internal", "sms"][index],
            success: result.status === "fulfilled" && result.value.success,
            error: result.status === "rejected" ? result.reason : null,
          })),
        });
      }
    } catch (logError) {
      console.error("🔔 [ALL-NOTIFICATIONS] Error logging all notifications:", logError);
    }

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
