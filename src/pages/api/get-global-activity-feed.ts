import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
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
    const actionFilter = searchParams.get("action");

    // Get all projects with their logs (without profile join for now)
    console.log("📊 [GET-GLOBAL-ACTIVITY-FEED] Fetching projects with logs...");

    const { data: projects, error: projectsError } = await supabase!
      .from("projects")
      .select(
        `
        id,
        address,
        title,
        log,
        authorId
      `
      )
      .not("log", "is", null)
      .neq("log", "[]")
      .neq("id", 0); // Exclude system log project

    if (projectsError) {
      console.error(
        "❌ [GET-GLOBAL-ACTIVITY-FEED] Error fetching projects with logs:",
        projectsError
      );
      return new Response(
        JSON.stringify({
          error: "Failed to fetch activity data",
          details: projectsError.message,
          code: projectsError.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("📊 [GET-GLOBAL-ACTIVITY-FEED] Found projects:", projects?.length || 0);

    // Extract and flatten all log entries with project context
    // Get companyName from the joined profiles table
    const allActivities: any[] = [];

    try {
      projects?.forEach((project) => {
        // Skip if project is a ParserError
        if (project && typeof project === "object" && "id" in project) {
          const logs = (project as any).log || [];

          if (Array.isArray(logs)) {
            logs.forEach((logEntry: any) => {
              if (logEntry && typeof logEntry === "object") {
                allActivities.push({
                  ...logEntry,
                  projectId: (project as any).id,
                  address: (project as any).address,
                  projectTitle: (project as any).title,
                  projectOwner: "Unknown", // Will be populated later if needed
                  projectOwnerId: (project as any).authorId,
                });
              }
            });
          }
        }
      });
    } catch (processingError) {
      console.error("❌ [GET-GLOBAL-ACTIVITY-FEED] Error processing activities:", processingError);
      return new Response(
        JSON.stringify({
          error: "Failed to process activity data",
          details:
            processingError instanceof Error ? processingError.message : "Unknown processing error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("📊 [GET-GLOBAL-ACTIVITY-FEED] Processed activities:", allActivities.length);

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
        totalAll: allActivities.length,
        actionTypes: actionTypes,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < filteredActivities.length,
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
