// {
//   project: {
//     id: 155,
//     status: 20,
//     author_id: 'd566a533-9da8-46c9-b1b4-d4e8dae1e8bc',
//     title: 'New School Fire Protection',
//     address: '4536 Washington Avenue, Porter Square, Weymouth, MA'
//   },
//   statusConfig: {
//     id: 2,
//     status_code: 20,
//     status_name: 'Generating Proposal',
//     email_content: "We are currently generating a detailed proposal for <b>{{CLIENT_NAME}}'s</b> new project at <b>{{PROJECT_ADDRESS}}<b> based on the specifications provided.",
//     est_time: '3-5 business days',
//     created_at: '2025-08-06T21:53:31.889053+00:00',
//     updated_at: '2025-08-06T21:53:31.889053+00:00',
//     notify: [ 'Admin', 'Client' ],
//     admin_visible: true,
//     active: null,
//     client_visible: true,
//     button_text: 'Project Dashboard',
//     email_subject: '{{PROJECT_ADDRESS}} > Proposal is Being Generated',
//     modal_admin: 'Project documents successfully uploaded. Email sent to {{CLIENT_EMAIL}} notifying them that they will receive a proposal in {{EST_TIME}}.',
//     modal_client: 'We have received your project documents and will begin preparing a proposal of services. We will notify you at <b>{{CLIENT_EMAIL}}</b> in {{EST_TIME}}.',
//     button_link: '/dashboard',
//     project_action: null,
//     modal_auto_redirect: '/dashboard',
//     admin_email_content: null,
//     admin_email_subject: null
//   },
//   newStatus: 20
// }

import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { getApiBaseUrl } from "../../lib/url-utils";

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
  try {
    // Get current user from authentication
    const { currentUser, currentRole } = await checkAuth(cookies);

    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { projectId, status: newStatus, oldStatus } = body;

    // Use the authenticated user's role
    const currentUserRole = currentRole || "Client";

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

    // this used to use modal_auto_redirect_admin and modal_auto_redirect_client

    // console.log("📊 [UPDATE-STATUS] Updating project status:", { projectId, newStatus });

    // Update project status
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select("id, status, author_id, address, proposal_signature")
      .single();

    if (updateError) {
      console.error("📊 [UPDATE-STATUS] Database error:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log the status change using authenticated user
    try {
      // console.log("📊 [UPDATE-STATUS] Logging status change for user:", currentUser.id);
      await SimpleProjectLogger.logStatusChange(projectId, currentUser.id, oldStatus, newStatus);
      // console.log("📊 [UPDATE-STATUS] Status change logged successfully");
    } catch (logError) {
      console.error("📊 [UPDATE-STATUS] Failed to log status change:", logError);
      // Don't fail the entire request if logging fails
    }

    // Get status data after successful update
    // Get base URL using the proper utility function
    const baseUrl = getApiBaseUrl(request);
    const statusDataResponse = await fetch(`${baseUrl}/api/get-project-status-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status_code: newStatus }),
    });

    if (statusDataResponse.ok) {
      const statusData = await statusDataResponse.json();
      // console.log("📊 [UPDATE-STATUS] Status data retrieved:", statusData);

      // Merge project data with status config for placeholder replacement
      const mergedData = {
        project: updatedProject,
        statusConfig: statusData.statusConfig,
        newStatus: newStatus,
      };

      // console.log("📊 [UPDATE-STATUS] Merged data for placeholder replacement:", mergedData);

      // Get client profile data for placeholders
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, company_name, first_name, last_name, role")
        .eq("id", updatedProject.author_id)
        .single();

      if (profileError) {
        console.error("📊 [UPDATE-STATUS] Profile error:", profileError);
        return new Response(JSON.stringify({ error: profileError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get client email from auth.users using admin client
      if (!supabaseAdmin) {
        console.error("📊 [UPDATE-STATUS] Supabase admin client not available");
        return new Response(JSON.stringify({ error: "Admin client not available" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(
        updatedProject.author_id
      );

      if (authError || !authData.user) {
        console.error("📊 [UPDATE-STATUS] Auth error:", authError);
        return new Response(JSON.stringify({ error: "Failed to get client email" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const clientEmail = authData.user.email || "";

      // Prepare placeholder data
      const placeholderData = {
        projectId: updatedProject.id,
        siteUrl: baseUrl,
        projectAddress: updatedProject.address,
        clientName: profile.company_name,
        clientEmail: clientEmail,
        statusName: statusData.statusConfig.admin_status_name,
        estTime: statusData.statusConfig.est_time,
      };

      // console.log("📊 [UPDATE-STATUS] Placeholder data prepared:", placeholderData);

      // Call placeholder replacement API
      const placeholderResponse = await fetch(`${baseUrl}/api/replace-placeholders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mergedData, placeholderData }),
      });

      if (placeholderResponse.ok) {
        const placeholderResult = await placeholderResponse.json();
        // console.log("📊 [UPDATE-STATUS] Placeholders replaced:", placeholderResult);

        // Process redirect URLs to replace placeholders
        const processRedirectUrl = (url: string) => {
          if (!url) return undefined;
          return url.replace(/\{\{PROJECT_ID\}\}/g, updatedProject.id.toString());
        };

        // Debug: Log the status configuration to see what's available
        console.log("🔍 [UPDATE-STATUS] Status config for status", newStatus, ":", {
          modal_admin: statusData.statusConfig.modal_admin,
          modal_client: statusData.statusConfig.modal_client,
          processedMessages: placeholderResult.processedMessages,
        });

        // Return notification data with user role information
        const notificationData = {
          admin: {
            type: "success",
            title: "Status Updated",
            message:
              placeholderResult.processedMessages.modal_admin || "Status updated successfully",
            duration: 5000, // 5 seconds
            redirect: statusData.statusConfig.modal_auto_redirect_admin
              ? {
                  url: processRedirectUrl(statusData.statusConfig.modal_auto_redirect_admin),
                  delay: 3, // 3 seconds delay
                  showCountdown: true,
                }
              : undefined,
          },
          client: {
            type: "success",
            title: "Status Updated",
            message:
              placeholderResult.processedMessages.modal_client || "Status updated successfully",
            duration: 5000, // 5 seconds
            redirect: statusData.statusConfig.modal_auto_redirect_client
              ? {
                  url: processRedirectUrl(statusData.statusConfig.modal_auto_redirect_client),
                  delay: 3, // 3 seconds delay
                  showCountdown: true,
                }
              : undefined,
          },
          // Include the current user's role for frontend to use
          currentUserRole: currentUserRole,
        };

        // console.log("📊 [UPDATE-STATUS] Notification data prepared:", {
        //   adminRedirect: statusData.statusConfig.modal_auto_redirect_admin,
        //   clientRedirect: statusData.statusConfig.modal_auto_redirect_client,
        //   projectId: updatedProject.id,
        //   notificationData,
        // });

        // console.log("📊 [UPDATE-STATUS] About to fetch admin and staff emails...");
        // console.log(
        //   "📊 [UPDATE-STATUS] Final notification data:",
        //   JSON.stringify(notificationData, null, 2)
        // );

        // Get admin and staff emails using reusable API
        const adminStaffResponse = await fetch(`${baseUrl}/api/get-user-emails-by-role`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roles: ["Admin", "Staff"] }),
        });

        let adminStaffEmails = [];
        if (adminStaffResponse.ok) {
          const adminStaffData = await adminStaffResponse.json();
          adminStaffEmails = adminStaffData.emails || [];
          // console.log("📊 [UPDATE-STATUS] Admin/Staff emails:", adminStaffEmails);
        } else {
          console.error("📊 [UPDATE-STATUS] Failed to fetch admin/staff emails");
        }

        // Send client email using original email delivery API
        // console.log("📊 [UPDATE-STATUS] Sending client email...");
        const clientEmailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usersToNotify: [clientEmail], // Use resolved client email
            emailSubject: placeholderResult.processedMessages.client_email_subject,
            emailContent: placeholderResult.processedMessages.client_email_content,
            buttonLink: statusData.statusConfig.button_link,
            buttonText: statusData.statusConfig.button_text,
            projectId: projectId,
            newStatus: newStatus,
            authorId: updatedProject.author_id,
            includeResendHeaders: true, // Only include webhook headers for client emails
          }),
        });

        if (clientEmailResponse.ok) {
          const clientEmailResult = await clientEmailResponse.json();
          // console.log("📊 [UPDATE-STATUS] Client email sent:", clientEmailResult);
        } else {
          console.error("📊 [UPDATE-STATUS] Failed to send client email");
        }

        // Send admin emails using original email delivery API
        // console.log("📊 [UPDATE-STATUS] Sending admin emails...");
        const adminEmailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usersToNotify: adminStaffEmails, // Use resolved admin/staff emails
            emailSubject: placeholderResult.processedMessages.admin_email_subject,
            emailContent: placeholderResult.processedMessages.admin_email_content,
            buttonLink: statusData.statusConfig.button_link,
            buttonText: statusData.statusConfig.button_text,
          }),
        });

        if (adminEmailResponse.ok) {
          const adminEmailResult = await adminEmailResponse.json();
          // console.log("📊 [UPDATE-STATUS] Admin emails sent:", adminEmailResult);
        } else {
          console.error("📊 [UPDATE-STATUS] Failed to send admin emails");
        }

        return new Response(
          JSON.stringify({
            success: true,
            project: updatedProject,
            newStatus: newStatus,
            statusConfig: statusData.statusConfig,
            mergedData: placeholderResult.mergedData,
            placeholderData: placeholderResult.placeholderData,
            processedMessages: placeholderResult.processedMessages,
            notificationData: notificationData,
            clientEmail: clientEmail,
            clientProfile: profile,
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
      } else {
        console.error("📊 [UPDATE-STATUS] Failed to replace placeholders");
        return new Response(
          JSON.stringify({
            success: true,
            project: updatedProject,
            newStatus: newStatus,
            statusConfig: statusData.statusConfig,
            mergedData: mergedData,
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
      }
    } else {
      console.error("📊 [UPDATE-STATUS] Failed to get status data");
      return new Response(
        JSON.stringify({
          success: true,
          project: updatedProject,
          newStatus: newStatus,
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
    }
  } catch (error) {
    console.error("📊 [UPDATE-STATUS] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
