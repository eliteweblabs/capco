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
      console.log("🔔 [UPDATE-PROJECT] Checking for status change...");
      console.log("🔔 [UPDATE-PROJECT] Status field received:", updateFields.status);
      const { data: currentProject, error: currentProjectError } = await supabase
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .single();

      console.log("🔔 [UPDATE-PROJECT] Current project status check:", {
        hasData: !!currentProject,
        error: currentProjectError,
        currentStatus: currentProject?.status,
        newStatus: updateFields.status,
        projectId,
      });

      if (currentProject && currentProject.status !== updateFields.status) {
        oldStatus = currentProject.status;
        isStatusChange = true;
        console.log("🔔 [UPDATE-PROJECT] Status change detected:", {
          oldStatus,
          newStatus: updateFields.status,
        });
      } else {
        console.log("🔔 [UPDATE-PROJECT] No status change - same status or no current project");
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
    console.log("🔔 [UPDATE-PROJECT] Status change check:", {
      isStatusChange,
      newStatus: updateFields.status,
      oldStatus,
    });

    if (isStatusChange && updateFields.status !== undefined) {
      console.log("🔔 [UPDATE-PROJECT] Calling sendStatusChangeNotifications...");
      console.log("🔔 [UPDATE-PROJECT] Status change details:", {
        projectId,
        newStatus: updateFields.status,
        oldStatus,
        isStatusChange,
      });
      try {
        await sendStatusChangeNotifications(projectId, updateFields.status, data);
        console.log("🔔 [UPDATE-PROJECT] sendStatusChangeNotifications completed successfully");
      } catch (notificationError) {
        console.error("Status change notification error:", notificationError);
        // Don't fail the update if notifications fail
      }
    } else {
      console.log("🔔 [UPDATE-PROJECT] No status change detected, skipping notifications");
      console.log("🔔 [UPDATE-PROJECT] Status change check details:", {
        isStatusChange,
        hasStatusField: updateFields.status !== undefined,
        newStatus: updateFields.status,
        oldStatus,
      });
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
      .select("notify, email_content, button_text, est_time")
      .eq("status_code", newStatus)
      .single();

    console.log("🔔 [UPDATE-PROJECT] Status configuration query:", {
      statusCode: newStatus,
      hasConfig: !!statusConfig,
      error: statusError,
      config: statusConfig,
    });

    if (statusError || !statusConfig) {
      console.log(`🔔 [UPDATE-PROJECT] No status configuration found for status ${newStatus}`);
      console.log("🔔 [UPDATE-PROJECT] This means no email will be sent for this status change");
      return;
    }

    console.log("🔔 [UPDATE-PROJECT] Status configuration found:", statusConfig);

    const { notify, email_content, button_text, est_time } = statusConfig;

    // Get project details for email
    console.log("🔔 [UPDATE-PROJECT] Fetching project details for ID:", projectId);
    const { data: projectDetails, error: projectDetailsError } = await supabase
      .from("projects")
      .select("title, address, author_id, assigned_to_id")
      .eq("id", projectId)
      .single();

    console.log("🔔 [UPDATE-PROJECT] Project details query result:", {
      hasData: !!projectDetails,
      error: projectDetailsError,
      projectId,
      projectDetails: projectDetails
        ? {
            title: projectDetails.title,
            address: projectDetails.address,
            author_id: projectDetails.author_id,
            assigned_to_id: projectDetails.assigned_to_id,
          }
        : null,
    });

    if (!projectDetails) {
      console.error("Project details not found for notifications");
      return;
    }

    // Get author profile separately
    console.log("🔔 [UPDATE-PROJECT] Fetching author profile for ID:", projectDetails.author_id);
    const { data: authorProfile, error: authorProfileError } = await supabase
      .from("profiles")
      .select("company_name")
      .eq("id", projectDetails.author_id)
      .single();

    // Get user email from auth system
    const { data: userData, error: userError } = await supabaseAdmin!.auth.admin.getUserById(
      projectDetails.author_id
    );

    console.log("🔔 [UPDATE-PROJECT] Author profile and user query result:", {
      hasProfile: !!authorProfile,
      profileError: authorProfileError,
      hasUserData: !!userData,
      userError: userError,
      authorId: projectDetails.author_id,
      userEmail: userData?.user?.email,
      companyName: authorProfile?.company_name,
    });

    if (!authorProfile || !userData?.user?.email) {
      console.error("Author profile or email not found for notifications");
      return;
    }

    // Create a user object with the available data
    const userInfo = {
      email: userData.user.email,
      company_name: authorProfile.company_name,
      first_name: userData.user.user_metadata?.full_name?.split(" ")[0] || "",
      last_name: userData.user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
    };

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

    if (notify.includes("client") || notify.includes("author")) {
      // Add the project owner/client
      usersToNotify.push(userInfo);
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

    console.log(
      "🔔 [UPDATE-PROJECT] Users to notify:",
      usersToNotify.map((u) => ({
        email: u.email,
        name: u.first_name || u.company_name,
      }))
    );

    // Send emails to each user
    for (const user of usersToNotify) {
      try {
        // Determine if this user should get a magic link button
        const isClient = user.email === userInfo.email;
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
          .replace("{{EST_TIME}}", est_time || "2-3 business days")
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

        // Use centralized email delivery system
        const emailResponse = await fetch("http://localhost:4321/api/email-delivery", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            newStatus,
            usersToNotify: [user],
            projectDetails: {
              title: projectDetails.title || "Project",
              address: projectDetails.address || "N/A",
              est_time: est_time || "2-3 business days",
              profiles: [user],
            },
            email_content: personalizedContent,
            button_text: shouldShowButton ? button_text || "View Project" : "",
          }),
        });

        if (!emailResponse.ok) {
          console.error(`Failed to send email to ${user.email}:`, await emailResponse.text());
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
