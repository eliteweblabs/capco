import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { buildUpdateData } from "../../lib/project-fields-config";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log("Update project API received:", body);

    const { projectId, ...updateFields } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      // For demo purposes, simulate a successful update when database is not configured
      return new Response(
        JSON.stringify({
          success: true,
          project: {
            id: projectId,
            ...updateFields,
          },
          message: `Demo: Project ${projectId} ${updateFields.status !== undefined ? `status updated to ${updateFields.status}` : "updated"} (No database interaction)`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      // For demo purposes, simulate a successful update when not authenticated
      return new Response(
        JSON.stringify({
          success: true,
          project: {
            id: projectId,
            ...updateFields,
          },
          message: `Demo: Project ${projectId} ${updateFields.status !== undefined ? `status updated to ${updateFields.status}` : "updated"} (Demo mode - sign in for real database interaction)`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch profile to determine role (Admin/Staff can update any project)
    let isAdminOrStaff = false;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdminOrStaff = profile?.role === "Admin" || profile?.role === "Staff";
    } catch (_) {
      // Default to non-admin if role lookup fails
      isAdminOrStaff = false;
    }

    // Check if this is a status change and get the old status
    let oldStatus = null;
    let isStatusChange = false;

    if (updateFields.status !== undefined) {
      const { data: currentProject } = await supabase
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .single();

      if (currentProject && currentProject.status !== updateFields.status) {
        oldStatus = currentProject.status;
        isStatusChange = true;
      }
    }

    // Build update data using the template configuration
    const {
      core: coreUpdateData,
      optional: optionalUpdateData,
      newFields: newUpdateData,
    } = buildUpdateData(updateFields);

    // Always update the updated_at timestamp when any field is modified
    const updateData = {
      ...coreUpdateData,
      ...optionalUpdateData,
      updated_at: new Date().toISOString(),
    };

    console.log("Attempting to update project with core data:", updateData);

    // First, try to update with core fields
    let coreUpdateQuery = supabase.from("projects").update(updateData).eq("id", projectId);
    if (!isAdminOrStaff) {
      coreUpdateQuery = coreUpdateQuery.eq("author_id", user.id);
    }
    const { data: coreData, error: coreError } = await coreUpdateQuery.select().single();

    if (coreError) {
      console.error("Supabase core update error:", coreError);
      // If no rows were affected, return a friendlier message
      if (
        coreError.code === "PGRST116" ||
        /multiple \(or no\) rows returned|0 rows/i.test(coreError.message || "")
      ) {
        return new Response(
          JSON.stringify({
            error: "No matching project found to update (check permissions or project ID)",
            details: coreError.message,
            code: coreError.code,
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({
          error: `Failed to update project: ${coreError.message}`,
          details: coreError.details,
          hint: coreError.hint,
          code: coreError.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // If core update succeeded and we have new fields, try to update them
    let finalData = coreData;
    if (Object.keys(newUpdateData).length > 0) {
      console.log("Attempting to update new fields:", newUpdateData);

      let newFieldsQuery = supabase.from("projects").update(newUpdateData).eq("id", projectId);
      if (!isAdminOrStaff) {
        newFieldsQuery = newFieldsQuery.eq("author_id", user.id);
      }
      const { data: newFieldsData, error: newFieldsError } = await newFieldsQuery.select().single();

      if (newFieldsError) {
        console.warn(
          "New fields update failed (this is expected if columns don't exist yet):",
          newFieldsError
        );
        // Don't fail the entire request - core fields were updated successfully
      } else {
        console.log("New fields updated successfully");
        finalData = newFieldsData;
      }
    }

    const data = finalData;

    // Handle status change notifications
    if (isStatusChange && updateFields.status !== undefined) {
      try {
        await sendStatusChangeNotifications(projectId, updateFields.status, data);
      } catch (notificationError) {
        console.error("Status change notification error:", notificationError);
        // Don't fail the update if notifications fail
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        project: data,
        message: `Project ${updateFields.status ? `status updated to ${updateFields.status}` : "updated successfully"}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Project update API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
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
      // Get the assigned staff member for this project
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

    if (
      notify.includes("client") &&
      projectDetails.profiles &&
      projectDetails.profiles.length > 0
    ) {
      // Add the project owner/client
      usersToNotify.push(projectDetails.profiles[0]);
    }

    // Read email template
    const templatePath = join(process.cwd(), "src", "emails", "template.html");
    let emailTemplate = "";
    try {
      emailTemplate = readFileSync(templatePath, "utf-8");
    } catch (error) {
      console.error("Error reading email template:", error);
      return;
    }

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
            await supabaseAdmin!.auth.admin.generateLink({
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
        const emailProvider = import.meta.env.EMAIL_PROVIDER;
        const emailApiKey = import.meta.env.EMAIL_API_KEY;
        const fromEmail = import.meta.env.FROM_EMAIL;
        const fromName = import.meta.env.FROM_NAME;

        if (emailProvider === "resend" && emailApiKey && fromEmail) {
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
