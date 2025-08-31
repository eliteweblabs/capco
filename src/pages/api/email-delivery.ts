import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("📧 [EMAIL-DELIVERY] API endpoint called");

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

    const { projectId, newStatus, usersToNotify, projectDetails, email_content, button_text } =
      body;

    console.log("📧 [EMAIL-DELIVERY] Parameter validation:");
    console.log("  - projectId:", projectId);
    console.log("  - newStatus:", newStatus);
    console.log("  - usersToNotify count:", usersToNotify?.length || 0);
    console.log("  - projectDetails:", projectDetails ? "Present" : "Missing");
    console.log("  - email_content:", email_content ? "Present" : "Missing");

    // For test emails, newStatus might be invalid (like 999) or 0, so we'll allow it
    const isTestEmail = projectId === "test-project" || newStatus === 999 || newStatus === 0;
    console.log("📧 [EMAIL-DELIVERY] Is test email:", isTestEmail);

    if (!projectId || !usersToNotify || !projectDetails || !email_content) {
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

    // Only validate newStatus for non-test emails
    if (!isTestEmail && !newStatus) {
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
        const profileEmails = projectDetails.profiles.map((profile: any) => profile.email);
        const isClient = profileEmails.includes(user.email);
        const shouldShowButton = isClient; // Only show button for clients

        console.log(`📧 [EMAIL-DELIVERY] User analysis for ${user.email}:`);
        console.log("  - Profile emails:", profileEmails);
        console.log("  - Is client:", isClient);
        console.log("  - Should show button:", shouldShowButton);

        let magicLink = "";
        if (shouldShowButton) {
          console.log(`📧 [EMAIL-DELIVERY] Generating magic link for ${user.email}...`);
          // Generate magic link only for clients
          const { data: magicLinkData, error: magicLinkError } =
            await supabaseAdmin.auth.admin.generateLink({
              type: "magiclink",
              email: user.email,
              options: {
                redirectTo: `${import.meta.env.SITE_URL || "http://localhost:4321"}/project/${projectId}`,
              },
            });

          if (magicLinkError) {
            console.error(
              `📧 [EMAIL-DELIVERY] Magic link generation error for ${user.email}:`,
              magicLinkError
            );
            failedEmails.push({ email: user.email, error: magicLinkError.message });
            continue;
          }
          magicLink = magicLinkData.properties.action_link;
          console.log(`📧 [EMAIL-DELIVERY] Magic link generated for ${user.email}`);
        } else {
          console.log(`📧 [EMAIL-DELIVERY] No magic link needed for ${user.email} (not a client)`);
        }

        // Prepare email content
        const personalizedContent = email_content
          .replace("{{PROJECT_TITLE}}", projectDetails.title || "Project")
          .replace("{{PROJECT_ADDRESS}}", projectDetails.address || "N/A")
          .replace("{{EST_TIME}}", projectDetails.est_time || "2-3 business days")
          .replace(
            "{{CLIENT_NAME}}",
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
              user.company_name ||
              "Client"
          );

        // Replace template variables
        let emailHtml = emailTemplate.replace("{{CONTENT}}", personalizedContent);

        if (shouldShowButton) {
          // For clients: Include magic link button
          emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", button_text || "View Project");
          emailHtml = emailHtml.replace("{{BUTTON_LINK}}", magicLink);
        } else {
          // For admin/staff: Remove button, just show content
          emailHtml = emailHtml.replace(/<a[^>]*{{BUTTON_TEXT}}[^>]*>.*?<\/a>/g, "");
          emailHtml = emailHtml.replace("{{BUTTON_TEXT}}", "");
          emailHtml = emailHtml.replace("{{BUTTON_LINK}}", "");
        }

        // Send email via Resend
        console.log(`📧 [EMAIL-DELIVERY] Sending email to ${user.email}...`);
        const emailPayload = {
          from: `${fromName} <${fromEmail}>`,
          to: [user.email],
          subject: `Project Status Update: ${projectDetails.title || "Project"}`,
          html: emailHtml,
          text: personalizedContent.replace(/<[^>]*>/g, ""),
          // Add custom headers for webhook tracking
          headers: {
            "X-Project-ID": projectId,
            "X-Project-Status": newStatus.toString(),
            "X-User-Email": user.email,
          },
        };

        console.log(`📧 [EMAIL-DELIVERY] Email payload for ${user.email}:`, {
          from: emailPayload.from,
          to: emailPayload.to,
          subject: emailPayload.subject,
          htmlLength: emailPayload.html.length,
          textLength: emailPayload.text.length,
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
