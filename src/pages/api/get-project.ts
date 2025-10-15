import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { fetchPunchlistStats } from "../../lib/api/_projects";

/**
 * Legacy Project GET API - for backward compatibility
 * This endpoint provides the same functionality as /api/projects/get
 * but with the legacy URL structure that other pages expect.
 */
export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    const projectId = url.searchParams.get("id");
    const authorId = url.searchParams.get("authorId");
    const assignedToId = url.searchParams.get("assignedToId");
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? true : false;
    const includeTotal = url.searchParams.get("includeTotal") === "true";

    if (!supabaseAdmin) {
      console.error("Supabase admin client not initialized");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
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
          author:profiles!author_id(id, firstName, lastName, companyName, email, role),
          assignedTo:profiles!assigned_to_id(id, firstName, lastName, companyName, email, role),
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

      // Get punchlist stats for single project
      const punchlistStats = await fetchPunchlistStats(supabaseAdmin, [project.id]);
      const projectWithPunchlist = {
        ...project,
        punchlistItems: punchlistStats[project.id] || { completed: 0, total: 0 },
      };

      return new Response(
        JSON.stringify({
          data: projectWithPunchlist,
          pagination: { limit: 1, offset: 0, total: 1, hasMore: false },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build query for multiple projects
    let query = supabaseAdmin
      .from("projects")
      .select(
        `
        *,
        author:profiles!author_id(id, firstName, lastName, companyName, email, role),
        assignedTo:profiles!assigned_to_id(id, firstName, lastName, companyName, email, role),
        projectStatuses(id, name, slug, color)
      `,
        { count: includeTotal ? "exact" : undefined }
      )
      .neq("id", 0); // Exclude system log project

    // Apply filters
    if (authorId) {
      query = query.eq("author_id", authorId);
    }
    if (assignedToId) {
      query = query.eq("assigned_to_id", assignedToId);
    }
    if (status) {
      query = query.eq("status", status);
    }

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

    // Get project IDs for punchlist stats
    const projectIds = (projects || []).map((p) => p.id);
    const punchlistStats = await fetchPunchlistStats(supabaseAdmin, projectIds);

    // Add punchlist data to projects
    const projectsWithPunchlist = (projects || []).map((project) => ({
      ...project,
      punchlistItems: punchlistStats[project.id] || { completed: 0, total: 0 },
    }));

    const hasMore = includeTotal ? (count || 0) > offset + limit : projects.length === limit;

    return new Response(
      JSON.stringify({
        data: projectsWithPunchlist,
        pagination: {
          limit,
          offset,
          total: count,
          hasMore,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in legacy project GET API:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch projects" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
