import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { getApiBaseUrl } from "../../lib/url-utils";

// Unified discussion API that handles both global and project discussions
export const GET: APIRoute = async ({ cookies, url }) => {
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

    // Parse query parameters
    const searchParams = url.searchParams;
    const projectId = searchParams.get("projectId"); // null for global discussions
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const internalFilter = searchParams.get("internal"); // "true", "false", or "all"
    const completedFilter = searchParams.get("completed"); // "true", "false", or "all"

    console.log(
      `📡 [DISCUSSIONS] Fetching discussions: projectId=${projectId}, limit=${limit}, offset=${offset}, internal=${internalFilter}, completed=${completedFilter}`
    );

    // Build query
    let query = supabase.from("discussion").select(`
      id,
      project_id,
      author_id,
      message,
      internal,
      mark_completed,
      parent_id,
      image_urls,
      image_paths,
      company_name,
      created_at,
      updated_at,
      projects (
        id,
        address,
        title,
        author_id
      )
    `);

    // Filter by project if specified
    if (projectId) {
      query = query.eq("project_id", parseInt(projectId));
    }

    // Order by creation date
    query = query.order("created_at", { ascending: false });

    const { data: discussions, error: discussionsError } = await query;

    if (discussionsError) {
      console.error("❌ [DISCUSSIONS] Error fetching discussions:", discussionsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch discussions",
          details: discussionsError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get unique author IDs
    const authorIds = [...new Set(discussions?.map((d: any) => d.author_id) || [])];

    // Fetch author profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, company_name, role")
      .in("id", authorIds);

    const profilesMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

    // Get unique project owner IDs
    const projectOwnerIds = [
      ...new Set(discussions?.map((d: any) => d.projects?.author_id).filter(Boolean) || []),
    ];

    // Fetch project owner profiles
    const { data: ownerProfiles } = await supabase
      .from("profiles")
      .select("id, company_name")
      .in("id", projectOwnerIds);

    const ownerProfilesMap = new Map(ownerProfiles?.map((p: any) => [p.id, p]) || []);

    // Enrich discussions with author and project owner information
    const enrichedDiscussions = (discussions || []).map((discussion: any) => {
      const authorProfile = profilesMap.get(discussion.author_id);
      const ownerProfile = ownerProfilesMap.get(discussion.projects?.author_id);

      return {
        id: discussion.id,
        project_id: discussion.project_id,
        project_address: discussion.projects?.address || "Unknown Address",
        project_title: discussion.projects?.title || "Untitled",
        project_owner: ownerProfile?.company_name || "Unknown",
        project_owner_id: discussion.projects?.author_id,
        author_id: discussion.author_id,
        author_name: authorProfile?.company_name || "Unknown User",
        author_role: authorProfile?.role || "Unknown",
        message: discussion.message,
        internal: discussion.internal || false,
        mark_completed: discussion.mark_completed || false,
        parent_id: discussion.parent_id,
        is_reply: !!discussion.parent_id,
        image_urls: discussion.image_urls,
        image_paths: discussion.image_paths,
        company_name: discussion.company_name,
        created_at: discussion.created_at,
        updated_at: discussion.updated_at,
      };
    });

    // Apply filters
    let filteredDiscussions = enrichedDiscussions;

    if (internalFilter && internalFilter !== "all") {
      const isInternal = internalFilter === "true";
      filteredDiscussions = filteredDiscussions.filter((d: any) => d.internal === isInternal);
    }

    if (completedFilter && completedFilter !== "all") {
      const isCompleted = completedFilter === "true";
      filteredDiscussions = filteredDiscussions.filter(
        (d: any) => d.mark_completed === isCompleted
      );
    }

    // Apply pagination
    const paginatedDiscussions = filteredDiscussions.slice(offset, offset + limit);

    // Calculate stats
    const totalDiscussions = enrichedDiscussions.length;
    const internalCount = enrichedDiscussions.filter((d: any) => d.internal).length;
    const completedCount = enrichedDiscussions.filter((d: any) => d.mark_completed).length;
    const repliesCount = enrichedDiscussions.filter((d: any) => d.is_reply).length;

    // Get recent (24h) count
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentCount = enrichedDiscussions.filter((d: any) => {
      const discussionDate = new Date(d.created_at);
      return discussionDate >= yesterday;
    }).length;

    // Get unique active users (last 24h)
    const activeUserIds = new Set(
      enrichedDiscussions
        .filter((d: any) => {
          const discussionDate = new Date(d.created_at);
          return discussionDate >= yesterday;
        })
        .map((d: any) => d.author_id)
    );

    console.log(
      `✅ [DISCUSSIONS] Returning ${paginatedDiscussions.length} discussions (${filteredDiscussions.length} total after filters)`
    );

    return new Response(
      JSON.stringify({
        success: true,
        discussions: paginatedDiscussions,
        total: filteredDiscussions.length,
        total_all: totalDiscussions,
        stats: {
          total: totalDiscussions,
          internal: internalCount,
          completed: completedCount,
          replies: repliesCount,
          recent_24h: recentCount,
          active_users_24h: activeUserIds.size,
        },
        pagination: {
          limit,
          offset,
          has_more: offset + limit < filteredDiscussions.length,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [DISCUSSIONS] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

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
    }

    // For global discussions, projectId can be null
    if (projectId && (!message || message.trim() === "")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Message is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Convert projectId to integer if provided
    const projectIdInt = projectId ? parseInt(projectId, 10) : null;
    if (projectId && isNaN(projectIdInt!)) {
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

    // Send notification emails if projectId is provided
    if (projectIdInt) {
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

        const button_text = "View Comment & Respond";
        const button_link = `${getApiBaseUrl(request)}/project/${projectId}?tab=discussion`;

        // Send admin/staff emails
        if (adminStaffEmails.length > 0) {
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
        }

        // Send client email if not internal
        if (!internal && clientEmail) {
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
        }
      } catch (emailError) {
        console.error("📧 [DISCUSSIONS] Error sending notification emails:", emailError);
        // Don't fail the comment creation if email fails
      }
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
