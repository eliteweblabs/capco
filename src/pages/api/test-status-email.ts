import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { projectId, statusCode, testEmail } = body;

    if (!projectId || !statusCode) {
      return new Response(
        JSON.stringify({ error: "Project ID and status code are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Database connection not available" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get status configuration
    const { data: statusConfig, error: statusError } = await supabase
      .from("project_statuses")
      .select("notify, email_content, button_text, name")
      .eq("code", statusCode)
      .single();

    if (statusError || !statusConfig) {
      return new Response(
        JSON.stringify({ 
          error: `No status configuration found for status ${statusCode}`,
          statusError: statusError?.message 
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get project details
    const { data: projectDetails, error: projectError } = await supabase
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

    if (projectError || !projectDetails) {
      return new Response(
        JSON.stringify({ 
          error: "Project details not found",
          projectError: projectError?.message 
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build users to notify
    const usersToNotify: Array<{
      email: string;
      first_name?: string;
      last_name?: string;
      company_name?: string;
    }> = [];

    const { notify, email_content, button_text } = statusConfig;

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

    if (notify.includes("client") || notify.includes("author")) {
      // Add the project author/client to notifications
      if (projectDetails.profiles && projectDetails.profiles.length > 0) {
        usersToNotify.push(projectDetails.profiles[0]);
      }
    }

    // If testEmail is provided, add it to the list
    if (testEmail) {
      usersToNotify.push({
        email: testEmail,
        first_name: "Test",
        last_name: "User",
        company_name: "Test Company",
      });
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
          newStatus: statusCode,
          usersToNotify,
          projectDetails,
          email_content,
          button_text,
        }),
      }
    );

    const emailResult = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        statusConfig,
        projectDetails,
        usersToNotify,
        emailResult,
        testInfo: {
          projectId,
          statusCode,
          statusName: statusConfig.name,
          testEmail,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Test status email error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to test status email",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
