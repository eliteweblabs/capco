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
  console.log("📊 [UPDATE-STATUS] ==========================================");

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

    // Get status configuration and send notifications
    const { data: statusConfig, error: statusError } = await supabase
      .from("project_statuses")
      .select("status_name, toast_admin, toast_client, est_time")
      .eq("status_code", newStatus)
      .single();

    // Send email notifications for status change
    let notificationMessage = "Status updated successfully";
    console.log("📊 [UPDATE-STATUS] About to send status change notifications...");
    try {
      await sendStatusChangeNotifications(projectId, newStatus, updatedProject);
      console.log("📊 [UPDATE-STATUS] Status change notifications sent successfully");

      // Use status config for message if available
      if (statusConfig) {
        console.log("📊 [UPDATE-STATUS] Status config found:", {
          toast_admin: statusConfig.toast_admin,
          toast_client: statusConfig.toast_client,
          est_time: statusConfig.est_time,
        });

        // Get user role from the current session instead of headers
        const accessToken = cookies.get("sb-access-token")?.value;
        const refreshToken = cookies.get("sb-refresh-token")?.value;

        let userRole = "Client"; // Default

        if (accessToken && refreshToken) {
          const { data: session } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (session.session?.user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", session.session.user.id)
              .single();

            userRole = profile?.role || "Client";
          }
        }

        console.log("📊 [UPDATE-STATUS] User role determined:", userRole);

        let toastMessage = "";
        if (userRole === "Admin" || userRole === "Staff") {
          toastMessage = statusConfig.toast_admin || "";
        } else {
          toastMessage = statusConfig.toast_client || "";
        }

        console.log("📊 [UPDATE-STATUS] Selected toast message:", toastMessage);

        if (toastMessage) {
          // Get the actual client email from the project author
          let clientEmail = "Client"; // Default fallback

          if (updatedProject.author_id) {
            const { data: userData } = await supabaseAdmin!.auth.admin.getUserById(
              updatedProject.author_id
            );
            if (userData?.user?.email) {
              clientEmail = userData.user.email;
            }
          }

          // Replace placeholders
          toastMessage = toastMessage
            .replace(/{{PROJECT_TITLE}}/g, updatedProject.title || "Project")
            .replace(/{{CLIENT_EMAIL}}/g, clientEmail)
            .replace(/{{EST_TIME}}/g, statusConfig.est_time || "2-3 business days");
          notificationMessage = toastMessage;
          console.log("📊 [UPDATE-STATUS] Final notification message:", notificationMessage);
        } else {
          console.log("📊 [UPDATE-STATUS] No toast message found for role:", userRole);
        }
      } else {
        console.log("📊 [UPDATE-STATUS] No status config found for status:", newStatus);
      }
    } catch (emailError) {
      console.error("📊 [UPDATE-STATUS] Error sending status change notifications:", emailError);
      console.error(
        "📊 [UPDATE-STATUS] Error details:",
        emailError instanceof Error ? emailError.stack : "No stack trace"
      );
      // Don't fail the request if email notifications fail
    }

    return new Response(
      JSON.stringify({
        success: true,
        project: updatedProject,
        message: notificationMessage,
        statusConfig: statusConfig
          ? {
              name: statusConfig.status_name,
              toast_admin: statusConfig.toast_admin,
              toast_client: statusConfig.toast_client,
              est_time: statusConfig.est_time,
            }
          : null,
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
  console.log("🔔 [UPDATE-STATUS] sendStatusChangeNotifications called with:", {
    projectId,
    newStatus,
    hasProjectData: !!projectData,
  });

  try {
    if (!supabase || !supabaseAdmin) {
      console.error("Supabase clients not available for notifications");
      return;
    }

    // Get status configuration from project_statuses table
    console.log("🔔 [UPDATE-STATUS] Fetching status configuration for status:", newStatus);
    const { data: statusConfig, error: statusError } = await supabase
      .from("project_statuses")
      .select(
        "notify, email_content, button_text, toast_admin, toast_client, status_name, est_time"
      )
      .eq("status_code", newStatus)
      .single();

    console.log("🔔 [UPDATE-STATUS] Status configuration result:", {
      hasData: !!statusConfig,
      error: statusError,
      statusCode: newStatus,
      config: statusConfig
        ? {
            notify: statusConfig.notify,
            hasEmailContent: !!statusConfig.email_content,
            hasButtonText: !!statusConfig.button_text,
          }
        : null,
    });

    if (statusError || !statusConfig) {
      console.log(`🔔 [UPDATE-STATUS] No status configuration found for status ${newStatus}`);
      return;
    }

    const { notify, email_content, button_text } = statusConfig;

    // Get project details for email
    console.log("🔔 [UPDATE-STATUS] Fetching project details for ID:", projectId);
    const { data: projectDetails, error: projectDetailsError } = await supabase
      .from("projects")
      .select("title, address, author_id, assigned_to_id")
      .eq("id", projectId)
      .single();

    console.log("🔔 [UPDATE-STATUS] Project details query result:", {
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

    // Get all users to notify
    const usersToNotify: Array<{
      email: string;
      first_name?: string;
      last_name?: string;
      company_name?: string;
    }> = [];

    console.log("🔔 [UPDATE-STATUS] Notification configuration:", {
      notify,
      projectId,
      newStatus,
    });

    if (notify.includes("admin") || notify.includes("Admin")) {
      // Get all admin users
      console.log("🔔 [UPDATE-STATUS] Fetching admin users...");
      console.log(
        "🔔 [UPDATE-STATUS] Notify array contains admin:",
        notify.includes("admin") || notify.includes("Admin")
      );

      // Try different case variations for the role
      console.log("🔔 [UPDATE-STATUS] Trying to find admin users...");

      let adminUsers = null;
      let adminError = null;

      // Try "Admin" first using admin client to bypass RLS
      const { data: adminUsers1, error: adminError1 } = await supabaseAdmin!
        .from("profiles")
        .select("id, first_name, last_name, company_name, role")
        .eq("role", "Admin");

      if (adminUsers1 && adminUsers1.length > 0) {
        adminUsers = adminUsers1;
        console.log("🔔 [UPDATE-STATUS] Found admin users with 'Admin'");
      } else {
        // Try "admin" (lowercase) using admin client
        const { data: adminUsers2, error: adminError2 } = await supabaseAdmin!
          .from("profiles")
          .select("id, first_name, last_name, company_name, role")
          .eq("role", "admin");

        if (adminUsers2 && adminUsers2.length > 0) {
          adminUsers = adminUsers2;
          console.log("🔔 [UPDATE-STATUS] Found admin users with 'admin'");
        } else {
          // Try "ADMIN" (uppercase) using admin client
          const { data: adminUsers3, error: adminError3 } = await supabaseAdmin!
            .from("profiles")
            .select("id, first_name, last_name, company_name, role")
            .eq("role", "ADMIN");

          if (adminUsers3 && adminUsers3.length > 0) {
            adminUsers = adminUsers3;
            console.log("🔔 [UPDATE-STATUS] Found admin users with 'ADMIN'");
          } else {
            adminError = adminError1 || adminError2 || adminError3;
            console.log("🔔 [UPDATE-STATUS] No admin users found with any case variation");
          }
        }
      }

      console.log("🔔 [UPDATE-STATUS] Admin profiles result:", {
        count: adminUsers?.length || 0,
        error: adminError,
        profiles: adminUsers?.map((p) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`.trim(),
          role: p.role,
        })),
      });

      if (adminUsers && adminUsers.length > 0) {
        // Fetch emails for admin users from auth.users
        const adminUsersWithEmails = [];
        for (const profile of adminUsers) {
          const { data: userData, error: userError } = await supabaseAdmin!.auth.admin.getUserById(
            profile.id
          );
          if (userData?.user?.email) {
            adminUsersWithEmails.push({
              email: userData.user.email,
              first_name: profile.first_name,
              last_name: profile.last_name,
              company_name: profile.company_name,
            });
          }
        }

        if (adminUsersWithEmails.length > 0) {
          usersToNotify.push(...adminUsersWithEmails);
          console.log(
            "🔔 [UPDATE-STATUS] Added admin users to notify list:",
            adminUsersWithEmails.map((u) => u.email)
          );
        } else {
          console.log("🔔 [UPDATE-STATUS] No admin user emails found");
        }
      } else {
        console.log("🔔 [UPDATE-STATUS] No admin users found");

        // Let's also check what roles exist in the database
        const { data: allRoles, error: rolesError } = await supabase
          .from("profiles")
          .select("role")
          .limit(10);

        console.log("🔔 [UPDATE-STATUS] Sample roles in database:", {
          roles: allRoles?.map((r) => r.role),
          error: rolesError,
        });
      }
    }

    if (notify.includes("staff") || notify.includes("Staff")) {
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

    if (
      notify.includes("client") ||
      notify.includes("Client") ||
      notify.includes("author") ||
      notify.includes("Author")
    ) {
      // Get author profile separately
      console.log("🔔 [UPDATE-STATUS] Fetching author profile for ID:", projectDetails.author_id);
      const { data: authorProfile, error: authorProfileError } = await supabase
        .from("profiles")
        .select("company_name")
        .eq("id", projectDetails.author_id)
        .single();

      // Get user email from auth system
      const { data: userData, error: userError } = await supabaseAdmin!.auth.admin.getUserById(
        projectDetails.author_id
      );

      console.log("🔔 [UPDATE-STATUS] Author profile and user query result:", {
        hasProfile: !!authorProfile,
        profileError: authorProfileError,
        hasUserData: !!userData,
        userError: userError,
        authorId: projectDetails.author_id,
        userEmail: userData?.user?.email,
        companyName: authorProfile?.company_name,
      });

      if (authorProfile && userData?.user?.email) {
        // Create a user object with the available data
        const userInfo = {
          email: userData.user.email,
          company_name: authorProfile.company_name,
          first_name: userData.user.user_metadata?.full_name?.split(" ")[0] || "",
          last_name: userData.user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
        };
        usersToNotify.push(userInfo);
        console.log("🔔 [UPDATE-STATUS] Added client user to notify list:", userInfo.email);
      } else {
        console.log("🔔 [UPDATE-STATUS] No client user found - missing profile or email");
        console.log("🔔 [UPDATE-STATUS] Debug info:", {
          hasAuthorProfile: !!authorProfile,
          hasUserData: !!userData,
          hasUserEmail: !!userData?.user?.email,
          authorProfileError: authorProfileError,
          userError: userError,
        });
      }
    }

    // Call the email delivery API
    console.log("🔔 [UPDATE-STATUS] Calling email delivery API with users:", usersToNotify.length);
    const emailResponse = await fetch("http://localhost:4321/api/email-delivery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        newStatus,
        usersToNotify,
        projectDetails: {
          title: projectDetails.title || "Project",
          address: projectDetails.address || "N/A",
          profiles: usersToNotify,
        },
        email_content,
        button_text,
      }),
    });

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
