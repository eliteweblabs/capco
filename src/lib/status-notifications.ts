import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";
import { getApiBaseUrl } from "./url-utils";

// Function to send status change notifications
export async function sendStatusChangeNotifications(
  projectId: string,
  newStatus: number,
  context: string = "API"
) {
  // console.log(`🔔 [${context}] sendStatusChangeNotifications called with:`, {
  //   projectId,
  //   newStatus,
  //   hasProjectData: !!projectData,
  // });

  try {
    if (!supabase || !supabaseAdmin) {
      console.error("Supabase clients not available for notifications");
      return;
    }

    // Get status configuration from project_statuses table
    // console.log(`🔔 [${context}] Fetching status configuration for status:`, newStatus);
    const { data: statusConfig, error: statusError } = await supabase
      .from("project_statuses")
      .select(
        "notify, email_content, button_text, button_link, modal_admin, modal_client, admin_status_name, est_time"
      )
      .eq("status_code", newStatus)
      .single();

    // console.log(`🔔 [${context}] Status configuration result:`, {
    //   hasData: !!statusConfig,
    //   error: statusError,
    //   statusCode: newStatus,
    //   config: statusConfig
    //     ? {
    //         notify: statusConfig.notify,
    //         hasEmailContent: !!statusConfig.email_content,
    //         hasButtonText: !!statusConfig.button_text,
    //       }
    //     : null,
    // });

    if (statusError || !statusConfig) {
      console.log(`🔔 [${context}] No status configuration found for status ${newStatus}`);
      return;
    }

    // Get project details
    // console.log(`🔔 [${context}] Fetching project details for ID:`, projectId);
    const { data: projectDetails, error: projectDetailsError } = await supabase
      .from("projects")
      .select("title, address, author_id, assigned_to_id")
      .eq("id", projectId)
      .single();

    if (!projectDetails) {
      console.error("Project details not found for notifications");
      return;
    }

    // Get users to notify based on notification configuration
    const usersToNotify = await getUsersToNotify(statusConfig.notify, projectDetails, context);

    if (usersToNotify.length === 0) {
      console.log(`🔔 [${context}] No users to notify for status ${newStatus}`);
      return;
    }

    // Send email notifications if configured
    if (statusConfig.email_content) {
      await sendEmailNotifications(
        projectId,
        newStatus,
        usersToNotify,
        projectDetails,
        statusConfig,
        context
      );
    }

    // Send modal notifications if configured
    if (statusConfig.modal_admin || statusConfig.modal_client) {
      await sendModalNotifications(
        projectId,
        newStatus,
        usersToNotify,
        projectDetails,
        statusConfig,
        context
      );
    }
  } catch (error) {
    console.error(`Error in sendStatusChangeNotifications [${context}]:`, error);
    throw error;
  }
}

// Helper function to get users to notify
async function getUsersToNotify(notify: string[], projectDetails: any, context: string) {
  const usersToNotify: Array<{
    email: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    role?: string;
  }> = [];

  if (notify.includes("Admin")) {
    const adminUsers = await getAdminUsers(context);
    usersToNotify.push(...adminUsers);
  }

  if (notify.includes("Staff")) {
    const staffUsers = await getStaffUsers(projectDetails.assigned_to_id, context);
    usersToNotify.push(...staffUsers);
  }

  if (notify.includes("Client") || notify.includes("Author")) {
    const clientUser = await getClientUser(projectDetails.author_id, context);
    if (clientUser) {
      usersToNotify.push(clientUser);
    }
  }

  return usersToNotify;
}

// Helper function to get admin users
async function getAdminUsers(context: string) {
  const { data: adminUsers, error: adminError } = await supabaseAdmin!
    .from("profiles")
    .select("id, first_name, last_name, company_name, role")
    .eq("role", "Admin");

  if (adminError || !adminUsers) {
    console.log(`🔔 [${context}] No admin users found`);
    return [];
  }

  const adminUsersWithEmails = [];
  for (const profile of adminUsers) {
    const { data: userData } = await supabaseAdmin!.auth.admin.getUserById(profile.id);
    if (userData?.user?.email) {
      adminUsersWithEmails.push({
        email: userData.user.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        company_name: profile.company_name,
        role: profile.role,
      });
    }
  }

  return adminUsersWithEmails;
}

// Helper function to get staff users
async function getStaffUsers(assignedToId: string, context: string) {
  if (!assignedToId || !supabase) return [];

  const { data: assignedStaff } = await supabase
    .from("profiles")
    .select("email, first_name, last_name, company_name, role")
    .eq("id", assignedToId)
    .eq("role", "Staff")
    .single();

  return assignedStaff ? [assignedStaff] : [];
}

// Helper function to get client user
async function getClientUser(authorId: string, context: string) {
  if (!supabase) return null;

  const { data: authorProfile } = await supabase
    .from("profiles")
    .select("company_name")
    .eq("id", authorId)
    .single();

  const { data: userData } = await supabaseAdmin!.auth.admin.getUserById(authorId);

  if (authorProfile && userData?.user?.email) {
    return {
      email: userData.user.email,
      company_name: authorProfile.company_name,
      first_name: userData.user.user_metadata?.full_name?.split(" ")[0] || "",
      last_name: userData.user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
      role: "Client",
    };
  }

  return null;
}

// Helper function to send email notifications
async function sendEmailNotifications(
  projectId: string,
  newStatus: number,
  usersToNotify: any[],
  projectDetails: any,
  statusConfig: any,
  context: string,
  request?: Request
) {
  // console.log(`🔔 [${context}] Sending email notifications to ${usersToNotify.length} users`);

  const baseUrl = request
    ? getApiBaseUrl(request)
    : import.meta.env.SITE_URL || "http://localhost:4321";

  try {
    const emailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        newStatus,
        usersToNotify,
        emailType: "update_status",
      }),
    });

    if (emailResponse.ok) {
      const emailResult = await emailResponse.json();
      console.log(`📧 [${context}] Email notifications sent successfully:`, emailResult);
    } else {
      const errorText = await emailResponse.text();
      console.error(`📧 [${context}] Email notifications failed:`, errorText);
    }
  } catch (error) {
    console.error(`🔔 [${context}] Exception sending email notifications:`, error);
  }
}

// Helper function to send modal notifications
async function sendModalNotifications(
  projectId: string,
  newStatus: number,
  usersToNotify: any[],
  projectDetails: any,
  statusConfig: any,
  context: string
) {
  console.log(`🔔 [${context}] Sending toast notifications to ${usersToNotify.length} users`);

  // Import toast notification utilities
  // const { toast } = await import("./toast-utils");

  // For now, just log that toast notifications would be sent
  // You can implement the actual modal logic here or call a separate modal service
  console.log(`🔔 [${context}] Modal notifications would be sent for status ${newStatus}`);

  // Example implementation:
  // usersToNotify.forEach(user => {
  //   const message = user.role === "Admin" ? statusConfig.modal_admin : statusConfig.modal_client;
  //   // Send modal notification to user
  // });
}
