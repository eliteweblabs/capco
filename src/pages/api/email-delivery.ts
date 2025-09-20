// do not change this page is formatting whatsoever
// if the email doesn't send change the formatting of the data that's being sent to this API

import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { replacePlaceholders, type PlaceholderData } from "../../lib/placeholder-utils";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted

export const POST: APIRoute = async ({ request, cookies }) => {
  // console.log("📧 little bit bigger API endpoint called");
  // console.log("📧 [EMAIL-DELIVERY] ==========================================");
  // console.log("📧 [EMAIL-DELIVERY] Timestamp:", new Date().toISOString());
  // console.log("📧 [EMAIL-DELIVERY] Request method:", request.method);
  // console.log("📧 [EMAIL-DELIVERY] Request URL:", request.url);

  // Log to file for debugging
  const fs = await import("fs");
  const logEntry = `[${new Date().toISOString()}] EMAIL-DELIVERY API called\n`;
  fs.appendFileSync("/tmp/astro-email.log", logEntry);

  try {
    // console.log("📧 [EMAIL-DELIVERY] Starting email delivery process");

    if (!supabase || !supabaseAdmin) {
      console.error("📧 [EMAIL-DELIVERY] Database clients not available");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    // console.log("📧 [EMAIL-DELIVERY] Request body:", JSON.stringify(body, null, 2));

    // emailType: "client_comment",
    // usersToNotify: usersToNotify,
    // emailSubject: subjectLine,
    // emailContent: message.trim(),
    // buttonText: button_text,
    // buttonLink: button_link,

    // Use the proper base URL function to avoid localhost in production
    const { getBaseUrl } = await import("../../lib/url-utils");
    const baseUrl = getBaseUrl(request);

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
    } = body;

    // console.log("📧 [EMAIL-DELIVERY] Parameter validation:");
    // console.log("  - emailType:", emailType);
    // console.log("  - usersToNotify count:", usersToNotify?.length || 0);
    // console.log("📧 [EMAIL-DELIVERY] Email type:", emailType);

    // Simple validation - just need projectId and usersToNotify
    if (!usersToNotify || !emailContent || !emailSubject) {
      console.error("📧 [EMAIL-DELIVERY] Missing required parameters");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameters",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Resolve users to notify - convert role/id references to actual user objects with emails
    // console.log("📧 [EMAIL-DELIVERY] Resolving users to notify:", usersToNotify);
    // const resolvedUsers = [];

    // Get environment variables for email
    const emailProvider = import.meta.env.EMAIL_PROVIDER;
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;

    // console.log("📧 [EMAIL-DELIVERY] Environment variables:");
    // console.log("  - EMAIL_PROVIDER:", emailProvider ? "Set" : "Missing");
    // console.log("  - EMAIL_API_KEY:", emailApiKey ? "Set" : "Missing");
    // console.log("  - FROM_EMAIL:", fromEmail);
    // console.log("  - FROM_NAME:", fromName);

    if (!emailProvider || !emailApiKey || !fromEmail) {
      console.error("📧 [EMAIL-DELIVERY] Email configuration not available");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email configuration not available",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Read email template
    // console.log("📧 [EMAIL-DELIVERY] Reading email template...");

    let emailTemplate: string;
    try {
      const templatePath = join(process.cwd(), "src", "templates-email", "template.html");
      // console.log("📧 [EMAIL-DELIVERY] Template path:", templatePath);

      emailTemplate = readFileSync(templatePath, "utf-8");
      // console.log("📧 [EMAIL-DELIVERY] Email template loaded, length:", emailTemplate.length);

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

    // console.log("📧 [EMAIL-DELIVERY] About to send emails to:", usersToNotify.length, "recipients");
    // console.log("📧 [EMAIL-DELIVERY] Recipients:", usersToNotify);

    try {
      // Send emails to each user
      for (let i = 0; i < usersToNotify.length; i++) {
        const userEmail = usersToNotify[i];
        // console.log(
        //   `📧 [EMAIL-DELIVERY] Processing email ${i + 1}/${usersToNotify.length}: ${userEmail}`
        // );

        // Check if this is an SMS gateway email
        const isSmsGateway =
          userEmail.includes("@vtext.com") ||
          userEmail.includes("@txt.att.net") ||
          userEmail.includes("@messaging.sprintpcs.com") ||
          userEmail.includes("@tmomail.net") ||
          userEmail.includes("@smsmyboostmobile.com") ||
          userEmail.includes("@sms.cricketwireless.net");

        // console.log(`📧 [EMAIL-DELIVERY] Is SMS gateway: ${isSmsGateway} for ${userEmail}`);

        let emailHtml: string;
        try {
          // For SMS gateways, skip HTML template processing
          if (isSmsGateway) {
            emailHtml = ""; // No HTML needed for SMS gateways
          } else {
            // Replace template variables for regular emails
            emailHtml = emailTemplate.replace("{{CONTENT}}", emailContent);

            // Replace brand/design placeholders using centralized system
            const placeholderData: PlaceholderData = {
              primaryColor: "#825bdd",
              svgLogo: `<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" width="100" version="1.1" viewBox="0 0 400 143.7" class="h-auto"> <defs> <style>
        .fill {
          fill: black;
        }
      </style> </defs> <g> <path class="fill" d="M0 0h400v143.7H0z"/> <text x="200" y="80" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">CAPCo</text> </g> </svg>`,
            };

            emailHtml = replacePlaceholders(emailHtml, placeholderData);
          }

          // Override buttonLink with magic link for authentication
          let finalButtonLink = buttonLink;

          if (buttonLink && buttonLink.includes("/dashboard") && !isSmsGateway) {
            try {
              const { data: magicLinkData, error: magicLinkError } =
                await supabaseAdmin.auth.admin.generateLink({
                  type: "magiclink",
                  email: userEmail,
                  options: {
                    redirectTo: `${baseUrl}${buttonLink}`,
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
          } else if (isSmsGateway) {
            // console.log(
            //   "📧 [EMAIL-DELIVERY] Skipping magic link generation for SMS gateway:",
            //   userEmail
            // );
          }

          // Apply button configuration (skip for SMS gateways)
          // console.log("🔍 [EMAIL-DELIVERY] Button debug for", {
          //   buttonText,
          //   buttonLink,
          //   finalButtonLink,
          //   isSmsGateway,
          //   hasButton: !!(buttonText && finalButtonLink),
          // });

          if (!isSmsGateway) {
            if (buttonText && finalButtonLink) {
              emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", buttonText);
              emailHtml = emailHtml.replace("{{BUTTON_LINK}}", finalButtonLink);
            } else {
              // Remove button section entirely
              emailHtml = emailHtml.replace(
                /<!-- Call to Action Button -->[\s\S]*?<!-- \/Call to Action Button -->/g,
                ""
              );
              emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", "");
              emailHtml = emailHtml.replace("{{BUTTON_LINK}}", "");
            }
          }

          // // Validate from field
          const validFromName = fromName && fromName.trim() !== "" ? fromName.trim() : "CAPCo";
          const validFromEmail =
            fromEmail && fromEmail.trim() !== "" ? fromEmail.trim() : "noreply@capcofire.com";

          // Strip HTML from email subject line
          const cleanSubject = emailSubject.replace(/<[^>]*>/g, "").trim();

          // For SMS gateways, send only plain text (no HTML)
          const emailPayload = isSmsGateway
            ? {
                from: `CAPCo Fire <noreply@capcofire.com>`, // Consistent verified sender
                to: userEmail,
                subject: "", // Empty subject for SMS gateways
                text: emailContent.substring(0, 160), // Limit to 160 characters for SMS
                headers: {
                  "X-SMS-Gateway": "true",
                  "Content-Type": "text/plain; charset=UTF-8",
                },
              }
            : {
                from: `${validFromName} <${validFromEmail}>`,
                to: userEmail,
                subject: cleanSubject,
                html: emailHtml,
                text: emailContent,
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

          // Debug logging for SMS gateways
          if (isSmsGateway) {
            // console.log("📧 [EMAIL-DELIVERY] Sending SMS gateway email:", {
            //   to: userEmail,
            //   subject: cleanSubject,
            //   contentLength: emailContent.length,
            //   payloadKeys: Object.keys(emailPayload),
            // });
          }

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
          } else {
            const responseData = await response.json();
            console.log(
              // `📧 [EMAIL-DELIVERY] Email sent successfully to ${userEmail}:`,
              responseData
            );
            sentEmails.push(userEmail);
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
            isSmsGateway,
          });
          failedEmails.push({
            email: userEmail,
            error: userError instanceof Error ? userError.message : "Unknown error",
          });
        }
      }
    } catch (emailSendingError) {
      console.error("📧 [EMAIL-DELIVERY] Error in email sending process:", emailSendingError);
      console.error("📧 [EMAIL-DELIVERY] Email sending error details:", {
        message: emailSendingError instanceof Error ? emailSendingError.message : "Unknown error",
        stack: emailSendingError instanceof Error ? emailSendingError.stack : undefined,
      });

      // If we have a critical error, return failure
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send email notifications",
          details: emailSendingError instanceof Error ? emailSendingError.message : "Unknown error",
          totalSent: 0,
          totalFailed: usersToNotify.length,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // console.log("📧 [EMAIL-DELIVERY] Email delivery completed:");
    // console.log("  - Sent emails:", sentEmails);
    // console.log("  - Failed emails:", failedEmails);
    // console.log("  - Total sent:", sentEmails.length);
    // console.log("  - Total failed:", failedEmails.length);

    return new Response(
      JSON.stringify({
        success: true,
        sentEmails,
        failedEmails,
        totalSent: sentEmails.length,
        totalFailed: failedEmails.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("📧 [EMAIL-DELIVERY] Top-level error:", error);
    console.error(
      "📧 [EMAIL-DELIVERY] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to send email notifications",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
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
