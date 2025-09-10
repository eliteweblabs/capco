import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Get status code from query parameter
    const statusCode = url.searchParams.get("status");

    if (!statusCode) {
      return new Response(JSON.stringify({ error: "Status code is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const statusNumber = parseInt(statusCode);
    if (isNaN(statusNumber)) {
      return new Response(JSON.stringify({ error: "Invalid status code format" }), {
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

    // Fetch email content from project_statuses table
    const { data: statusData, error: statusError } = await supabase
      .from("project_statuses")
      .select("notify, email_content, button_text, admin_status_name")
      .eq("status_code", statusNumber)
      .single();

    if (statusError) {
      console.error("Error fetching status email content:", statusError);
      return new Response(JSON.stringify({ error: "Status not found or database error" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!statusData) {
      return new Response(JSON.stringify({ error: "Status not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get users to notify based on the notify field
    const usersToNotify: Array<{
      email: string;
      first_name?: string;
      last_name?: string;
      company_name?: string;
      role: string;
    }> = [];

    const { notify, email_content, button_text, admin_status_name } = statusData;

    if (notify.includes("admin")) {
      // Get all admin users
      const { data: adminUsers } = await supabase
        .from("profiles")
        .select("email, first_name, last_name, company_name, role")
        .eq("role", "Admin");

      if (adminUsers) {
        usersToNotify.push(...adminUsers);
      }
    }

    if (notify.includes("staff")) {
      // Get all staff users
      const { data: staffUsers } = await supabase
        .from("profiles")
        .select("email, first_name, last_name, company_name, role")
        .eq("role", "Staff");

      if (staffUsers) {
        usersToNotify.push(...staffUsers);
      }
    }

    // Return the email content and user list
    const response = {
      status_code: statusNumber,
      admin_status_name,
      notify,
      email_content,
      button_text,
      users_to_notify: usersToNotify,
      total_users: usersToNotify.length,
    };

    // console.log(`📧 [GET-STATUS-EMAIL] Retrieved email content for status ${statusNumber}:`, {
//       admin_status_name,
//       notify,
//       total_users: usersToNotify.length,
//     });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-status-email-content:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
