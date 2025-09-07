import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("📧 little bit bigger API endpoint called");
  console.log("📧 [EMAIL-DELIVERY] ==========================================");
  console.log("📧 [EMAIL-DELIVERY] Timestamp:", new Date().toISOString());
  console.log("📧 [EMAIL-DELIVERY] Request method:", request.method);
  console.log("📧 [EMAIL-DELIVERY] Request URL:", request.url);

  // Log to file for debugging
  const fs = await import("fs");
  const logEntry = `[${new Date().toISOString()}] EMAIL-DELIVERY API called\n`;
  fs.appendFileSync("/tmp/astro-email.log", logEntry);

  try {
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
    console.log("📧 [EMAIL-DELIVERY] Request body:", JSON.stringify(body, null, 2));

    // emailType: "client_comment",
    // usersToNotify: usersToNotify,
    // emailSubject: subjectLine,
    // emailContent: message.trim(),
    // buttonText: button_text,
    // buttonLink: button_link,

    const { usersToNotify, emailType, emailSubject, emailContent, buttonLink, buttonText } = body;

    console.log("📧 [EMAIL-DELIVERY] Parameter validation:");

    console.log("  - emailType:", emailType);
    console.log("  - usersToNotify count:", usersToNotify?.length || 0);

    // Determine email type flags
    // const isRegistrationEmail = emailType === "registration";
    // const isStaffAssignmentEmail = emailType === "staff_assignment";
    // const isStatusUpdateEmail = emailType === "update_status";
    // const isClientCommentEmail = emailType === "client_comment";
    // const isEmergencySmsEmail = emailType === "emergency_sms";
    // const isTestEmail = emailType === "test";

    console.log("📧 [EMAIL-DELIVERY] Email type:", emailType);

    // Simple validation - just need projectId and usersToNotify
    if (!usersToNotify) {
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
    console.log("📧 [EMAIL-DELIVERY] Resolving users to notify:", usersToNotify);
    // const resolvedUsers = [];

    // Get environment variables for email
    const emailProvider = import.meta.env.EMAIL_PROVIDER;
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;

    console.log("📧 [EMAIL-DELIVERY] Environment variables:");
    console.log("  - EMAIL_PROVIDER:", emailProvider ? "Set" : "Missing");
    console.log("  - EMAIL_API_KEY:", emailApiKey ? "Set" : "Missing");
    console.log("  - FROM_EMAIL:", fromEmail);
    console.log("  - FROM_NAME:", fromName);

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
    console.log("📧 [EMAIL-DELIVERY] Reading email template...");

    let emailTemplate: string;
    try {
      const templatePath = join(process.cwd(), "src", "templates-email", "template.html");
      console.log("📧 [EMAIL-DELIVERY] Template path:", templatePath);

      emailTemplate = readFileSync(templatePath, "utf-8");
      console.log("📧 [EMAIL-DELIVERY] Email template loaded, length:", emailTemplate.length);

      if (!emailTemplate || emailTemplate.length === 0) {
        throw new Error("Email template is empty");
      }
    } catch (templateError) {
      console.error("📧 [EMAIL-DELIVERY] Template loading error:", templateError);
      throw templateError;
    }

    const sentEmails = [];
    const failedEmails = [];

    // Send emails to each user
    for (let i = 0; i < usersToNotify.length; i++) {
      const userEmail = usersToNotify[i];

      try {
        // // Replace template variables
        let emailHtml = emailTemplate.replace("{{CONTENT}}", emailContent);

        // Apply button configuration
        if (buttonText && buttonLink) {
          emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", buttonText);
          emailHtml = emailHtml.replace("{{BUTTON_LINK}}", buttonLink);
        } else {
          // Remove button section entirely
          emailHtml = emailHtml.replace(
            /<!-- Call to Action Button -->[\s\S]*?<!-- \/Call to Action Button -->/g,
            ""
          );
          emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", "");
          emailHtml = emailHtml.replace("{{BUTTON_LINK}}", "");
        }

        // // Send email via Resend

        // // Validate from field
        const validFromName = fromName && fromName.trim() !== "" ? fromName.trim() : "CAPCo";
        const validFromEmail =
          fromEmail && fromEmail.trim() !== "" ? fromEmail.trim() : "noreply@capcofire.com";

        // // Email subject was already set in the consolidated configuration above

        const emailPayload = {
          from: `${validFromName} <${validFromEmail}>`,
          to: userEmail,
          subject: emailSubject,
          html: emailHtml,
          text: emailContent,
          // Add proper content type and custom headers (only if values exist)
          headers: {
            "Content-Type": "text/html; charset=UTF-8",
            // ...(projectId && { "X-Project-ID": projectId }),
            // ...(newStatus !== null &&
            //   newStatus !== undefined && { "X-Project-Status": newStatus.toString() }),
            // ...(user.email && { "X-User-Email": user.email }),
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
          failedEmails.push({ email: userEmail, error: errorText });
        } else {
          const responseData = await response.json();
          console.log(`📧 [EMAIL-DELIVERY] Email sent successfully to ${userEmail}:`, responseData);
          sentEmails.push(userEmail);
        }
      } catch (userError) {
        console.error(`📧 [EMAIL-DELIVERY] Error sending notification to ${userEmail}:`, userError);
        failedEmails.push({
          email: userEmail,
          error: userError instanceof Error ? userError.message : "Unknown error",
        });
      }
    }

    console.log("📧 [EMAIL-DELIVERY] Email delivery completed:");
    console.log("  - Sent emails:", sentEmails);
    console.log("  - Failed emails:", failedEmails);
    console.log("  - Total sent:", sentEmails.length);
    console.log("  - Total failed:", failedEmails.length);

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
