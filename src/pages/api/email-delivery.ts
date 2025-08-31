import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (!supabase || !supabaseAdmin) {
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
    const { projectId, newStatus, usersToNotify, projectDetails, email_content, button_text } =
      body;

    if (!projectId || !newStatus || !usersToNotify || !projectDetails || !email_content) {
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

    // Get environment variables for email
    const emailProvider = import.meta.env.EMAIL_PROVIDER;
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;

    if (!emailProvider || !emailApiKey || !fromEmail) {
      console.log("Email configuration not available, skipping notifications");
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
    const emailTemplatePath = new URL("../../../emails/template.html", import.meta.url);
    const emailTemplate = await fetch(emailTemplatePath).then((res) => res.text());

    const sentEmails = [];
    const failedEmails = [];

    // Send emails to each user
    for (const user of usersToNotify) {
      try {
        // Determine if this user should get a magic link button
        const profileEmails = projectDetails.profiles.map((profile: any) => profile.email);
        const isClient = profileEmails.includes(user.email);
        const shouldShowButton = isClient; // Only show button for clients

        let magicLink = "";
        if (shouldShowButton) {
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
            console.error(`Magic link generation error for ${user.email}:`, magicLinkError);
            failedEmails.push({ email: user.email, error: magicLinkError.message });
            continue;
          }
          magicLink = magicLinkData.properties.action_link;
        }

        // Prepare email content
        const personalizedContent = email_content
          .replace("{{PROJECT_TITLE}}", projectDetails.title || "Project")
          .replace("{{PROJECT_ADDRESS}}", projectDetails.address || "N/A")
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
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${emailApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [user.email],
            subject: `Project Status Update: ${projectDetails.title || "Project"}`,
            html: emailHtml,
            text: personalizedContent.replace(/<[^>]*>/g, ""),
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to send email to ${user.email}:`, errorText);
          failedEmails.push({ email: user.email, error: errorText });
        } else {
          console.log(`Status change notification sent to ${user.email}`);
          sentEmails.push(user.email);
        }
      } catch (userError) {
        console.error(`Error sending notification to ${user.email}:`, userError);
        failedEmails.push({
          email: user.email,
          error: userError instanceof Error ? userError.message : "Unknown error",
        });
      }
    }

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
    console.error("Email delivery error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to send email notifications",
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
