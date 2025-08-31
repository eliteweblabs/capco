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

    // Call the email delivery API
    const emailResponse = await fetch(
      `${import.meta.env.SITE_URL || "http://localhost:4321"}/api/email-delivery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          newStatus,
          usersToNotify,
          projectDetails,
          email_content,
          button_text,
        }),
      }
    );

    if (emailResponse.ok) {
      const emailResult = await emailResponse.json();
      console.log("📧 [UPDATE-STATUS] Email delivery result:", emailResult);
    } else {
      console.error("📧 [UPDATE-STATUS] Email delivery failed:", await emailResponse.text());
    }
  } catch (error) {
    console.error("Error in sendStatusChangeNotifications:", error);
    throw error;
  }
}
