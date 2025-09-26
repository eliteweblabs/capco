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
  projectId?: number;
  newStatus?: number;
  authorId?: string;
  includeResendHeaders?: boolean;
  trackLinks?: boolean;
  currentUser?: any;
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
      currentUser,
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
    // if (shouldDisableTracking) {
    //   console.log("📧 [EMAIL-DELIVERY] Click tracking disabled for email type:", emailType);
    // } else {
    //   console.log("📧 [EMAIL-DELIVERY] Click tracking enabled for email type:", emailType);
    // }

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
                "email_failed",
                currentUser,
                `Email delivery failed to ${userEmail} - Type: ${emailType}, Subject: ${emailSubject}, Error: ${errorText}`,
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
                "email_sent",
                currentUser,
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
              projectId || 0,
              "email_failed",
              currentUser,
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

    // console.log("📧 [EMAIL-DELIVERY] Email delivery completed:");
    // console.log("  - Sent emails:", sentEmails);
    // console.log("  - Failed emails:", failedEmails);
    // console.log("  - Total sent:", sentEmails.length);
    // console.log("  - Total failed:", failedEmails.length);

    // projectId: number,
    // action: string,
    // user: any,
    // details: string,
    // oldValue?: any,
    // newValue?: any
    // Log overall email delivery completion
    try {
      await SimpleProjectLogger.addLogEntry(
        projectId || 0,
        "email_sent",
        currentUser,
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
