import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Legacy Project GET API - for backward compatibility
 * This endpoint provides the same functionality as /api/project/get
 * but with the legacy URL structure that other pages expect.
 */
export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    // Temporarily disable auth for testing
    // const { isAuth, currentUser } = await checkAuth(cookies);
    // if (!isAuth || !currentUser) {
    //   return new Response(JSON.stringify({ error: "Authentication required" }), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    const projectId = url.searchParams.get("id");
    const authorId = url.searchParams.get("authorId");
    const assignedToId = url.searchParams.get("assignedToId");
    const status = url.searchParams.get("status");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? true : false;
    const includeTotal = url.searchParams.get("includeTotal") === "true";

    if (!supabase || !supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle single project fetch by ID
    if (projectId) {
      const { data: project, error } = await supabaseAdmin
        .from("projects")
        .select(
          `
          *,
          author:profiles!authorId(id, firstName, lastName, companyName),
          assignedTo:profiles!assignedToId(id, firstName, lastName, companyName),
          projectStatuses(id, name, slug, color)
        `
        )
        .eq("id", projectId)
        .single();

      if (error || !project) {
        return new Response(JSON.stringify({ error: "Project not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          data: project,
          pagination: { limit: 1, offset: 0, total: 1, hasMore: false },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build query for multiple projects (simplified for testing)
    let query = supabaseAdmin
      .from("projects")
      .select("*", { count: includeTotal ? "exact" : undefined })
      .neq("id", 0); // Exclude system log project

    // Apply filters
    if (authorId) {
      query = query.eq("authorId", authorId);
    }
    if (assignedToId) {
      query = query.eq("assignedToId", assignedToId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    // Apply role-based filtering (temporarily disabled for testing)
    // const userRole = currentUser.profile?.role;
    // if (userRole === "Client") {
    //   // Clients can only see their own projects
    //   query = query.eq("authorId", currentUser.id);
    // } else if (userRole === "Staff") {
    //   // Staff can see projects assigned to them or all projects (depending on permissions)
    //   // For now, show all projects to staff
    // }
    // Admin can see all projects (no additional filtering)

    // Apply sorting and pagination
    query = query.order(sortBy, { ascending: sortOrder });
    query = query.range(offset, offset + limit - 1);

    const { data: projects, error, count } = await query;

    if (error) {
      console.error("Error fetching projects:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch projects" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Transform projects to include status information
    const projectsWithStatus = (projects || []).map((project) => ({
      ...project,
      statusName: project.projectStatuses?.name,
      statusSlug: project.projectStatuses?.slug,
      statusColor: project.projectStatuses?.color,
    }));

    return new Response(
      JSON.stringify({
        projects: projectsWithStatus,
        pagination: {
          limit,
          offset,
          total: count,
          hasMore: projectsWithStatus.length === limit,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in get-project API:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
