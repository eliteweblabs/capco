import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

/**
 * Standardized Global Analytics API
 *
 * Query Parameters:
 * - period: Time period (7d, 30d, 90d, 1y, all)
 * - metric: Specific metric to retrieve (visitors, pageviews, bounce_rate, etc.)
 * - startDate: Start date (ISO format)
 * - endDate: End date (ISO format)
 *
 * Examples:
 * - /api/global/analytics?period=30d
 * - /api/global/analytics?metric=visitors&period=7d
 * - /api/global/analytics?startDate=2024-01-01&endDate=2024-01-31
 */

interface AnalyticsFilters {
  period?: string;
  metric?: string;
  startDate?: string;
  endDate?: string;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only Admin and Staff can access analytics
    const userRole = currentUser.profile?.role;
    if (userRole !== "Admin" && userRole !== "Staff") {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse query parameters
    const filters: AnalyticsFilters = {
      period: url.searchParams.get("period") || "30d",
      metric: url.searchParams.get("metric") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
    };

    console.log(`📊 [GLOBAL-ANALYTICS] Fetching analytics with filters:`, filters);

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Calculate date range based on period
    let startDate: Date;
    let endDate: Date = new Date();

    switch (filters.period) {
      case "7d":
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        startDate = new Date("2020-01-01"); // Arbitrary start date
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Override with custom dates if provided
    if (filters.startDate) {
      startDate = new Date(filters.startDate);
    }
    if (filters.endDate) {
      endDate = new Date(filters.endDate);
    }

    // Get project statistics
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, createdAt, status, authorId")
      .gte("createdAt", startDate.toISOString())
      .lte("createdAt", endDate.toISOString());

    if (projectsError) {
      console.error("❌ [GLOBAL-ANALYTICS] Error fetching projects:", projectsError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch project analytics",
          details: projectsError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user statistics
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, createdAt, role")
      .gte("createdAt", startDate.toISOString())
      .lte("createdAt", endDate.toISOString());

    if (usersError) {
      console.error("❌ [GLOBAL-ANALYTICS] Error fetching users:", usersError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch user analytics",
          details: usersError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get file statistics
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("id, createdAt, projectId")
      .gte("createdAt", startDate.toISOString())
      .lte("createdAt", endDate.toISOString());

    if (filesError) {
      console.error("❌ [GLOBAL-ANALYTICS] Error fetching files:", filesError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch file analytics",
          details: filesError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Calculate analytics metrics
    const totalProjects = projects?.length || 0;
    const totalUsers = users?.length || 0;
    const totalFiles = files?.length || 0;

    // Group by status
    const projectsByStatus =
      projects?.reduce((acc: Record<string, number>, project: any) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
      }, {}) || {};

    // Group by role
    const usersByRole =
      users?.reduce((acc: Record<string, number>, user: any) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}) || {};

    // Calculate growth rates (simplified)
    const previousPeriodStart = new Date(
      startDate.getTime() - (endDate.getTime() - startDate.getTime())
    );
    const previousPeriodEnd = new Date(startDate.getTime() - 1);

    // Get previous period data for comparison
    const { data: previousProjects } = await supabase
      .from("projects")
      .select("id")
      .gte("createdAt", previousPeriodStart.toISOString())
      .lte("createdAt", previousPeriodEnd.toISOString());

    const previousProjectsCount = previousProjects?.length || 0;
    const projectGrowthRate =
      previousProjectsCount > 0
        ? ((totalProjects - previousProjectsCount) / previousProjectsCount) * 100
        : 0;

    const analyticsData = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        label: filters.period,
      },
      overview: {
        totalProjects,
        totalUsers,
        totalFiles,
        projectGrowthRate: Math.round(projectGrowthRate * 100) / 100,
      },
      projects: {
        total: totalProjects,
        byStatus: projectsByStatus,
      },
      users: {
        total: totalUsers,
        byRole: usersByRole,
      },
      files: {
        total: totalFiles,
      },
      metrics: {
        projectsPerUser: totalUsers > 0 ? Math.round((totalProjects / totalUsers) * 100) / 100 : 0,
        filesPerProject:
          totalProjects > 0 ? Math.round((totalFiles / totalProjects) * 100) / 100 : 0,
      },
    };

    // Filter by specific metric if requested
    let responseData: typeof analyticsData | { metric: string; value: any; period: typeof analyticsData.period } = analyticsData;
    if (filters.metric) {
      const metricValue =
        analyticsData.overview[filters.metric as keyof typeof analyticsData.overview];
      responseData = {
        metric: filters.metric,
        value: metricValue,
        period: analyticsData.period,
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData,
        filters,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ [GLOBAL-ANALYTICS] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
