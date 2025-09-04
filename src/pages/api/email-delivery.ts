import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { getApiBaseUrl } from "../../lib/url-utils";

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

    const {
      projectId,
      newStatus,
      usersToNotify,
      emailType,
      custom_subject,
      email_content,
      comment_timestamp,
      client_name,
    } = body;

    console.log("📧 [EMAIL-DELIVERY] Parameter validation:");
    console.log("  - projectId:", projectId);
    console.log("  - newStatus:", newStatus);
    console.log("  - emailType:", emailType);
    console.log("  - usersToNotify count:", usersToNotify?.length || 0);

    // Determine email type flags
    const isRegistrationEmail = emailType === "registration";
    const isStaffAssignmentEmail = emailType === "staff_assignment";
    const isStatusUpdateEmail = emailType === "update_status";
    const isClientCommentEmail = emailType === "client_comment";
    const isEmergencySmsEmail = emailType === "emergency_sms";

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
    const resolvedUsers = [];

    for (const userRef of usersToNotify) {
      try {
        if (userRef.email) {
          // Already has email, use as-is
          resolvedUsers.push(userRef);
          console.log("📧 [EMAIL-DELIVERY] Using user with email:", userRef.email);
        } else if (userRef.role) {
          // Role-based notification - get all users with this role
          console.log("📧 [EMAIL-DELIVERY] Resolving role:", userRef.role);

          const { data: roleUsers, error: roleError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, company_name, role")
            .eq("role", userRef.role);

          if (roleError) {
            console.error(`📧 [EMAIL-DELIVERY] Error fetching ${userRef.role} users:`, roleError);
            continue;
          }

          if (roleUsers) {
            for (const roleUser of roleUsers) {
              // Get email from auth.users table
              const { data: authUser, error: authError } =
                await supabaseAdmin?.auth.admin.getUserById(roleUser.id);

              if (authError || !authUser?.user?.email) {
                console.log(
                  `📧 [EMAIL-DELIVERY] No email found for ${userRef.role} user ${roleUser.id}`
                );
                continue;
              }

              resolvedUsers.push({
                id: roleUser.id,
                email: authUser.user.email,
                first_name: roleUser.first_name,
                last_name: roleUser.last_name,
                company_name: roleUser.company_name,
                role: roleUser.role,
              });

              console.log(
                `📧 [EMAIL-DELIVERY] Resolved ${userRef.role} user:`,
                authUser.user.email
              );
            }
          }
        } else if (userRef.id) {
          // ID-based notification - get specific user
          console.log("📧 [EMAIL-DELIVERY] Resolving user ID:", userRef.id);

          const { data: specificUser, error: specificError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, company_name, role")
            .eq("id", userRef.id)
            .single();

          if (specificError || !specificUser) {
            console.error(`📧 [EMAIL-DELIVERY] Error fetching user ${userRef.id}:`, specificError);
            continue;
          }

          // Get email from auth.users table
          const { data: authUser, error: authError } = await supabaseAdmin?.auth.admin.getUserById(
            specificUser.id
          );

          if (authError || !authUser?.user?.email) {
            console.log(`📧 [EMAIL-DELIVERY] No email found for user ${userRef.id}`);
            continue;
          }

          resolvedUsers.push({
            id: specificUser.id,
            email: authUser.user.email,
            first_name: specificUser.first_name,
            last_name: specificUser.last_name,
            company_name: specificUser.company_name,
            role: specificUser.role,
          });

          console.log(`📧 [EMAIL-DELIVERY] Resolved user:`, authUser.user.email);
        }
      } catch (userError) {
        console.error("📧 [EMAIL-DELIVERY] Error resolving user:", userRef, userError);
      }
    }

    console.log(
      `📧 [EMAIL-DELIVERY] Resolved ${resolvedUsers.length} users from ${usersToNotify.length} references`
    );

    // Use resolved users for email delivery
    const finalUsersToNotify = resolvedUsers;

    // Get status configuration from cached API
    let statusConfig = null;
    if (emailType === "update_status" && newStatus) {
      try {
        const baseUrl = getApiBaseUrl(request);
        console.log("📧 [EMAIL-DELIVERY] Using base URL for status fetch:", baseUrl);
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

    // Get project details from database (only for emails that need project context)
    // Positive logic: explicitly define which email types need project details
    let projectDetails = null;
    let projectAuthor = null;

    if (isStatusUpdateEmail || isStaffAssignmentEmail) {
      // These email types need project details for context
      if (!projectId) {
        console.error(
          "📧 [EMAIL-DELIVERY] Project ID required for status update or staff assignment emails"
        );
        return new Response(
          JSON.stringify({
            success: false,
            error: "Project ID required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // First, get basic project details
      const { data: fetchedProjectDetails, error: projectError } = await supabase
        .from("projects")
        .select("title, address, author_id")
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

      // Separately fetch the project author's profile information
      if (fetchedProjectDetails.author_id) {
        const { data: authorProfile, error: authorError } = await supabase
          .from("profiles")
          .select("first_name, last_name, company_name, id")
          .eq("id", fetchedProjectDetails.author_id)
          .single();

        if (authorError) {
          console.error("📧 [EMAIL-DELIVERY] Failed to get author profile:", authorError);
        } else {
          projectAuthor = authorProfile;
          console.log("📧 [EMAIL-DELIVERY] Project author found:", {
            firstName: projectAuthor.first_name,
            lastName: projectAuthor.last_name,
            companyName: projectAuthor.company_name,
          });
        }
      }

      if (!projectAuthor) {
        console.warn("📧 [EMAIL-DELIVERY] No author profile found for project:", projectId);
      }
    } else if (isRegistrationEmail) {
      // Use project details from request body for registration emails
      projectDetails = body.projectDetails || { title: projectId, address: "Registration" };
    } else {
      // For other email types (client comments, emergency SMS), no project details needed
      console.log("📧 [EMAIL-DELIVERY] No project details needed for this email type:", emailType);
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

    console.log(
      "📧 [EMAIL-DELIVERY] Starting email delivery to",
      finalUsersToNotify.length,
      "users"
    );

    // Send emails to each user
    for (let i = 0; i < finalUsersToNotify.length; i++) {
      const user = finalUsersToNotify[i];
      console.log(
        `📧 [EMAIL-DELIVERY] Processing user: ${user.email} (${i + 1}/${finalUsersToNotify.length})`
      );

      // No delay needed with paid Resend account - higher rate limits

      try {
        // Determine if this user should get a magic link button
        const isClient = finalUsersToNotify.some((u: any) => u.email === user.email);

        console.log(`📧 [EMAIL-DELIVERY] User analysis for ${user.email}:`);
        console.log("  - Is client:", isClient);

        // Use button_link from database
        const magicLink = statusConfig?.button_link || "";
        console.log(`📧 [EMAIL-DELIVERY] Using button_link from database: ${magicLink}`);

        // Prepare email content with line breaks for names
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
        const displayName = fullName || user.company_name || "Client";

        // Get the project author's name for CLIENT_NAME placeholder (should always be the project owner)
        let clientName = "Client";
        if (projectAuthor) {
          const authorFullName =
            `${projectAuthor.first_name || ""} ${projectAuthor.last_name || ""}`.trim();
          clientName = authorFullName || projectAuthor.company_name || "Client";
        }

        console.log("📧 [EMAIL-DELIVERY] Name resolution:", {
          recipientDisplayName: displayName,
          projectClientName: clientName,
          projectAuthor: projectAuthor
            ? {
                firstName: projectAuthor.first_name,
                lastName: projectAuthor.last_name,
                companyName: projectAuthor.company_name,
              }
            : null,
        });

        // Consolidated email configuration by type
        let emailContent, emailSubject, buttonText, buttonLink;
        let shouldShowButton = true;

        if (isRegistrationEmail) {
          // Registration Email Configuration
          emailSubject = custom_subject || "Welcome to CAPCo Fire Protection";
          emailContent = email_content || "Thank you for registering with CAPCo Fire Protection!";

          // Button logic for registration
          const hasRegistrationButton = body.button_text && body.button_text.trim() !== "";
          if (hasRegistrationButton) {
            buttonText = body.button_text.trim();
            buttonLink = body.button_link || "#";
          } else {
            shouldShowButton = false;
          }
        } else if (isStaffAssignmentEmail) {
          // Staff Assignment Email Configuration
          emailSubject =
            custom_subject || `Project Assignment - ${projectDetails?.title || "Project"}`;
          emailContent =
            email_content ||
            "You have been assigned to a new project. Please review the project details and take appropriate action.";
          buttonText = "View Project";
          buttonLink = `${getApiBaseUrl(request)}/project/${projectId}`;
        } else if (isClientCommentEmail) {
          // Client Comment Email Configuration
          emailSubject =
            custom_subject ||
            `New Comment: ${projectDetails?.title || "Project"} from ${client_name || "Client"}`;

          // Fetch basic project info for content
          let commentProjectTitle = "Project";
          if (projectId) {
            const { data: basicProject } = await supabase
              .from("projects")
              .select("title, address")
              .eq("id", projectId)
              .single();
            commentProjectTitle = basicProject?.title || basicProject?.address || "Project";
          }

          // Format the comment with timestamp
          const commentTime = comment_timestamp
            ? new Date(comment_timestamp).toLocaleString()
            : "Unknown time";
          emailContent = `
            <p><strong>{{CLIENT_NAME}}</strong> posted a new comment on <strong>{{PROJECT_TITLE}}</strong>:</p>
            <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 16px; margin: 16px 0; border-radius: 4px;">
              <p style="margin: 0; font-style: italic;">"${email_content}"</p>
            </div>
            <p style="color: #6c757d; font-size: 14px;"><strong>Posted:</strong> ${commentTime}</p>
            <p>Please review and respond to this comment as needed.</p>
          `;

          // Replace placeholders for client comment emails
          emailContent = emailContent
            .replace(/{{CLIENT_NAME}}/g, client_name || "Client")
            .replace(/{{PROJECT_TITLE}}/g, commentProjectTitle);

          buttonText = "View Comment & Respond";
          buttonLink = `${getApiBaseUrl(request)}/project/${projectId}?tab=discussion`;
        } else if (isStatusUpdateEmail) {
          // Status Update Email Configuration
          emailSubject = `${statusConfig?.status_name || "Status Update"}: ${projectDetails?.title || "Project"}`;
          emailContent =
            statusConfig?.email_content ||
            "Your project status has been updated. Please check your project dashboard for more details.";

          // Button logic for status updates
          const hasButtonText =
            statusConfig?.button_text &&
            statusConfig.button_text.trim() !== "" &&
            statusConfig.button_text !== "#";
          const hasValidLink = magicLink && magicLink.trim() !== "";

          if (hasButtonText && hasValidLink) {
            buttonText = statusConfig.button_text.trim();
            buttonLink = magicLink;
          } else {
            shouldShowButton = false;
          }
        } else if (isEmergencySmsEmail) {
          // Emergency SMS Email Configuration
          emailSubject = custom_subject || "Contact";
          emailContent = email_content || "Contact message from CAPCo website";
          shouldShowButton = false;

          // Debug: Log SMS email content
          console.log("📧 [EMAIL-DELIVERY] SMS email content received:");
          console.log("📧 [EMAIL-DELIVERY] Content length:", emailContent.length);
          console.log(
            "📧 [EMAIL-DELIVERY] Content preview:",
            emailContent.substring(0, 200) + (emailContent.length > 200 ? "..." : "")
          );
        } else {
          // Fallback for unknown email types
          emailSubject = custom_subject || "Notification";
          emailContent = email_content || "You have a new notification.";
          shouldShowButton = false;
        }

        // Convert plain text to HTML with line breaks (skip for SMS)
        let htmlContent;
        if (isEmergencySmsEmail) {
          // For SMS, keep as plain text (no HTML formatting)
          htmlContent = emailContent;
        } else {
          htmlContent = emailContent
            .replace(/{{PROJECT_TITLE}}/g, projectDetails.title || "Project")
            .replace(/{{PROJECT_ADDRESS}}/g, projectDetails.address || "N/A")
            .replace(/{{ADDRESS}}/g, projectDetails.address || "N/A")
            .replace(/{{EST_TIME}}/g, statusConfig?.est_time || "2-3 business days")
            .replace(/{{CLIENT_NAME}}/g, clientName) // Use project author's name, not recipient's name
            .replace(/{{CLIENT_EMAIL}}/g, user.email)
            // Replace any remaining {{PLACEHOLDER}} with empty string
            .replace(/\{\{[^}]+\}\}/g, "")
            .replace(/\n/g, "<br>"); // Convert line breaks to HTML
        }

        const personalizedContent = emailContent
          .replace(/{{PROJECT_TITLE}}/g, projectDetails?.title || "Project")
          .replace(/{{PROJECT_ADDRESS}}/g, projectDetails?.address || "N/A")
          .replace(/{{ADDRESS}}/g, projectDetails?.address || "N/A")
          .replace(/{{EST_TIME}}/g, statusConfig?.est_time || "2-3 business days")
          .replace(/{{CLIENT_NAME}}/g, clientName || "Client") // Use project author's name, not recipient's name
          .replace(/{{CLIENT_EMAIL}}/g, user.email)
          // Replace any remaining {{PLACEHOLDER}} with empty string
          .replace(/\{\{[^}]+\}\}/g, "");

        // Replace template variables
        let emailHtml = emailTemplate.replace("{{CONTENT}}", htmlContent);

        // Apply button configuration
        if (shouldShowButton && buttonText && buttonLink) {
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

        // Send email via Resend
        console.log(`📧 [EMAIL-DELIVERY] Sending email to ${user.email}...`);

        // Email content is already properly built in emailHtml using the template

        // Validate from field
        const validFromName = fromName && fromName.trim() !== "" ? fromName.trim() : "CAPCo";
        const validFromEmail =
          fromEmail && fromEmail.trim() !== "" ? fromEmail.trim() : "noreply@capcofire.com";

        // Email subject was already set in the consolidated configuration above

        const emailPayload = {
          from: `${validFromName} <${validFromEmail}>`,
          to: [user.email],
          subject: emailSubject,
          html: emailHtml,
          text: personalizedContent,
          // Add proper content type and custom headers
          headers: {
            "Content-Type": "text/html; charset=UTF-8",
            "X-Project-ID": projectId,
            "X-Project-Status": newStatus.toString(),
            "X-User-Email": user.email,
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
