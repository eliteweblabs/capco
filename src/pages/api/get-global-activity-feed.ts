import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
// // // console.log("🚧 [DEAD-STOP-2024-12-19] get-global-activity-feed.ts accessed - may be unused");

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

    // Get all projects with their logs - now with denormalized user data
    const { data: projects, error: projectsError } = await supabase!
      .from("projects")
      .select(
        `
        id,
        address,
        title,
        log,
        author_id,
        company_name,
        assigned_to_name
      `
      )
      .not("log", "is", null)
      .neq("log", "[]")
      .neq("id", 0); // Exclude system log project

    if (projectsError) {
      console.error("Error fetching projects with logs:", projectsError);
      return new Response(JSON.stringify({ error: "Failed to fetch activity data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract and flatten all log entries with project context
    // No need for profile lookups - use denormalized company_name directly
    const allActivities: any[] = [];

    projects?.forEach((project) => {
      const logs = project.log || [];

      logs.forEach((logEntry: any) => {
        allActivities.push({
          ...logEntry,
          project_id: project.id,
          project_address: project.address,
          project_title: project.title,
          project_owner: project.company_name || "Unknown",
          project_owner_id: project.author_id,
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
