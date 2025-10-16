import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { replacePlaceholders, type PlaceholderData } from "../../../lib/placeholder-utils";
import { supabase } from "../../../lib/supabase";

/**
 * Standardized Discussions GET API
 *
 * Query Parameters:
 * - id: Get specific discussion by ID
 * - projectId: Filter by project ID (omit for all discussions)
 * - authorId: Filter by author ID
 * - internal: Filter internal discussions (true/false/all)
 * - completed: Filter completed discussions (true/false/all)
 * - limit: Number of results (default: 20, max: 100)
 * - offset: Number to skip (default: 0)
 * - sortBy: Sort field (default: createdAt)
 * - sortOrder: Sort direction (asc/desc, default: desc)
 * - includeTotal: Include total count (true/false, default: false)
 *
 * Examples:
 * - /api/discussions/get - Get all discussions (Admin only)
 * - /api/discussions/get?projectId=123&internal=false - Get project discussions
 * - /api/discussions/get?id=456 - Get specific discussion
 */

interface DiscussionFilters {
  id?: string;
  projectId?: string;
  authorId?: string;
  internal?: string;
  completed?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
  includeTotal?: boolean;
}

export const GET: APIRoute = async ({ url, cookies }) => {
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

    const isClient = currentRole === "Client";
    const isAdmin = currentRole === "Admin";

    // Parse query parameters
    const filters: DiscussionFilters = {
      id: url.searchParams.get("id") || undefined,
      projectId: url.searchParams.get("projectId") || undefined,
      authorId: url.searchParams.get("authorId") || undefined,
      internal: url.searchParams.get("internal") || undefined,
      completed: url.searchParams.get("completed") || undefined,
      limit: Math.min(parseInt(url.searchParams.get("limit") || "20"), 100),
      offset: parseInt(url.searchParams.get("offset") || "0"),
      sortBy: url.searchParams.get("sortBy") || "createdAt",
      sortOrder: url.searchParams.get("sortOrder") || "desc",
      includeTotal: url.searchParams.get("includeTotal") === "true",
    };

    console.log(`💬 [DISCUSSIONS-GET] Fetching discussions with filters:`, filters);

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If no projectId, require admin access (viewing all discussions)
    if (!filters.projectId && !isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Admin access required to view all discussions",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if requesting specific discussion
    if (filters.id) {
      const { data: discussion, error } = await supabase
        .from("discussion")
        .select(
          `
          *,
          projects (
            id,
            address,
            title,
            authorId
          )
        `
        )
        .eq("id", filters.id)
        .single();

      if (error || !discussion) {
        return new Response(JSON.stringify({ error: "Discussion not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get author profile
      const { data: authorProfile } = await supabase
        .from("profiles")
        .select("id, companyName, role, avatarUrl, firstName, lastName")
        .eq("id", discussion.authorId)
        .single();

      // Get project owner profile
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("id, companyName")
        .eq("id", discussion.projects?.authorId)
        .single();

      // Enrich discussion with profiles
      const enrichedDiscussion = {
        ...discussion,
        authorName: authorProfile?.companyName || "Unknown User",
        authorRole: authorProfile?.role || "Unknown",
        authorAvatar: authorProfile?.avatarUrl || null,
        authorFirstName: authorProfile?.firstName || null,
        authorLastName: authorProfile?.lastName || null,
        projectOwner: ownerProfile?.companyName || "Unknown",
        projectOwnerId: discussion.projects?.authorId,
      };

      return new Response(
        JSON.stringify({
          success: true,
          discussion: enrichedDiscussion,
          pagination: { limit: 1, offset: 0, total: 1, hasMore: false },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build query for multiple discussions
    let query = supabase.from("discussion").select(
      `
      *,
      projects (
        id,
        address,
        title,
        authorId
      )
    `
    );

    // Apply filters
    if (filters.projectId) {
      query = query.eq("projectId", filters.projectId);
    }

    if (filters.authorId) {
      query = query.eq("authorId", filters.authorId);
    }

    // For clients, exclude internal discussions (Admin/Staff see all)
    if (isClient) {
      query = query.eq("internal", false);
    }

    // Apply internal filter if specified
    if (filters.internal && filters.internal !== "all") {
      const isInternal = filters.internal === "true";
      query = query.eq("internal", isInternal);
    }

    // Apply completed filter if specified
    if (filters.completed && filters.completed !== "all") {
      const isCompleted = filters.completed === "true";
      query = query.eq("markCompleted", isCompleted);
    }

    // Apply sorting
    const ascending = filters.sortOrder === "asc";
    query = query.order(filters.sortBy || "createdAt", { ascending });

    // Apply pagination
    query = query.range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);

    // Execute query
    const { data: discussions, error } = await query;

    if (error) {
      console.error("❌ [DISCUSSIONS-GET] Error fetching discussions:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch discussions",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
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
    if (filters.projectId) {
      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("id", filters.projectId)
        .single();

      if (projectData) {
        project = projectData;

        // Get project author's profile data for placeholders
        if (project.authorId) {
          const { data: authorProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", project.authorId)
            .single();

          if (authorProfile) {
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
        message: filters.projectId
          ? replacePlaceholders(discussion.message, placeholderData, true)
          : discussion.message,
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

    // Get total count if requested
    let totalCount = null;
    if (filters.includeTotal) {
      let countQuery = supabase.from("discussion").select("*", { count: "exact", head: true });

      if (filters.projectId) {
        countQuery = countQuery.eq("projectId", filters.projectId);
      }
      if (filters.authorId) {
        countQuery = countQuery.eq("authorId", filters.authorId);
      }
      if (isClient) {
        countQuery = countQuery.eq("internal", false);
      }
      if (filters.internal && filters.internal !== "all") {
        countQuery = countQuery.eq("internal", filters.internal === "true");
      }
      if (filters.completed && filters.completed !== "all") {
        countQuery = countQuery.eq("markCompleted", filters.completed === "true");
      }

      const { count } = await countQuery;
      totalCount = count;
    }

    // Calculate stats (only for all discussions view)
    let stats = null;
    if (!filters.projectId) {
      const totalDiscussions = enrichedDiscussions.length;
      const internalCount = enrichedDiscussions.filter((d: any) => d.internal).length;
      const completedCount = enrichedDiscussions.filter((d: any) => d.markCompleted).length;
      const repliesCount = enrichedDiscussions.filter((d: any) => d.isReply).length;

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

    // Get incomplete count for project
    let incompleteCount = 0;
    let projectTotalCount = 0;
    if (filters.projectId) {
      const { count: totalCountResult } = await supabase
        .from("discussions")
        .select("*", { count: "exact", head: true })
        .eq("projectId", filters.projectId);

      const { count: incompleteCountResult } = await supabase
        .from("discussions")
        .select("*", { count: "exact", head: true })
        .eq("projectId", filters.projectId)
        .eq("markCompleted", false);

      projectTotalCount = totalCountResult || 0;
      incompleteCount = incompleteCountResult || 0;
    }

    console.log(`✅ [DISCUSSIONS-GET] Returning ${enrichedDiscussions.length} discussions`);

    return new Response(
      JSON.stringify({
        success: true,
        discussions: enrichedDiscussions,
        count: enrichedDiscussions.length,
        total: totalCount,
        incompleteCount,
        totalCount: projectTotalCount,
        stats,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: totalCount,
          hasMore: enrichedDiscussions.length === filters.limit,
        },
        filters: {
          projectId: filters.projectId,
          authorId: filters.authorId,
          internal: filters.internal,
          completed: filters.completed,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ [DISCUSSIONS-GET] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
