import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

/**
 * Standardized Activity API
 *
 * GET /api/activity/get
 * - Without projectId: Returns global activity feed (Admin only)
 * - With projectId: Returns project-specific activity
 *
 * Query Parameters:
 * - projectId?: number - Optional project ID to filter activities
 * - limit?: number - Number of activities to return (default: 50)
 * - offset?: number - Pagination offset (default: 0)
 * - action?: string - Filter by action type
 */
export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Authentication and session setup
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set session for RLS policies
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

    // Parse query parameters
    const projectId = parseInt(url.searchParams.get("projectId") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const actionFilter = url.searchParams.get("action");

    // If projectId is provided, return project-specific activity
    if (projectId) {
      const { data: project, error } = await supabase!
        .from("projects")
        .select("log")
        .eq("id", projectId)
        .single();

      if (error) {
        console.error("Error fetching project log:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to fetch project log",
            details: error.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const log = project?.log || [];

      // Apply action filter if specified
      let filteredLog = log;
      if (actionFilter && actionFilter !== "all") {
        filteredLog = log.filter((entry: any) => entry.action === actionFilter);
      }

      // Sort by timestamp (most recent first)
      filteredLog.sort((a: any, b: any) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });

      // Apply pagination
      const paginatedLog = filteredLog.slice(offset, offset + limit);

      // Get unique action types for filter options
      const actionTypes = [...new Set(log.map((entry: any) => entry.action))].sort();

      return new Response(
        JSON.stringify({
          success: true,
          activities: paginatedLog,
          total: filteredLog.length,
          totalAll: log.length,
          actionTypes,
          pagination: {
            limit,
            offset,
            hasMore: offset + limit < filteredLog.length,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // For global activity feed, check if user is admin
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

    // Get all projects with their logs
    console.log("📊 [GET-ACTIVITY] Fetching global activity feed...");

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
      .neq("log", "[]");
    // Include system log project (id 0) for user registrations and system activities

    if (projectsError) {
      console.error("❌ [GET-ACTIVITY] Error fetching projects with logs:", projectsError);
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

    console.log("📊 [GET-ACTIVITY] Found projects:", projects?.length || 0);

    // Extract and flatten all log entries with project context
    const allActivities: any[] = [];

    try {
      projects?.forEach((project) => {
        // Skip if project is a ParserError
        if (project && typeof project === "object" && "id" in project) {
          const logs = project.log || [];

          if (Array.isArray(logs)) {
            logs.forEach((logEntry: any) => {
              if (logEntry && typeof logEntry === "object") {
                allActivities.push({
                  ...logEntry,
                  projectId: project.id,
                  address: project.address,
                  projectTitle: project.title,
                  projectOwner: "Unknown", // Will be populated later if needed
                  projectOwnerId: project.authorId,
                });
              }
            });
          }
        }
      });
    } catch (processingError) {
      console.error("❌ [GET-ACTIVITY] Error processing activities:", processingError);
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

    console.log("📊 [GET-ACTIVITY] Processed activities:", allActivities.length);

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
    console.error("Error in activity/get:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
