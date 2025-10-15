import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { replacePlaceholders, type PlaceholderData } from "../../../lib/placeholder-utils";
import { supabase } from "../../../lib/supabase";

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
        createdAt,
        message,
        authorId,
        projectId,
        internal,
        markCompleted,
        parentId,
        imageUrls,
        imagePaths,
        companyName,
        updatedAt,
        projects (
          id,
          address,
          title,
          authorId
        )
      `
    );

    // Apply project filter only if projectId is provided
    console.log("Discussions API - projectId:", projectId);
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
      discussionsQuery = discussionsQuery.eq("projectId", projectIdInt);
      console.log("Filtering by projectId:", projectIdInt);
    } else {
      console.log("No projectId provided - loading all discussions");
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
      discussionsQuery = discussionsQuery.eq("markCompleted", isCompleted);
    }

    const { data: discussions, error } = await discussionsQuery.order("createdAt", {
      ascending: false,
    });

    console.log("Database query result:", { discussions: discussions?.length || 0, error });
    if (error) {
      console.error("Database error:", error);
    }

    // Count incomplete discussions for the project (if projectId is provided)
    let incompleteCount = 0;
    let totalCount = 0;
    if (projectId) {
      try {
        // Count all discussions for the project
        const { count: totalCountResult } = await supabase
          .from("discussions")
          .select("*", { count: "exact", head: true })
          .eq("projectId", parseInt(projectId, 10));

        // Count incomplete discussions for the project
        const { count: incompleteCountResult } = await supabase
          .from("discussions")
          .select("*", { count: "exact", head: true })
          .eq("projectId", parseInt(projectId, 10))
          .eq("markCompleted", false);

        totalCount = totalCountResult || 0;
        incompleteCount = incompleteCountResult || 0;

        console.log("💬 [DISCUSSIONS] Count results:", {
          projectId,
          totalCount,
          incompleteCount,
        });
      } catch (countError) {
        console.error("Error counting discussions:", countError);
      }
    }

    // Debug logging for raw database response
    console.log("🔍 [DISCUSSIONS] Raw database response:", {
      discussionsCount: discussions?.length || 0,
      firstDiscussion: discussions?.[0]
        ? {
            id: discussions[0].id,
            projectId: discussions[0].projectId,
            projects: discussions[0].projects,
          }
        : null,
    });

    // Check if projects have addresses in the database
    const { data: projectsWithAddresses } = await supabase
      .from("projects")
      .select("id, title, address")
      .not("address", "is", null)
      .neq("address", "")
      .limit(5);

    // console.log("🔍 [DISCUSSIONS] Projects with addresses:", projectsWithAddresses);

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
    const authorIds = [...new Set(discussions?.map((d: any) => d.authorId) || [])];

    // Fetch author profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, companyName, role, avatarUrl, firstName, lastName")
      .in("id", authorIds);

    const profilesMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

    // Get unique project owner IDs
    const projectOwnerIds = [
      ...new Set(discussions?.map((d: any) => d.projects?.authorId).filter(Boolean) || []),
    ];

    // Fetch project owner profiles
    const { data: ownerProfiles } = await supabase
      .from("profiles")
      .select("id, companyName")
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
        if (project?.authorId) {
          const { data: authorProfile, error: authorError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", project.authorId)
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
      const authorProfile = profilesMap.get(discussion.authorId);
      const ownerProfile = ownerProfilesMap.get(discussion.projects?.authorId);

      // Debug logging for address
      // console.log("🔍 [DISCUSSIONS] Project data for discussion", discussion.id, ":", {
      //   projectId: discussion.projectId,
      //   address: discussion.projects?.address,
      //   title: discussion.projects?.title,
      //   hasProjects: !!discussion.projects,
      //   projectsKeys: discussion.projects ? Object.keys(discussion.projects) : null,
      //   fullProjectsObject: discussion.projects,
      // });

      return {
        id: discussion.id,
        projectId: discussion.projectId,
        address: discussion.projects?.address || "Unknown Address",
        title: discussion.projects?.title || "Untitled",
        projectOwner: ownerProfile?.companyName || "Unknown",
        projectOwnerId: discussion.projects?.authorId,
        authorId: discussion.authorId,
        authorName: authorProfile?.companyName || "Unknown User",
        authorRole: authorProfile?.role || "Unknown",
        authorAvatar: authorProfile?.avatarUrl || null,
        authorFirstName: authorProfile?.firstName || null,
        authorLastName: authorProfile?.lastName || null,
        message: isGlobal
          ? discussion.message
          : replacePlaceholders(discussion.message, placeholderData, true),
        internal: discussion.internal || false,
        markCompleted: discussion.markCompleted || false,
        parentId: discussion.parentId,
        isReply: !!discussion.parentId,
        imageUrls: discussion.imageUrls,
        imagePaths: discussion.imagePaths,
        companyName: discussion.companyName || "Unknown User",
        createdAt: discussion.createdAt,
        updatedAt: discussion.updatedAt,
      };
    });

    // Apply pagination
    const paginatedDiscussions = enrichedDiscussions.slice(offset, offset + limit);

    // Calculate stats (only for global discussions)
    let stats = null;
    if (isGlobal) {
      const totalDiscussions = enrichedDiscussions.length;
      const internalCount = enrichedDiscussions.filter((d: any) => d.internal).length;
      const completedCount = enrichedDiscussions.filter((d: any) => d.markCompleted).length;
      const repliesCount = enrichedDiscussions.filter((d: any) => d.is_reply).length;

      // Get recent (24h) count
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentCount = enrichedDiscussions.filter((d: any) => {
        const discussionDate = new Date(d.createdAt);
        return discussionDate >= yesterday;
      }).length;

      // Get unique active users (last 24h)
      const activeUserIds = new Set(
        enrichedDiscussions
          .filter((d: any) => {
            const discussionDate = new Date(d.createdAt);
            return discussionDate >= yesterday;
          })
          .map((d: any) => d.authorId)
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
        incompleteCount,
        totalCount,
        stats,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < enrichedDiscussions.length,
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
