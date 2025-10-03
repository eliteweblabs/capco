import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    // Check authentication and admin role
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set session
    const { data: session, error: sessionError } = await supabase!.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session.session?.user) {
      console.error("Session error:", sessionError);
      return new Response(
        JSON.stringify({
          error: "Invalid session",
          details: sessionError?.message || "No session data",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase!
      .from("profiles")
      .select("role")
      .eq("id", session.session.user.id)
      .single();

    if (!profile || profile.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Unauthorized - Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse query parameters
    const searchParams = url.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const internalFilter = searchParams.get("internal"); // "true", "false", or "all"
    const completedFilter = searchParams.get("completed"); // "true", "false", or "all"

    console.log(
      `📡 [GET-GLOBAL-DISCUSSIONS] Fetching discussions: limit=${limit}, offset=${offset}, internal=${internalFilter}, completed=${completedFilter}`
    );

    // Get all discussions with project and author information
    const { data: discussions, error: discussionsError } = await supabase!
      .from("discussion")
      .select(
        `
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
        projects!inner (
          id,
          address,
          title,
          author_id
        )
      `
      )
      .order("created_at", { ascending: false });

    if (discussionsError) {
      console.error("❌ [GET-GLOBAL-DISCUSSIONS] Error fetching discussions:", discussionsError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch discussions",
          details: discussionsError.message,
          code: discussionsError.code,
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
    const { data: profiles } = await supabase!
      .from("profiles")
      .select("id, company_name, role")
      .in("id", authorIds);

    const profilesMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

    // Get unique project owner IDs
    const projectOwnerIds = [
      ...new Set(discussions?.map((d: any) => d.projects?.author_id).filter(Boolean) || []),
    ];

    // Fetch project owner profiles
    const { data: ownerProfiles } = await supabase!
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
      `✅ [GET-GLOBAL-DISCUSSIONS] Returning ${paginatedDiscussions.length} discussions (${filteredDiscussions.length} total after filters)`
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
    console.error("❌ [GET-GLOBAL-DISCUSSIONS] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
