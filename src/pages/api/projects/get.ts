import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { fetchPunchlistStats, fetchProjectById, fetchProjects } from "../../../lib/api/_projects";

/**
 * Legacy Project GET API - for backward compatibility
 * This endpoint provides the same functionality as /api/project/get
 * but with the legacy URL structure that other pages expect.
 */
export const GET: APIRoute = async ({ request, cookies, url }) => {
  const traceId =
    request.headers.get("x-trace-id") ||
    `projects-get-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const traceName = request.headers.get("x-trace-name") || "api.projects.get";
  const json = (
    payload: Record<string, unknown>,
    status: number,
    extraHeaders: Record<string, string> = {}
  ) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: {
        "Content-Type": "application/json",
        "x-trace-id": traceId,
        "x-trace-name": traceName,
        ...extraHeaders,
      },
    });
  try {
    const projectId = url.searchParams.get("id");
    const authorId = url.searchParams.get("authorId");
    const assignedToId = url.searchParams.get("assignedToId");
    const status = url.searchParams.get("status");
    const featured = url.searchParams.get("featured");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? true : false;
    const includeTotal = url.searchParams.get("includeTotal") === "true";
    const countOnly = url.searchParams.get("count") === "true"; // NEW: count-only mode

    // Allow public access for featured projects ONLY
    const isFeaturedRequest = featured === "true";

    // console.log("🏗️ [PROJECTS-GET] Featured request:", isFeaturedRequest, "featured param:", featured);

    // Check authentication (skip for featured projects)
    const { isAuth, currentUser } = await checkAuth(cookies);

    // console.log("🏗️ [PROJECTS-GET] Auth status:", isAuth, "Current user:", currentUser?.id);

    if (!isFeaturedRequest && (!isAuth || !currentUser)) {
      console.log("🏗️ [PROJECTS-GET] Rejecting non-featured request without auth");
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "x-trace-id": traceId,
          "x-trace-name": traceName,
        },
      });
    }

    if (isFeaturedRequest && !isAuth) {
      // console.log("🏗️ [PROJECTS-GET] Allowing public access to featured projects");
    }

    // console.log("🏗️ [PROJECTS-GET] Project ID:", projectId, "Count only:", countOnly);
    if (!supabase || !supabaseAdmin) {
      return json({ error: "Database connection not available" }, 500);
    }

    // NEW: Handle count-only requests
    if (countOnly) {
      let countQuery = supabaseAdmin
        .from("projects")
        .select("*", { count: "exact", head: true })
        .neq("id", 0); // Exclude system log project

      // Apply filters
      if (authorId) {
        countQuery = countQuery.eq("authorId", authorId);
      }
      if (assignedToId) {
        countQuery = countQuery.eq("assignedToId", assignedToId);
      }
      if (status) {
        countQuery = countQuery.eq("status", status);
      }
      if (featured === "true") {
        countQuery = countQuery.eq("featured", true);
      }

      // Apply role-based filtering
      if (!isFeaturedRequest && currentUser) {
        const userRole = currentUser.profile?.role;
        if (userRole === "Client" || userRole === "superAdmin") {
          countQuery = countQuery.eq("authorId", currentUser.id);
        }
      }

      const { count, error } = await countQuery;

      if (error) {
        console.error("Error fetching project count:", error);
        return json({ error: "Failed to fetch project count" }, 500);
      }

      return json({ count: count || 0 }, 200, {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });
    }

    // Handle single project fetch by ID
    if (projectId) {
      const project = await fetchProjectById(supabaseAdmin, parseInt(projectId), {
        includeFiles: true,
        includeInvoice: true,
      });

      if (!project) {
        console.error("🏗️ [PROJECTS-GET] Project not found");
        return json({ error: "Project not found" }, 404);
      }

      return json(
        {
          data: project,
          pagination: { limit: 1, offset: 0, total: 1, hasMore: false },
        },
        200,
        {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        }
      );
    }

    // Build query for multiple projects
    const startQuery = Date.now();
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
    if (featured === "true") {
      query = query.eq("featured", true);
    }

    // Apply role-based filtering (skip for featured projects)
    if (!isFeaturedRequest && currentUser) {
      const userRole = currentUser.profile?.role;
      if (userRole === "Client" || userRole === "superAdmin") {
        // Clients can only see their own projects
        query = query.eq("authorId", currentUser.id);
      }
      // Staff and Admin can see all projects (no additional filtering)
    }

    // Apply sorting and pagination
    query = query.order(sortBy, { ascending: sortOrder });
    query = query.range(offset, offset + limit - 1);

    const { data: projects, error, count } = await query;
    console.log(`⚡ [PROJECTS-GET] Main query took ${Date.now() - startQuery}ms`);

    if (error) {
      console.error("Error fetching projects:", error);
      return json({ error: "Failed to fetch projects" }, 500);
    }

    // Get project IDs for later queries
    const projectIds = (projects || []).map((p) => p.id);

    // Get unique author and assigned-to IDs
    const authorIds = [...new Set((projects || []).map((p) => p.authorId).filter(Boolean))];
    const assignedToIds = [...new Set((projects || []).map((p) => p.assignedToId).filter(Boolean))];
    const allProfileIds = [...new Set([...authorIds, ...assignedToIds])];

    // Fetch profiles and files in parallel
    const startParallel = Date.now();
    const [profilesResult, filesResult] = await Promise.all([
      // Fetch all relevant profiles in one query
      allProfileIds.length > 0
        ? supabaseAdmin
            .from("profiles")
            .select("id, firstName, lastName, companyName, email, role, avatarUrl")
            .in("id", allProfileIds)
        : Promise.resolve({ data: [] }),

      // Fetch file counts for all projects in one query
      projectIds.length > 0
        ? supabaseAdmin
            .from("files")
            .select("id, fileName, fileType, fileSize, uploadedAt, projectId")
            .in("projectId", projectIds)
        : Promise.resolve({ data: [] }),
    ]);
    console.log(`⚡ [PROJECTS-GET] Parallel queries took ${Date.now() - startParallel}ms`);

    // Build profiles map
    const profilesMap: Record<string, any> = {};
    if (profilesResult.data) {
      profilesResult.data.forEach((profile: any) => {
        profilesMap[profile.id] = profile;
      });
    }

    // Build files map
    const filesMap: Record<number, { count: number; files: any[] }> = {};
    if (filesResult.data) {
      filesResult.data.forEach((file: any) => {
        if (!filesMap[file.projectId]) {
          filesMap[file.projectId] = { count: 0, files: [] };
        }
        filesMap[file.projectId].count++;
        filesMap[file.projectId].files.push(file);
      });
    }

    // Add profile data, file data, and punchlist data to projects
    const projectsWithProfiles = (projects || []).map((project) => {
      const fileData = filesMap[project.id] || { count: 0, files: [] };

      return {
        ...project,
        author: project.authorId ? profilesMap[project.authorId] : null,
        assignedTo: project.assignedToId ? profilesMap[project.assignedToId] : null,
        authorProfile: project.authorId ? profilesMap[project.authorId] : null,
        assignedToProfile: project.assignedToId ? profilesMap[project.assignedToId] : null,
        projectFiles: fileData.files,
        fileCount: fileData.count,
        // Use punchlist data directly from projects table (no extra query needed!)
        punchlistItems: {
          completed: project.punchlistComplete || 0,
          total: project.punchlistCount || 0,
        },
      };
    });

    return json(
      {
        projects: projectsWithProfiles,
        pagination: {
          limit,
          offset,
          total: count,
          hasMore: projectsWithProfiles.length === limit,
        },
      },
      200,
      {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      }
    );
  } catch (error) {
    console.error("Unexpected error in get-project API:", error);
    return json({ error: "Internal server error", details: String(error) }, 500);
  }
};
