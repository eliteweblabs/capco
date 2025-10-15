import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { getApiBaseUrl } from "../../../lib/url-utils";

/**
 * Standardized Discussions UPSERT API
 *
 * Handles both creating new discussions and updating existing ones
 * Includes notification logic for email/SMS alerts
 *
 * POST Body:
 * - id?: number (if updating existing discussion)
 * - projectId: number
 * - message: string
 * - internal?: boolean (default: false)
 * - smsAlert?: boolean (default: false)
 * - parentId?: number (for replies)
 *
 * Examples:
 * - Create: POST /api/discussions/upsert { projectId, message, internal: false }
 * - Update: POST /api/discussions/upsert { id, message, internal: true }
 */

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
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    console.log("Add discussion request body:", body);
    let { projectId, message, internal = false, smsAlert = false, parentId = null } = body;
    console.log("Extracted values:", { projectId, message, internal, smsAlert, parentId });

    // Force internal = false for clients (only Admin/Staff can create internal comments)
    const isClient = currentRole === "Client";
    if (isClient) {
      internal = false;
    }

    if (!projectId || !message || message.trim() === "") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Project ID and message are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Add the discussion
    const discussionData = {
      projectId: projectIdInt,
      authorId: currentUser.id,
      message: message.trim(),
      internal: internal,
      smsAlert: smsAlert,
      parentId: parentId,
      companyName: currentUser.profile?.companyName,
    };

    const { data: discussion, error } = await supabase
      .from("discussion")
      .insert(discussionData)
      .select(
        `
        id,
        createdAt,
        message,
        authorId,
        internal,
        smsAlert,
        projectId,
        parentId,
        companyName
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
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      // Get project address and authorId for the subject line
      let address = "";
      let projectAuthorId = "";
      const { data: projectData } = await supabase
        .from("projects")
        .select("address, title, authorId")
        .eq("id", projectIdInt)
        .single();

      if (projectData) {
        address = projectData.address || projectData.title || "";
        projectAuthorId = projectData.authorId || "";
      }

      const authorName = discussion.companyName || "User";

      // Always indicate if it's internal or not in subject and content
      const commentType = internal ? "Internal Discussion " : "Public Discussion ";
      const subjectLine = address
        ? `${commentType} → ${authorName} → ${address}`
        : `${commentType} → ${authorName}`;

      // Get admin and staff emails using reusable API
      const baseUrl = getApiBaseUrl(request);
      const adminStaffResponse = await fetch(`${baseUrl}/api/users?role=Admin&role=Staff`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      let adminStaffEmails = [];
      let adminStaffUserIds = [];
      if (adminStaffResponse.ok) {
        const adminStaffData = await adminStaffResponse.json();
        const users = adminStaffData.data || [];
        adminStaffEmails = users.map((user: any) => user.email).filter(Boolean);
        adminStaffUserIds = users.map((user: any) => user.id);
      } else {
        console.error("💬 [ADD-DISCUSSION] Failed to fetch admin/staff emails");
      }

      // Get client email if not internal
      let clientEmail = null;
      if (!internal && projectAuthorId) {
        const clientResponse = await fetch(`${baseUrl}/api/users?id=${projectAuthorId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (clientResponse.ok) {
          const clientData = await clientResponse.json();
          clientEmail = clientData.data?.email || null;
        } else {
          console.error("💬 [ADD-DISCUSSION] Failed to fetch client email");
        }
      }

      // Format the comment with timestamp
      const commentTime = new Date().toLocaleString();

      const emailContent = `
            <p><strong>${discussion.companyName}</strong> posted a new comment on <strong>${address}</strong>:</p>
            <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 16px; margin: 16px 0; border-radius: 4px;">
              <p style="margin: 0; font-style: italic;">"${message}"</p>
            </div>
            <p style="color: #6c757d; font-size: 14px;"><strong>Posted:</strong> ${commentTime}</p>
            <p>Please review and respond to this comment as needed.</p>
          `;

      const buttonText = "View Comment & Respond";
      const buttonLink = `${getApiBaseUrl(request)}/project/${projectId}?tab=discussion`;

      // Send admin/staff emails
      if (adminStaffEmails.length > 0) {
        const adminEmailResponse = await fetch(`${baseUrl}/api/update-delivery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usersToNotify: adminStaffEmails,
            userIdsToNotify: adminStaffUserIds,
            method: "internal",
            emailSubject: subjectLine,
            emailContent: emailContent,
            buttonLink: buttonLink,
            buttonText: buttonText,
          }),
        });

        if (!adminEmailResponse.ok) {
          console.error("💬 [DISCUSSION] Failed to send admin/staff emails");
        }
      }

      // Send client email if not internal
      if (!internal && clientEmail) {
        const clientEmailResponse = await fetch(`${baseUrl}/api/update-delivery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usersToNotify: [clientEmail],
            method: "email",
            emailSubject: subjectLine,
            emailContent: emailContent,
            buttonLink: buttonLink,
            buttonText: buttonText,
          }),
        });

        if (!clientEmailResponse.ok) {
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
        discussion: discussion,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Add discussion error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to add discussion",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
