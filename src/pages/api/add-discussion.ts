import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { getApiBaseUrl } from "../../lib/url-utils";
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser, currentRole } = await checkAuth(cookies);

    if (!isAuth || !currentUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    let { projectId, message, internal = false, sms_alert = false, parent_id = null } = body;

    // Force internal = false for clients (only Admin/Staff can create internal comments)
    const isClient = currentRole === "Client";
    if (isClient) {
      internal = false;
      // console.log("📡 [ADD-DISCUSSION] Client user - forcing internal = false");
    }

    // console.log("📡 [ADD-DISCUSSION] Comment settings:", {
    //   currentRole,
    //   isClient,
    //   internal,
    //   sms_alert,
    // });

    if (!projectId || !message || message.trim() === "") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Project ID and message are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Convert projectId to integer since projects table uses integer IDs
    const projectIdInt = parseInt(projectId, 10);

    if (isNaN(projectIdInt)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid project ID format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add the discussion
    const { data: discussion, error } = await supabase
      .from("discussion")
      .insert({
        project_id: projectIdInt,
        author_id: currentUser.id,
        message: message.trim(),
        internal: internal,
        sms_alert: sms_alert,
        parent_id: parent_id,
        company_name: currentUser.profile?.company_name,
      })
      .select(
        `
        id,
        created_at,
        message,
        author_id,
        internal,
        sms_alert,
        project_id,
        parent_id,
        company_name
      `
      )
      .single();

    if (error) {
      console.error("Error adding discussion:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use company_name directly from the discussion record
    const discussionWithCompanyName = {
      ...discussion,
      company_name: discussion.company_name || "Unknown User",
    };

    if (error) {
      console.error("Error adding discussion:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to add discussion",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      // Get project address and author_id for the subject line
      let projectAddress = "";
      let projectAuthorId = "";
      const { data: projectData } = await supabase
        .from("projects")
        .select("address, title, author_id")
        .eq("id", projectIdInt)
        .single();

      if (projectData) {
        projectAddress = projectData.address || projectData.title || "";
        projectAuthorId = projectData.author_id || "";
      }

      const authorName = discussion.company_name || "User";

      // Always indicate if it's internal or not in subject and content
      const commentType = internal ? "Internal Discussion " : "Public Discussion ";
      const subjectLine = projectAddress
        ? `${commentType} → ${authorName} → ${projectAddress}`
        : `${commentType} → ${authorName}`;

      // Get admin and staff emails using reusable API
      // console.log("💬 [ADD-DISCUSSION] Fetching admin and staff emails...");
      const baseUrl = getApiBaseUrl(request);
      const adminStaffResponse = await fetch(`${baseUrl}/api/get-user-emails-by-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: ["Admin", "Staff"] }),
      });

      let adminStaffEmails = [];
      if (adminStaffResponse.ok) {
        const adminStaffData = await adminStaffResponse.json();
        adminStaffEmails = adminStaffData.emails || [];
        // console.log("💬 [ADD-DISCUSSION] Admin/Staff emails:", adminStaffEmails);
      } else {
        console.error("💬 [ADD-DISCUSSION] Failed to fetch admin/staff emails");
      }

      // Get client email if not internal
      let clientEmail = null;
      if (!internal && projectAuthorId) {
        const clientResponse = await fetch(`${baseUrl}/api/get-user-emails-by-role`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: [projectAuthorId] }),
        });

        if (clientResponse.ok) {
          const clientData = await clientResponse.json();
          clientEmail = clientData.emails?.[0] || null;
          // console.log("💬 [ADD-DISCUSSION] Client email:", clientEmail);
        } else {
          console.error("💬 [ADD-DISCUSSION] Failed to fetch client email");
        }
      }

      // Format the comment with timestamp
      const commentTime = new Date().toLocaleString();

      const emailContent = `
            <p><strong>${discussion.company_name}</strong> posted a new comment on <strong>${projectAddress}</strong>:</p>
            <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 16px; margin: 16px 0; border-radius: 4px;">
              <p style="margin: 0; font-style: italic;">"${message}"</p>
            </div>
            <p style="color: #6c757d; font-size: 14px;"><strong>Posted:</strong> ${commentTime}</p>
            <p>Please review and respond to this comment as needed.</p>
          `;

      // Replace placeholders for client comment emails

      const button_text = "View Comment & Respond";
      const button_link = `${getApiBaseUrl(request)}/project/${projectId}?tab=discussion`;

      // Send admin/staff emails
      // console.log("💬 [DISCUSSION] Using base URL for email delivery:", baseUrl);

      if (adminStaffEmails.length > 0) {
        // console.log("💬 [DISCUSSION] Sending admin/staff emails...");
        const adminEmailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usersToNotify: adminStaffEmails,
            emailType: "client_comment",
            emailSubject: subjectLine,
            emailContent: emailContent,
            buttonLink: button_link,
            buttonText: button_text,
          }),
        });

        if (adminEmailResponse.ok) {
          const adminEmailResult = await adminEmailResponse.json();
          // console.log("💬 [DISCUSSION] Admin/staff emails sent:", adminEmailResult);
        } else {
          console.error("💬 [DISCUSSION] Failed to send admin/staff emails");
        }
      }

      // Send client email if not internal
      if (!internal && clientEmail) {
        // console.log("💬 [DISCUSSION] Sending client email...");
        const clientEmailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usersToNotify: [clientEmail],
            emailType: "client_comment",
            emailSubject: subjectLine,
            emailContent: emailContent,
            buttonLink: button_link,
            buttonText: button_text,
          }),
        });

        if (clientEmailResponse.ok) {
          const clientEmailResult = await clientEmailResponse.json();
          // console.log("💬 [DISCUSSION] Client email sent:", clientEmailResult);
        } else {
          console.error("💬 [DISCUSSION] Failed to send client email");
        }
      }
    } catch (emailError) {
      console.error("📧 [ADD-DISCUSSION] Error sending notification emails:", emailError);
      // Don't fail the comment creation if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        discussion: discussionWithCompanyName,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Add discussion error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to add discussion",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
