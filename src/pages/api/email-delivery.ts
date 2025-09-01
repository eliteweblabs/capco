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

    const { projectId, newStatus, usersToNotify, emailType, custom_subject, email_content } = body;

    console.log("📧 [EMAIL-DELIVERY] Parameter validation:");
    console.log("  - projectId:", projectId);
    console.log("  - newStatus:", newStatus);
    console.log("  - emailType:", emailType);
    console.log("  - usersToNotify count:", usersToNotify?.length || 0);

    // Determine email type flags
    const isRegistrationEmail = emailType === "registration";
    const isStaffAssignmentEmail = emailType === "staff_assignment";
    const isStatusUpdateEmail = emailType === "update_status";
    const skipProjectValidation = isRegistrationEmail || isStaffAssignmentEmail;
    console.log("📧 [EMAIL-DELIVERY] Email type:", emailType);

    if (!projectId || !usersToNotify) {
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

    // Only validate newStatus for emails that require project validation
    if (!skipProjectValidation && !newStatus) {
      console.error("📧 [EMAIL-DELIVERY] Missing newStatus for non-test email");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing newStatus parameter",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get status configuration from cached API
    let statusConfig = null;
    if (emailType === "update_status" && newStatus) {
      try {
        const baseUrl = import.meta.env.SITE_URL || "http://localhost:4321";
        const statusResponse = await fetch(`${baseUrl}/api/get-project-statuses`);

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          statusConfig = statusData.statuses[newStatus];

          if (!statusConfig) {
            console.error(
              "📧 [EMAIL-DELIVERY] Status configuration not found for status:",
              newStatus
            );
            return new Response(
              JSON.stringify({
                success: false,
                error: "Status configuration not found",
              }),
              {
                status: 404,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
        } else {
          console.error("📧 [EMAIL-DELIVERY] Failed to fetch project statuses");
          return new Response(
            JSON.stringify({
              success: false,
              error: "Failed to fetch project statuses",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } catch (error) {
        console.error("📧 [EMAIL-DELIVERY] Error fetching project statuses:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to fetch project statuses",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get project details from database (skip for registration emails)
    let projectDetails = null;
    if (!skipProjectValidation) {
      const { data: fetchedProjectDetails, error: projectError } = await supabase
        .from("projects")
        .select("title, address")
        .eq("id", projectId)
        .single();

      if (projectError || !fetchedProjectDetails) {
        console.error("📧 [EMAIL-DELIVERY] Failed to get project details:", projectError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Project not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      projectDetails = fetchedProjectDetails;
    } else {
      // Use project details from request body for registration emails
      projectDetails = body.projectDetails || { title: projectId, address: "Registration" };
    }

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
      const templatePath = join(process.cwd(), "src", "emails", "template.html");
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

    console.log("📧 [EMAIL-DELIVERY] Starting email delivery to", usersToNotify.length, "users");

    // Send emails to each user
    for (let i = 0; i < usersToNotify.length; i++) {
      const user = usersToNotify[i];
      console.log(
        `📧 [EMAIL-DELIVERY] Processing user: ${user.email} (${i + 1}/${usersToNotify.length})`
      );

      // Add delay between emails to avoid rate limiting (except for the first email)
      if (i > 0) {
        console.log(`📧 [EMAIL-DELIVERY] Waiting 1 second before sending next email...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      try {
        // Determine if this user should get a magic link button
        const isClient = usersToNotify.some((u: any) => u.email === user.email);
        const shouldShowButton = isClient; // Only show button for clients

        console.log(`📧 [EMAIL-DELIVERY] User analysis for ${user.email}:`);
        console.log("  - Is client:", isClient);
        console.log("  - Should show button:", shouldShowButton);

        // Use button_link from database
        const magicLink = statusConfig?.button_link || "";
        console.log(`📧 [EMAIL-DELIVERY] Using button_link from database: ${magicLink}`);

        // Prepare email content with line breaks for names
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
        const displayName = fullName || user.company_name || "Client";

        // Use the email content based on email type
        let emailContent;
        if (isRegistrationEmail) {
          // For registration emails, use content from request body
          emailContent = email_content || "Thank you for registering with CAPCo Fire Protection!";
        } else if (isStaffAssignmentEmail) {
          // For staff assignment emails, use content from request body
          emailContent =
            email_content ||
            "You have been assigned to a new project. Please review the project details and take appropriate action.";
        } else if (isStatusUpdateEmail) {
          // For status updates, use rigid content from database
          emailContent =
            statusConfig?.email_content ||
            "Your project status has been updated. Please check your project dashboard for more details.";
        } else {
          // Fallback for unknown email types
          emailContent = email_content || "You have a new notification.";
        }

        // Convert plain text to HTML with line breaks
        const htmlContent = emailContent
          .replace(/{{PROJECT_TITLE}}/g, projectDetails.title || "Project")
          .replace(/{{PROJECT_ADDRESS}}/g, projectDetails.address || "N/A")
          .replace(/{{ADDRESS}}/g, projectDetails.address || "N/A")
          .replace(/{{EST_TIME}}/g, statusConfig?.est_time || "2-3 business days")
          .replace(/{{CLIENT_NAME}}/g, displayName)
          .replace(/{{CLIENT_EMAIL}}/g, user.email)
          // Replace any remaining {{PLACEHOLDER}} with empty string
          .replace(/\{\{[^}]+\}\}/g, "")
          .replace(/\n/g, "<br>"); // Convert line breaks to HTML

        const personalizedContent = emailContent
          .replace(/{{PROJECT_TITLE}}/g, projectDetails.title || "Project")
          .replace(/{{PROJECT_ADDRESS}}/g, projectDetails.address || "N/A")
          .replace(/{{ADDRESS}}/g, projectDetails.address || "N/A")
          .replace(/{{EST_TIME}}/g, statusConfig?.est_time || "2-3 business days")
          .replace(/{{CLIENT_NAME}}/g, displayName)
          .replace(/{{CLIENT_EMAIL}}/g, user.email)
          // Replace any remaining {{PLACEHOLDER}} with empty string
          .replace(/\{\{[^}]+\}\}/g, "");

        // Replace template variables
        let emailHtml = emailTemplate.replace("{{CONTENT}}", htmlContent);

        // Handle button display logic based on email type
        if (isRegistrationEmail) {
          // For registration emails, use button_text and button_link from request body
          const hasRegistrationButton = body.button_text && body.button_text.trim() !== "";
          if (hasRegistrationButton) {
            emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", body.button_text.trim());
            emailHtml = emailHtml.replace("{{BUTTON_LINK}}", body.button_link || "#");
          } else {
            // Remove button for registration emails without button_text
            emailHtml = emailHtml.replace(
              /<!-- Call to Action Button -->[\s\S]*?<!-- \/Call to Action Button -->/g,
              ""
            );
            emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", "");
            emailHtml = emailHtml.replace("{{BUTTON_LINK}}", "");
          }
        } else if (isStaffAssignmentEmail) {
          // For staff assignment emails, add button to view project
          emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", "View Project");
          emailHtml = emailHtml.replace(
            "{{BUTTON_LINK}}",
            `${process.env.BASE_URL || "http://localhost:4321"}/project/${projectId}`
          );
        } else if (isStatusUpdateEmail) {
          // For status update emails, use rigid logic from database
          const hasButtonText =
            statusConfig?.button_text &&
            statusConfig.button_text.trim() !== "" &&
            statusConfig.button_text !== "#";
          const hasValidLink = magicLink && magicLink.trim() !== "";

          if (shouldShowButton && hasButtonText && hasValidLink) {
            // For clients with valid button_text and link: Include magic link button
            emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", statusConfig.button_text.trim());
            emailHtml = emailHtml.replace("{{BUTTON_LINK}}", magicLink);
          } else {
            // For admin/staff or when button_text/link is invalid: Remove button completely
            emailHtml = emailHtml.replace(
              /<!-- Call to Action Button -->[\s\S]*?<!-- \/Call to Action Button -->/g,
              ""
            );
            emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", "");
            emailHtml = emailHtml.replace("{{BUTTON_LINK}}", "");
          }
        } else {
          // For unknown email types, remove button
          emailHtml = emailHtml.replace(
            /<!-- Call to Action Button -->[\s\S]*?<!-- \/Call to Action Button -->/g,
            ""
          );
          emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", "");
          emailHtml = emailHtml.replace("{{BUTTON_LINK}}", "");
        }

        // Send email via Resend
        console.log(`📧 [EMAIL-DELIVERY] Sending email to ${user.email}...`);

        // Email content is already properly built in emailHtml using the template

        // Validate from field
        const validFromName = fromName && fromName.trim() !== "" ? fromName.trim() : "CAPCo";
        const validFromEmail =
          fromEmail && fromEmail.trim() !== "" ? fromEmail.trim() : "noreply@capcofire.com";

        // Set subject based on email type
        let emailSubject;
        if (isRegistrationEmail) {
          // Use custom subject from request body, fallback to default
          emailSubject = custom_subject || "Welcome to CAPCo Fire Protection";
        } else if (isStaffAssignmentEmail) {
          // Use custom subject from request body, fallback to default with project title
          emailSubject =
            custom_subject || `Project Assignment - ${projectDetails?.title || "Project"}`;
        } else if (isStatusUpdateEmail) {
          // Status update subject - only rigid built-in logic
          emailSubject = `${statusConfig?.status_name || "Status Update"}: ${projectDetails?.title || "Project"}`;
        } else {
          // Fallback for unknown email types
          emailSubject = custom_subject || "Notification";
        }

        const emailPayload = {
          from: `${validFromName} <${validFromEmail}>`,
          to: [user.email],
          subject: emailSubject,
          html: emailHtml,
          text: personalizedContent,
          // Add proper content type and custom headers
          headers: {
            "Content-Type": "text/html; charset=UTF-8",
            // "X-Project-ID": projectId,
            // "X-Project-Status": newStatus.toString(),
            // "X-User-Email": user.email,
          },
        };

        // Validate payload before sending
        console.log(`📧 [EMAIL-DELIVERY] Validating payload for ${user.email}:`);
        console.log(`  - from: "${emailPayload.from}"`);
        console.log(`  - to: ${JSON.stringify(emailPayload.to)}`);
        console.log(`  - subject: "${emailPayload.subject}"`);
        console.log(`  - html length: ${emailPayload.html.length}`);
        console.log(`  - text length: ${emailPayload.text.length}`);
        console.log(`  - fromName: "${fromName}"`);
        console.log(`  - fromEmail: "${fromEmail}"`);

        console.log(`📧 [EMAIL-DELIVERY] Email payload for ${user.email}:`, {
          from: emailPayload.from,
          to: emailPayload.to,
          subject: emailPayload.subject,
          htmlLength: emailPayload.html.length,
          textLength: emailPayload.text.length,
          buttonText: statusConfig?.button_text || "",
          shouldShowButton: shouldShowButton,
        });

        // Log the actual payload being sent to Resend
        console.log(
          `📧 [EMAIL-DELIVERY] Resend payload for ${user.email}:`,
          JSON.stringify(emailPayload, null, 2)
        );

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
          console.error(`📧 [EMAIL-DELIVERY] Failed to send email to ${user.email}:`, errorText);
          console.error(`📧 [EMAIL-DELIVERY] Response status:`, response.status);
          failedEmails.push({ email: user.email, error: errorText });
        } else {
          const responseData = await response.json();
          console.log(
            `📧 [EMAIL-DELIVERY] Email sent successfully to ${user.email}:`,
            responseData
          );
          sentEmails.push(user.email);
        }
      } catch (userError) {
        console.error(
          `📧 [EMAIL-DELIVERY] Error sending notification to ${user.email}:`,
          userError
        );
        failedEmails.push({
          email: user.email,
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
