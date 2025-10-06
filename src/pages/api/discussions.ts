import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { replacePlaceholders, type PlaceholderData } from "../../lib/placeholder-utils";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication to get user role for filtering
    const { currentUser, currentRole } = await checkAuth(cookies);
    const isClient = currentRole === "Client";
    const isAdmin = currentRole === "Admin";

    if (!currentUser) {
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
    const projectId = url.searchParams.get("projectId");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const internalFilter = url.searchParams.get("internal"); // "true", "false", or "all"
    const completedFilter = url.searchParams.get("completed"); // "true", "false", or "all"
    const isGlobal = url.searchParams.get("global") === "true";

    console.log(
      `📡 [GET-DISCUSSIONS] Fetching discussions: projectId=${projectId}, global=${isGlobal}, limit=${limit}, offset=${offset}, internal=${internalFilter}, completed=${completedFilter}`
    );

    // For global discussions, require admin access
    if (isGlobal && !isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Admin access required for global discussions",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // For project discussions, projectId is optional - if not provided, return all discussions
    // Only require projectId if explicitly filtering for a specific project

    let discussionsQuery = supabase.from("discussion").select(
      `
        id,
        created_at,
        message,
        author_id,
        project_id,
        internal,
        mark_completed,
        parent_id,
        image_urls,
        image_paths,
        company_name,
        updated_at,
        projects!inner (
          id,
          address,
          title,
          author_id
        )
      `
    );

    // Apply project filter only if projectId is provided
    if (projectId) {
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
      discussionsQuery = discussionsQuery.eq("project_id", projectIdInt);
    }

    // For clients, exclude internal discussions (Admin/Staff see all)
    if (isClient) {
      discussionsQuery = discussionsQuery.eq("internal", false);
    }

    // Apply internal filter if specified
    if (internalFilter && internalFilter !== "all") {
      const isInternal = internalFilter === "true";
      discussionsQuery = discussionsQuery.eq("internal", isInternal);
    }

    // Apply completed filter if specified
    if (completedFilter && completedFilter !== "all") {
      const isCompleted = completedFilter === "true";
      discussionsQuery = discussionsQuery.eq("mark_completed", isCompleted);
    }

    const { data: discussions, error } = await discussionsQuery.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching discussions:", error);
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

    // Get project data for placeholder replacement (only when projectId is provided)
    let project = null;
    let projectAuthor = null;
    if (projectId) {
      const projectIdInt = parseInt(projectId, 10);
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectIdInt)
        .single();

      if (projectError) {
        console.error("Error fetching project for placeholders:", projectError);
      } else {
        project = projectData;

        // Get project author's profile data for placeholders
        if (project?.author_id) {
          const { data: authorProfile, error: authorError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", project.author_id)
            .single();

          if (authorError) {
            console.error("Error fetching author profile for placeholders:", authorError);
          } else {
            projectAuthor = authorProfile;
          }
        }
      }
    }

    // Prepare placeholder data for centralized replacement
    const placeholderData: PlaceholderData = {
      project: {
        ...project,
        authorProfile: projectAuthor,
      },
    };

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
        message: isGlobal
          ? discussion.message
          : replacePlaceholders(discussion.message, placeholderData, true),
        internal: discussion.internal || false,
        mark_completed: discussion.mark_completed || false,
        parent_id: discussion.parent_id,
        is_reply: !!discussion.parent_id,
        image_urls: discussion.image_urls,
        image_paths: discussion.image_paths,
        company_name: discussion.company_name || "Unknown User",
        created_at: discussion.created_at,
        updated_at: discussion.updated_at,
      };
    });

    // Apply pagination
    const paginatedDiscussions = enrichedDiscussions.slice(offset, offset + limit);

    // Calculate stats (only for global discussions)
    let stats = null;
    if (isGlobal) {
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

      stats = {
        total: totalDiscussions,
        internal: internalCount,
        completed: completedCount,
        replies: repliesCount,
        recent_24h: recentCount,
        active_users_24h: activeUserIds.size,
      };
    }

    console.log(
      `✅ [GET-DISCUSSIONS] Returning ${paginatedDiscussions.length} discussions (${enrichedDiscussions.length} total)`
    );

    return new Response(
      JSON.stringify({
        success: true,
        discussions: paginatedDiscussions,
        count: paginatedDiscussions.length,
        total: enrichedDiscussions.length,
        stats,
        pagination: {
          limit,
          offset,
          has_more: offset + limit < enrichedDiscussions.length,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get discussions error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch discussions",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
