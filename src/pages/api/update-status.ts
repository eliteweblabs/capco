import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

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

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("📊 [UPDATE-STATUS] API route called!");

  try {
    const body = await request.json();
    console.log("📊 [UPDATE-STATUS] Received request body:", JSON.stringify(body, null, 2));

    const { projectId, newStatus } = body;

    if (!projectId || newStatus === undefined) {
      return new Response(JSON.stringify({ error: "Project ID and new status are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user from session using tokens
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set session
    const { data: session, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session.session?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update project status
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()
      .single();

    if (updateError) {
      console.error("📊 [UPDATE-STATUS] Database error:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("📊 [UPDATE-STATUS] Project status updated successfully:", {
      projectId,
      oldStatus: updatedProject.status,
      newStatus,
    });

    // Send email notifications for status change
    try {
      await sendStatusChangeNotifications(projectId, newStatus, updatedProject);
    } catch (emailError) {
      console.error("📊 [UPDATE-STATUS] Error sending status change notifications:", emailError);
      // Don't fail the request if email notifications fail
    }

    return new Response(
      JSON.stringify({
        success: true,
        project: updatedProject,
        message: "Status updated successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error) {
    console.error("📊 [UPDATE-STATUS] Catch block error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Function to send status change notifications
async function sendStatusChangeNotifications(
  projectId: string,
  newStatus: number,
  projectData: any
) {
  try {
    if (!supabase || !supabaseAdmin) {
      console.error("Supabase clients not available for notifications");
      return;
    }

    // Get status configuration from project_statuses table
    const { data: statusConfig, error: statusError } = await supabase
      .from("project_statuses")
      .select("notify, email_content, button_text")
      .eq("status_code", newStatus)
      .single();

    if (statusError || !statusConfig) {
      console.log(`No status configuration found for status ${newStatus}`);
      return;
    }

    const { notify, email_content, button_text } = statusConfig;

    // Get project details for email
    const { data: projectDetails } = await supabase
      .from("projects")
      .select(
        `
          title,
          address,
          author_id,
          assigned_to_id,
          profiles!projects_author_id_fkey (
            email,
            company_name,
            first_name,
            last_name
          )
        `
      )
      .eq("id", projectId)
      .single();

    if (!projectDetails) {
      console.error("Project details not found for notifications");
      return;
    }

    // Get all users to notify
    const usersToNotify: Array<{
      email: string;
      first_name?: string;
      last_name?: string;
      company_name?: string;
    }> = [];

    // HARDCODED FOR TESTING - Replace with actual user lookup logic
    usersToNotify.push({
      email: "ssen@eliteweblabs.com",
      first_name: "Test",
      last_name: "User",
      company_name: "Test Company",
    });

    console.log("📧 [UPDATE-STATUS] Hardcoded test email will be used:", usersToNotify);

    // ORIGINAL CODE (commented out for testing):
    /*
    if (notify.includes("admin")) {
      // Get all admin users
      const { data: adminUsers } = await supabase
        .from("profiles")
        .select("email, first_name, last_name, company_name")
        .eq("role", "Admin");

      if (adminUsers) {
        usersToNotify.push(...adminUsers);
      }
    }

    if (notify.includes("staff")) {
      // Only get staff users that are assigned to this specific project
      if (projectDetails.assigned_to_id) {
        const { data: assignedStaff } = await supabase
          .from("profiles")
          .select("email, first_name, last_name, company_name")
          .eq("id", projectDetails.assigned_to_id)
          .eq("role", "Staff")
          .single();

        if (assignedStaff) {
          usersToNotify.push(assignedStaff);
        }
      }
    }
    */

    // Get environment variables for email
    const emailProvider = import.meta.env.EMAIL_PROVIDER;
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;

    if (!emailProvider || !emailApiKey || !fromEmail) {
      console.log("Email configuration not available, skipping notifications");
      return;
    }

    // Read email template
    const emailTemplatePath = new URL("../../../emails/template.html", import.meta.url);
    const emailTemplate = await fetch(emailTemplatePath).then((res) => res.text());

    // Send emails to each user
    for (const user of usersToNotify) {
      try {
        // Determine if this user should get a magic link button
        const isClient = user.email === projectDetails.profiles[0].email;
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
          console.error(`Failed to send email to ${user.email}:`, await response.text());
        } else {
          console.log(`Status change notification sent to ${user.email}`);
        }
      } catch (userError) {
        console.error(`Error sending notification to ${user.email}:`, userError);
      }
    }
  } catch (error) {
    console.error("Error in sendStatusChangeNotifications:", error);
    throw error;
  }
}
