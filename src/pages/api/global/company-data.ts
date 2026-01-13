import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

/**
 * Standardized Global Company Data API
 *
 * Query Parameters:
 * - type: Type of company data (overview, stats, settings, etc.)
 * - includeProjects: Include project statistics (true/false, default: true)
 * - includeUsers: Include user statistics (true/false, default: true)
 *
 * Examples:
 * - /api/global/company-data?type=overview
 * - /api/global/company-data?type=stats&includeProjects=false
 */

interface CompanyDataFilters {
  type?: string;
  includeProjects?: boolean;
  includeUsers?: boolean;
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

    // Only Admin and Staff can access company data
    const userRole = currentUser.profile?.role;
    if (userRole !== "Admin" && userRole !== "Staff") {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse query parameters
    const filters: CompanyDataFilters = {
      type: url.searchParams.get("type") || "overview",
      includeProjects: url.searchParams.get("includeProjects") !== "false",
      includeUsers: url.searchParams.get("includeUsers") !== "false",
    };

    console.log(`🏢 [GLOBAL-COMPANY-DATA] Fetching company data with filters:`, filters);

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let companyData: any = {
      type: filters.type,
      timestamp: new Date().toISOString(),
    };

    // Get basic company information
    const { data: companySettings, error: settingsError } = await supabase
      .from("company_settings")
      .select("*")
      .single();

    if (settingsError && settingsError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("❌ [GLOBAL-COMPANY-DATA] Error fetching company settings:", settingsError);
    }

    // Get company data from global settings as fallback
    const { globalCompanyData } = await import("./global-company-data");
    const globalData = await globalCompanyData();

    companyData.company = {
      name: companySettings?.name || globalData.globalCompanyName || "Company",
      description:
        companySettings?.description || globalData.globalCompanySlogan || "Professional services",
      contact: {
        email: companySettings?.email || globalData.globalCompanyEmail || "",
        phone: companySettings?.phone || globalData.globalCompanyPhone || "",
        address: companySettings?.address || globalData.globalCompanyAddress || "",
      },
      settings: {
        timezone: companySettings?.timezone || "America/New_York",
        currency: companySettings?.currency || "USD",
        dateFormat: companySettings?.dateFormat || "MM/DD/YYYY",
      },
    };

    // Get project statistics if requested
    if (filters.includeProjects) {
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, status, createdAt, authorId, assignedToId");

      if (projectsError) {
        console.error("❌ [GLOBAL-COMPANY-DATA] Error fetching projects:", projectsError);
      } else {
        const totalProjects = projects?.length || 0;
        const projectsByStatus =
          projects?.reduce((acc: Record<string, number>, project: any) => {
            acc[project.status] = (acc[project.status] || 0) + 1;
            return acc;
          }, {}) || {};

        const recentProjects =
          projects?.filter((project: any) => {
            const createdAt = new Date(project.createdAt);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return createdAt >= thirtyDaysAgo;
          }).length || 0;

        companyData.projects = {
          total: totalProjects,
          recent: recentProjects,
          byStatus: projectsByStatus,
        };
      }
    }

    // Get user statistics if requested
    if (filters.includeUsers) {
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, role, createdAt, companyName");

      if (usersError) {
        console.error("❌ [GLOBAL-COMPANY-DATA] Error fetching users:", usersError);
      } else {
        const totalUsers = users?.length || 0;
        const usersByRole =
          users?.reduce((acc: Record<string, number>, user: any) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
          }, {}) || {};

        const uniqueCompanies = new Set(users?.map((user: any) => user.companyName).filter(Boolean))
          .size;

        companyData.users = {
          total: totalUsers,
          byRole: usersByRole,
          uniqueCompanies,
        };
      }
    }

    // Get system health metrics
    const { data: recentActivity, error: activityError } = await supabase
      .from("activity_log")
      .select("id, createdAt, action")
      .gte("createdAt", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(100);

    if (activityError) {
      console.error("❌ [GLOBAL-COMPANY-DATA] Error fetching recent activity:", activityError);
    } else {
      companyData.system = {
        recentActivity: recentActivity?.length || 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Add type-specific data
    switch (filters.type) {
      case "stats":
        companyData.focus = "statistics";
        break;
      case "settings":
        companyData.focus = "configuration";
        break;
      case "overview":
      default:
        companyData.focus = "comprehensive overview";
        break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: companyData,
        filters,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [GLOBAL-COMPANY-DATA] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
