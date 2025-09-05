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
    console.log("🔔 [DISCUSSION] Inserting discussion:", {
      project_id: projectIdInt,
      author_id: currentUser.id,
      message: message.trim(),
      internal: internal,
      sms_alert: sms_alert,
    });

    const { data: discussion, error } = await supabase
      .from("discussion")
      .insert({
        project_id: projectIdInt,
        author_id: currentUser.id,
        message: message.trim(),
        internal: internal,
        sms_alert: sms_alert,
        parent_id: parent_id,
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
        parent_id
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

    // Get the author profile using the server-side function
    console.log("🔔 [DISCUSSION] Fetching user info for user:", currentUser.id);

    const userInfo = {
      company_name: currentUser.company_name || currentUser.display_name,
      name: currentUser.display_name,
      display_name: currentUser.display_name,
      email: currentUser.email,
      profile: currentUser.profile,
    };
    console.log("🔔 [DISCUSSION] User info from currentUser:", userInfo);

    // Combine discussion with user info
    const discussionWithProfile = {
      ...discussion,
      profiles: userInfo || null,
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

    // Send email notification to all admins when a client posts a comment
    console.log("📧 [ADD-DISCUSSION] Email notification check:", {
      isClient,
      internal,
      shouldSendEmail: isClient && !internal,
      userRole: currentRole,
      userInfo: userInfo
        ? {
            company_name: userInfo.company_name,
            first_name: userInfo.profile?.first_name,
            last_name: userInfo.profile?.last_name,
          }
        : null,
    });

    //

    // Send notifications for ALL comments (new logic)
    console.log(
      "📧 [ADD-DISCUSSION] Sending notifications for comment - always email Admin + Staff"
    );

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

      const authorName =
        userInfo?.company_name || userInfo?.profile?.first_name || userInfo?.display_name || "User";

      // Always indicate if it's internal or not in subject and content
      const commentType = internal ? "Internal Comment" : "Public Comment";
      const subjectLine = projectAddress
        ? `New ${commentType} from ${authorName} - ${projectAddress}`
        : `New ${commentType} from ${authorName}`;

      // Prepare users to notify
      const usersToNotify: Array<{ role: string } | { email: string }> = [
        { role: "Admin" }, // Always notify all Admins
        { role: "Staff" }, // Always notify all Staff
      ];

      // If it's NOT internal, also notify the client (project author)
      if (!internal && projectAuthorId) {
        const { data: projectAuthor } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("id", projectAuthorId)
          .single();

        if (projectAuthor?.email) {
          usersToNotify.push({ email: projectAuthor.email });
          console.log(
            "📧 [ADD-DISCUSSION] Adding project author to notifications:",
            projectAuthor.email
          );
        }
      }

      console.log("📧 [ADD-DISCUSSION] Users to notify:", usersToNotify);

      // Call email delivery API to notify everyone
      const baseUrl = getApiBaseUrl(request);
      console.log("💬 [DISCUSSION] Using base URL for email delivery:", baseUrl);
      const emailResponse = await fetch(`${baseUrl}/api/email-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: projectIdInt,
          emailType: "client_comment",
          usersToNotify: usersToNotify,
          custom_subject: subjectLine,
          email_content: message.trim(),
          comment_timestamp: discussion.created_at,
          client_name:
            userInfo?.company_name ||
            `${userInfo?.profile?.first_name || ""} ${userInfo?.profile?.last_name || ""}`.trim() ||
            "Client",
        }),
      });

      const emailResult = await emailResponse.json();
      if (emailResult.success) {
        console.log(
          "📧 [ADD-DISCUSSION] Notification emails sent successfully to Admin + Staff" +
            (!internal ? " + Client" : "")
        );
      } else {
        console.error("📧 [ADD-DISCUSSION] Failed to send notification emails:", emailResult.error);
      }
    } catch (emailError) {
      console.error("📧 [ADD-DISCUSSION] Error sending notification emails:", emailError);
      // Don't fail the comment creation if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        discussion: discussionWithProfile,
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
