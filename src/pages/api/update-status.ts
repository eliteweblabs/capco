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
    const { currentUser } = await checkAuth(cookies);

    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const currentRole = currentUser.role;

    const body = await request.json();
    const { projectId, status: newStatus } = body;

    // Use the authenticated user's role

    // Debug logging for parameter validation
    // console.log("📊 [UPDATE-STATUS] Request body:", body);
    // console.log("📊 [UPDATE-STATUS] Parsed projectId:", projectId, "(type:", typeof projectId, ")");
    // console.log("📊 [UPDATE-STATUS] Parsed newStatus:", newStatus, "(type:", typeof newStatus, ")");

    if (!projectId || newStatus === undefined) {
      console.error("📊 [UPDATE-STATUS] Validation failed:", {
        projectId,
        newStatus,
        projectIdCheck: !projectId,
      });
      return new Response(
        JSON.stringify({
          error: "Project ID and new status are required",
          received: { projectId, newStatus },
          validation: {
            projectIdMissing: !projectId,
            newStatusMissing: newStatus === undefined,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch current project status before updating
    const { data: currentProject, error: fetchError } = await supabase
      .from("projects")
      .select("status")
      .eq("id", projectId)
      .single();

    if (fetchError) {
      console.error("📊 [UPDATE-STATUS] Error fetching current project:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch current project status" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const oldStatus = currentProject.status;

    // this used to use modal_auto_redirect_admin and modal_auto_redirect_client

    console.log("📊 [UPDATE-STATUS] Updating project status:", { projectId, newStatus, oldStatus });

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
      await SimpleProjectLogger.logStatusChange(projectId, currentUser, oldStatus, newStatus);
      // console.log("📊 [UPDATE-STATUS] Status change logged successfully");
    } catch (logError) {
      console.error("📊 [UPDATE-STATUS] Failed to log status change:", logError);
      // Don't fail the entire request if logging fails
    }

    // Get status data after successful update
    // Get base URL using the proper utility function
    const baseUrl = getApiBaseUrl(request);
    const statusDataResponse = await fetch(
      `${baseUrl}/api/project-statuses?status_code=${newStatus}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (statusDataResponse.ok) {
      const statusData = await statusDataResponse.json();
      // console.log("📊 [UPDATE-STATUS] Status data retrieved:", statusData);
      // console.log("🔍 [UPDATE-STATUS] Button config debug:", {
      //   button_link: statusData.statusConfig.button_link,
      //   button_text: statusData.statusConfig.button_text,
      //   hasButtonLink: !!statusData.statusConfig.button_link,
      //   hasButtonText: !!statusData.statusConfig.button_text,
      // });

      // Merge project data with status config for placeholder replacement
      const mergedData = {
        project: updatedProject,
        statusConfig: statusData.statusConfig,
        newStatus: newStatus,
      };

      // console.log("📊 [UPDATE-STATUS] Merged data for placeholder replacement:", mergedData);

      // Get client profile data for placeholders
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, company_name, first_name, last_name, role, email")
        .eq("id", updatedProject.author_id);

      if (profileError) {
        console.error("📊 [UPDATE-STATUS] Profile query error:", profileError);
        return new Response(JSON.stringify({ error: profileError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!profiles || profiles.length === 0) {
        console.warn(
          "📊 [UPDATE-STATUS] No profile found for author_id:",
          updatedProject.author_id
        );
        // Continue with empty profile data rather than failing
      }

      const profile = profiles && profiles.length > 0 ? profiles[0] : null;

      // Get client email from profiles table (already fetched above)
      const clientEmail = profile?.email || "";

      // Prepare placeholder data
      const placeholderData = {
        projectId: updatedProject.id,
        siteUrl: baseUrl,
        projectAddress: updatedProject.address,
        clientName: profile?.company_name,
        clientEmail: clientEmail,
        statusName: statusData.statusConfig.admin_status_name,
        estTime: statusData.statusConfig.est_time,
        primaryColor: "#3b82f6", // Default primary color (can be made configurable later)
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
        console.log("📊 [UPDATE-STATUS] Placeholders replaced:", placeholderResult);

        // Process redirect URLs to replace placeholders
        const processRedirectUrl = (url: string) => {
          if (!url) return undefined;
          return url.replace(/\{\{PROJECT_ID\}\}/g, updatedProject.id.toString());
        };

        // Debug: Log the status configuration to see what's available
        // console.log("🔍 [UPDATE-STATUS] Status config for status", newStatus, ":", {
        //   modal_admin: statusData.statusConfig.modal_admin,
        //   modal_client: statusData.statusConfig.modal_client,
        //   processedMessages: placeholderResult.processedMessages,
        // });

        // Return notification data with user role information
        const notificationData = {
          admin: {
            type: "success",
            title: "Project Updated",
            message:
              placeholderResult.processedMessages.modal_admin || "Project updated successfully",
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
            title: "Project Updated",
            message:
              placeholderResult.processedMessages.modal_client || "Project updated successfully",
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
          currentUserRole: currentRole,
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

        // Process button link and text through placeholder replacement (without bold tags)
        let processedButtonLink = statusData.statusConfig.button_link || "";
        let processedButtonText = statusData.statusConfig.button_text || "";

        if (processedButtonLink) {
          // Add # prefix if it doesn't start with http or #
          if (!processedButtonLink.startsWith("http") && !processedButtonLink.startsWith("#")) {
            processedButtonLink = "#" + processedButtonLink;
          }
          // Process placeholders without bold tags
          const { replacePlaceholders } = await import("../../lib/placeholder-utils");
          processedButtonLink = replacePlaceholders(processedButtonLink, placeholderData, false);
        }

        if (processedButtonText) {
          // Process placeholders without bold tags
          const { replacePlaceholders } = await import("../../lib/placeholder-utils");
          processedButtonText = replacePlaceholders(processedButtonText, placeholderData, false);
        }

        // console.log("🔍 [UPDATE-STATUS] Processed button config:", {
        //   originalLink: statusData.statusConfig.button_link,
        //   processedLink: processedButtonLink,
        //   originalText: statusData.statusConfig.button_text,
        //   processedText: processedButtonText,
        // });

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
            buttonLink: processedButtonLink,
            buttonText: processedButtonText,
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
            buttonLink: processedButtonLink, // Use processed button link
            buttonText: processedButtonText, // Use processed button text
          }),
        });

        if (adminEmailResponse.ok) {
          const adminEmailResult = await adminEmailResponse.json();
          // console.log("📊 [UPDATE-STATUS] Admin emails sent:", adminEmailResult);
        } else {
          console.error("📊 [UPDATE-STATUS] Failed to send admin emails");
        }

        // TODO: Implement cross-user push notifications via Bird.com
        // Currently commented out because:
        // 1. Web push notifications only work for the current authenticated user
        // 2. If user triggered the action, they already see the modal
        // 3. Need to implement Bird.com integration for cross-user notifications
        /*
        // Send push notifications to all relevant users
        try {
          console.log("📱 [UPDATE-STATUS] Sending push notifications...");

          // Prepare push notification data
          const pushNotificationData = {
            title: "Project Status Updated",
            body: `${updatedProject.address} - ${statusData.statusConfig.status_name}`,
            icon: "/favicon.svg",
            badge: "/favicon.svg",
            tag: `project-${projectId}`,
            data: {
              type: "project_status_update",
              projectId: projectId,
              newStatus: newStatus,
              projectAddress: updatedProject.address,
              statusName: statusData.statusConfig.status_name,
              url: `${baseUrl}/project/${projectId}`,
            },
            actions: [
              {
                action: "view",
                title: "View Project",
                icon: "/favicon.svg",
              },
            ],
          };

          // Store notification in database for all users (admins, staff, and client)
          const allUserEmails = [...adminStaffEmails, clientEmail];
          const notificationResponse = await fetch(`${baseUrl}/api/store-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userEmails: allUserEmails,
              notification: pushNotificationData,
            }),
          });

          if (notificationResponse.ok) {
            const notificationResult = await notificationResponse.json();
            console.log("📱 [UPDATE-STATUS] Notifications stored:", notificationResult);
          } else {
            console.error("📱 [UPDATE-STATUS] Failed to store notifications");
          }
        } catch (pushError) {
          console.error("📱 [UPDATE-STATUS] Push notification error:", pushError);
          // Don't fail the entire request if push notifications fail
        }
        */

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
