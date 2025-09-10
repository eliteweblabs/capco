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
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
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
    const actionFilter = searchParams.get("action");

    // Get all projects with their logs
    const { data: projects, error: projectsError } = await supabase!
      .from("projects")
      .select(
        `
        id,
        address,
        title,
        log,
        author_id
      `
      )
      .not("log", "is", null)
      .neq("log", "[]");

    if (projectsError) {
      console.error("Error fetching projects with logs:", projectsError);
      return new Response(JSON.stringify({ error: "Failed to fetch activity data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get unique author IDs to fetch their profile information
    const uniqueAuthorIds = projects
      ? [...new Set(projects.map((p) => p.author_id).filter(Boolean))]
      : [];

    // Fetch profile information for all authors efficiently
    let profilesMap = new Map();
    if (uniqueAuthorIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase!
        .from("profiles")
        .select("id, name, company_name, role")
        .in("id", uniqueAuthorIds);

      if (!profilesError && profiles) {
        profiles.forEach((profile) => {
          profilesMap.set(profile.id, {
            id: profile.id,
            name: profile.name,
            display_name: profile.company_name || "Unknown User",
            role: profile.role,
          });
        });
        console.log(`✅ [ACTIVITY-FEED] Fetched ${profiles.length} user profiles efficiently`);
      } else {
        console.error("Error fetching activity feed profiles:", profilesError);
      }
    }

    // Extract and flatten all log entries with project context
    const allActivities: any[] = [];

    projects?.forEach((project) => {
      const logs = project.log || [];
      const authorProfile = profilesMap.get(project.author_id);

      logs.forEach((logEntry: any) => {
        allActivities.push({
          ...logEntry,
          project_id: project.id,
          project_address: project.address,
          project_title: project.title,
          project_owner: authorProfile?.display_name || authorProfile?.name || "Unknown",
          project_owner_id: authorProfile?.id || project.author_id,
        });
      });
    });

    // Sort by timestamp (most recent first)
    allActivities.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });

    // Apply action filter if specified
    let filteredActivities = allActivities;
    if (actionFilter && actionFilter !== "all") {
      filteredActivities = allActivities.filter((activity) => activity.action === actionFilter);
    }

    // Apply pagination
    const paginatedActivities = filteredActivities.slice(offset, offset + limit);

    // Get unique action types for filter options
    const actionTypes = [...new Set(allActivities.map((activity) => activity.action))].sort();

    return new Response(
      JSON.stringify({
        success: true,
        activities: paginatedActivities,
        total: filteredActivities.length,
        total_all: allActivities.length,
        action_types: actionTypes,
        pagination: {
          limit,
          offset,
          has_more: offset + limit < filteredActivities.length,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in global activity feed API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
