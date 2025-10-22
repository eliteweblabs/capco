import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { fetchPunchlistStats } from "../../../lib/api/_projects";

/**
 * Legacy Project GET API - for backward compatibility
 * This endpoint provides the same functionality as /api/project/get
 * but with the legacy URL structure that other pages expect.
 */
export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectId = url.searchParams.get("id");
    const authorId = url.searchParams.get("authorId");
    const assignedToId = url.searchParams.get("assignedToId");
    const status = url.searchParams.get("status");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? true : false;
    const includeTotal = url.searchParams.get("includeTotal") === "true";

    console.log("🏗️ [PROJECTS-GET] Project ID:", projectId);
    if (!supabase || !supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle single project fetch by ID
    if (projectId) {
      // First fetch the project
      const { data: project, error } = await supabaseAdmin
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error || !project) {
        console.error("🏗️ [PROJECTS-GET] Project fetch error:", error);
        return new Response(JSON.stringify({ error: "Project not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Fetch related invoice separately to avoid foreign key constraint issues
      let invoiceId = null;
      try {
        const { data: invoices } = await supabaseAdmin
          .from("invoices")
          .select("id")
          .eq("projectId", project.id)
          .limit(1);

        if (invoices && invoices.length > 0) {
          invoiceId = invoices[0].id;
        }
      } catch (invoiceError) {
        console.warn(
          "🏗️ [PROJECTS-GET] Could not fetch invoice for project:",
          project.id,
          invoiceError
        );
      }

      // Add invoice ID to project if found
      if (invoiceId) {
        project.invoiceId = invoiceId;
      }

      // Fetch author profile data
      let authorProfile = null;
      if (project.authorId) {
        const { data: authorData } = await supabaseAdmin
          .from("profiles")
          .select("id, firstName, lastName, companyName, email, role")
          .eq("id", project.authorId)
          .single();
        authorProfile = authorData;
      }

      // Fetch assignedTo profile data
      let assignedToProfile = null;
      if (project.assignedToId) {
        const { data: assignedToData } = await supabaseAdmin
          .from("profiles")
          .select("id, firstName, lastName, companyName, email, role")
          .eq("id", project.assignedToId)
          .single();
        assignedToProfile = assignedToData;
      }

      // Fetch file count for the project
      let fileCount = 0;
      let projectFiles: any[] = [];
      try {
        const { data: filesData } = await supabaseAdmin
          .from("files")
          .select("id, fileName, fileType, fileSize, uploadedAt")
          .eq("projectId", project.id);
        fileCount = filesData?.length || 0;
        projectFiles = filesData || [];
      } catch (fileError) {
        console.warn("Could not fetch files for project:", project.id, fileError);
      }

      // Get punchlist stats for single project
      const punchlistStats = await fetchPunchlistStats(supabaseAdmin, [project.id]);

      // Add profile data, file data, and punchlist data to project
      const projectWithProfiles = {
        ...project,
        author: authorProfile,
        assignedTo: assignedToProfile,
        authorProfile: authorProfile,
        assignedToProfile: assignedToProfile,
        projectFiles: projectFiles,
        fileCount: fileCount,
        punchlistItems: punchlistStats[project.id] || { completed: 0, total: 0 },
      };

      return new Response(
        JSON.stringify({
          data: projectWithProfiles,
          pagination: { limit: 1, offset: 0, total: 1, hasMore: false },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build query for multiple projects
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

    // Get project IDs for punchlist stats
    const projectIds = (projects || []).map((p) => p.id);
    const punchlistStats = await fetchPunchlistStats(supabaseAdmin, projectIds);

    // Fetch profile data for all projects
    const projectsWithProfiles = await Promise.all(
      (projects || []).map(async (project) => {
        // Fetch author profile data
        let authorProfile = null;
        if (!supabaseAdmin) {
          return new Response(JSON.stringify({ error: "Database connection not available" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (project.authorId) {
          const { data: authorData } = await supabaseAdmin
            .from("profiles")
            .select("id, firstName, lastName, companyName, email, role")
            .eq("id", project.authorId)
            .single();
          authorProfile = authorData;
        }

        // Fetch assignedTo profile data
        let assignedToProfile = null;
        if (project.assignedToId) {
          const { data: assignedToData } = await supabaseAdmin
            .from("profiles")
            .select("id, firstName, lastName, companyName, email, role")
            .eq("id", project.assignedToId)
            .single();
          assignedToProfile = assignedToData;
        }

        // Fetch file data for the project
        let fileCount = 0;
        let projectFiles: any[] = [];
        try {
          const { data: filesData } = await supabaseAdmin
            .from("files")
            .select("id, fileName, fileType, fileSize, uploadedAt")
            .eq("projectId", project.id);
          fileCount = filesData?.length || 0;
          projectFiles = filesData || [];
        } catch (fileError) {
          console.warn("Could not fetch files for project:", project.id, fileError);
        }

        return {
          ...project,
          author: authorProfile,
          assignedTo: assignedToProfile,
          authorProfile: authorProfile,
          assignedToProfile: assignedToProfile,
          projectFiles: projectFiles,
          fileCount: fileCount,
          punchlistItems: punchlistStats[project.id] || { completed: 0, total: 0 },
        };
      })
    );

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
