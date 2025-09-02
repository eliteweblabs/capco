import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

// Server-side function to get user info directly from database
async function getUserInfoServer(userId: string) {
  // Get user metadata from auth.users table
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (authError || !authUser.user) {
    console.error("Error fetching auth user:", authError);
    return null;
  }

  // Get user profile from profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  console.log(`🔍 [USER-INFO] Profile data for ${userId}:`, profile);
  console.log(`🔍 [USER-INFO] Profile error:`, profileError);
  console.log(`🔍 [USER-INFO] Auth user metadata:`, authUser.user.user_metadata);

  // Combine auth user data with profile data
  const userInfo = {
    id: authUser.user.id,
    email: authUser.user.email,
    profile: profile || null,
    // Computed fields for easy access
    display_name:
      profile?.company_name ||
      profile?.name ||
      authUser.user.user_metadata?.full_name ||
      authUser.user.email?.split("@")[0] ||
      "Unknown User",
    company_name: profile?.company_name || null,
    name: profile?.name || null,
    role: profile?.role || "Unknown",
  };

  console.log(`🔍 [USER-INFO] Final userInfo for ${userId}:`, {
    company_name: userInfo.company_name,
    name: userInfo.name,
    display_name: userInfo.display_name,
    email: userInfo.email,
  });

  return userInfo;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, user, role } = await checkAuth(cookies);

    if (!isAuth || !user) {
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
    let { projectId, message, internal = false, sms_alert = false } = body;

    // Force internal = false for clients (only Admin/Staff can create internal comments)
    const isClient = role === "Client";
    if (isClient) {
      internal = false;
      console.log("📡 [ADD-DISCUSSION] Client user - forcing internal = false");
    }

    console.log("📡 [ADD-DISCUSSION] Comment settings:", {
      role,
      isClient,
      internal,
      sms_alert,
    });

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
      author_id: user.id,
      message: message.trim(),
      internal: internal,
      sms_alert: sms_alert,
    });

    const { data: discussion, error } = await supabase
      .from("discussion")
      .insert({
        project_id: projectIdInt,
        author_id: user.id,
        message: message.trim(),
        internal: internal,
        sms_alert: sms_alert,
      })
      .select(
        `
        id,
        created_at,
        message,
        author_id,
        internal,
        sms_alert,
        project_id
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
    console.log("🔔 [DISCUSSION] Fetching user info for user:", user.id);

    let userInfo = null;
    try {
      userInfo = await getUserInfoServer(user.id);
      console.log("🔔 [DISCUSSION] User info result:", userInfo);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }

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
          error: error.message,
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
      userRole: role,
      userInfo: userInfo
        ? {
            company_name: userInfo.company_name,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
          }
        : null,
    });

    if (isClient && !internal) {
      console.log("📧 [ADD-DISCUSSION] Client posted comment - sending admin notifications");
      try {
        // Get project address for the subject line
        let projectAddress = "";
        const { data: projectData } = await supabase
          .from("projects")
          .select("address, title")
          .eq("id", projectIdInt)
          .single();

        if (projectData) {
          projectAddress = projectData.address || projectData.title || "";
        }

        const clientName = userInfo?.company_name || userInfo?.first_name || "Client";
        const subjectLine = projectAddress
          ? `New Comment from ${clientName} - ${projectAddress}`
          : `New Comment from ${clientName}`;

        // Call email delivery API to notify all admins
        const emailResponse = await fetch(
          `${process.env.BASE_URL || "http://localhost:4321"}/api/email-delivery`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              projectId: projectIdInt,
              emailType: "client_comment",
              usersToNotify: [{ role: "Admin" }], // This will resolve to all admin users
              custom_subject: subjectLine,
              email_content: message.trim(),
              comment_timestamp: discussion.created_at,
              client_name:
                userInfo?.company_name ||
                `${userInfo?.first_name || ""} ${userInfo?.last_name || ""}`.trim() ||
                "Client",
            }),
          }
        );

        const emailResult = await emailResponse.json();
        if (emailResult.success) {
          console.log("📧 [ADD-DISCUSSION] Admin notification emails sent successfully");
        } else {
          console.error(
            "📧 [ADD-DISCUSSION] Failed to send admin notification emails:",
            emailResult.error
          );
        }
      } catch (emailError) {
        console.error("📧 [ADD-DISCUSSION] Error sending admin notification emails:", emailError);
        // Don't fail the comment creation if email fails
      }
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
