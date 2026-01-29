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
        headers: { "Content-Type": "application/json" },
      });
    }

    if (isFeaturedRequest && !isAuth) {
      // console.log("🏗️ [PROJECTS-GET] Allowing public access to featured projects");
    }

    console.log("🏗️ [PROJECTS-GET] Project ID:", projectId);
    if (!supabase || !supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
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
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
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
      if (userRole === "Client") {
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
      return new Response(JSON.stringify({ error: "Failed to fetch projects" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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
            .select("id, firstName, lastName, companyName, email, role")
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

    return new Response(
      JSON.stringify({
        projects: projectsWithProfiles,
        pagination: {
          limit,
          offset,
          total: count,
          hasMore: projectsWithProfiles.length === limit,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error in get-project API:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
