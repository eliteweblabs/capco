/**
 * Enhanced Get Project API with Advanced Filtering and Search
 *
 * This API supports comprehensive filtering, searching, and pagination for projects.
 *
 * Query Parameters:
 * - assigned_to_id: Filter by assigned user ID
 * - author_id: Filter by project author ID
 * - search: Search across title, address, subject, building, project, service fields
 * - status: Filter by project status (integer)
 * - building: Filter by building type (partial match)
 * - project: Filter by project type (partial match)
 * - service: Filter by service type (partial match)
 * - new_construction: Filter by new construction (true/false)
 * - date_from: Filter projects created after this date (ISO format)
 * - date_to: Filter projects created before this date (ISO format)
 * - due_date_from: Filter projects with due_date after this date (ISO format)
 * - due_date_to: Filter projects with due_date before this date (ISO format)
 * - overdue: Filter for overdue projects (true/false)
 * - sort_by: Sort field (default: updated_at)
 * - sort_order: Sort direction (asc/desc, default: desc)
 * - limit: Number of results to return (default: no limit)
 * - offset: Number of results to skip (default: 0)
 *
 * Examples:
 * - /api/get-project?search=fire&status=1&limit=10
 * - /api/get-project?author_id=123&sort_by=created_at&sort_order=asc
 * - /api/get-project?building=residential&date_from=2024-01-01&date_to=2024-12-31
 * - /api/get-project?overdue=true&sort_by=due_date&sort_order=asc
 *
 * Response includes:
 * - projects: Array of project objects with enhanced data
 * - count: Number of projects returned
 * - filtered_by: Human-readable description of applied filters
 * - pagination: Pagination metadata
 * - filters_applied: Object containing all applied filter values
 */

import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

// Filter interface for type safety
interface FilterParams {
  assignedToId?: string | null;
  authorId?: string | null;
  search?: string | null;
  status?: string | null;
  building?: string | null;
  project?: string | null;
  service?: string | null;
  newConstruction?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  dueDateFrom?: string | null;
  dueDateTo?: string | null;
  overdue?: string | null;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  offset?: number;
}

// Apply filters to the query
function applyFilters(query: any, filters: FilterParams) {
  const {
    assignedToId,
    authorId,
    search,
    status,
    building,
    project,
    service,
    newConstruction,
    dateFrom,
    dateTo,
    dueDateFrom,
    dueDateTo,
    overdue,
    sortBy,
    sortOrder,
    limit,
    offset,
  } = filters;

  // Filter by assigned_to_id if provided
  if (assignedToId) {
    console.log(`📡 [API] Adding filter for assigned_to_id: ${assignedToId}`);
    query = query.eq("assigned_to_id", assignedToId);
  }

  // Filter by author_id if provided
  if (authorId) {
    console.log(`📡 [API] Adding filter for author_id: ${authorId}`);
    query = query.eq("author_id", authorId);
  }

  // Search functionality - searches across multiple fields
  if (search) {
    console.log(`📡 [API] Adding search filter: ${search}`);
    query = query.or(
      `title.ilike.%${search}%,address.ilike.%${search}%,subject.ilike.%${search}%,building.ilike.%${search}%,project.ilike.%${search}%,service.ilike.%${search}%`
    );
  }

  // Filter by status if provided
  if (status) {
    console.log(`📡 [API] Adding filter for status: ${status}`);
    query = query.eq("status", status);
  }

  // Filter by building if provided
  if (building) {
    console.log(`📡 [API] Adding filter for building: ${building}`);
    query = query.ilike("building", `%${building}%`);
  }

  // Filter by project if provided
  if (project) {
    console.log(`📡 [API] Adding filter for project: ${project}`);
    query = query.ilike("project", `%${project}%`);
  }

  // Filter by service if provided
  if (service) {
    console.log(`📡 [API] Adding filter for service: ${service}`);
    query = query.ilike("service", `%${service}%`);
  }

  // Filter by new_construction if provided
  if (newConstruction !== null && newConstruction !== undefined) {
    console.log(`📡 [API] Adding filter for new_construction: ${newConstruction}`);
    query = query.eq("new_construction", newConstruction === "true");
  }

  // Date range filters
  if (dateFrom) {
    console.log(`📡 [API] Adding filter for date_from: ${dateFrom}`);
    query = query.gte("created_at", dateFrom);
  }

  if (dateTo) {
    console.log(`📡 [API] Adding filter for date_to: ${dateTo}`);
    query = query.lte("created_at", dateTo);
  }

  // Due date range filters
  if (dueDateFrom) {
    console.log(`📡 [API] Adding filter for due_date_from: ${dueDateFrom}`);
    query = query.gte("due_date", dueDateFrom);
  }

  if (dueDateTo) {
    console.log(`📡 [API] Adding filter for due_date_to: ${dueDateTo}`);
    query = query.lte("due_date", dueDateTo);
  }

  // Overdue filter
  if (overdue === "true") {
    console.log(`📡 [API] Adding filter for overdue: true`);
    query = query.lt("due_date", new Date().toISOString());
  } else if (overdue === "false") {
    console.log(`📡 [API] Adding filter for overdue: false`);
    query = query.gte("due_date", new Date().toISOString());
  }

  // Sorting
  const ascending = sortOrder === "asc";
  console.log(`📡 [API] Adding sort: ${sortBy} ${sortOrder}`);
  query = query.order(sortBy, { ascending });

  // Pagination
  if (limit && limit > 0) {
    console.log(`📡 [API] Adding limit: ${limit}`);
    query = query.limit(limit);
  }

  if (offset && offset > 0) {
    console.log(`📡 [API] Adding offset: ${offset}`);
    query = query.range(offset, offset + (limit && limit > 0 ? limit - 1 : 1000));
  }

  return query;
}

export const GET: APIRoute = async ({ request, cookies, url, params }) => {
  try {
    // Check if this is a request for a specific project ID (query parameter)
    const projectId = url.searchParams.get("id");

    if (projectId) {
      // Handle single project request (from /api/get-project?id=123)
      return await handleSingleProject(projectId, cookies);
    }

    // Handle multiple projects request (from /api/get-project)
    // Check authentication to get user role for filtering
    const { currentUser } = await checkAuth(cookies);
    const currentRole = currentUser?.profile?.role;
    const isClient = currentRole === "Client";

    // Get filter parameters from query
    const assignedToId = url.searchParams.get("assigned_to_id");
    const authorId = url.searchParams.get("author_id");
    const search = url.searchParams.get("search");
    const status = url.searchParams.get("status");
    const building = url.searchParams.get("building");
    const project = url.searchParams.get("project");
    const service = url.searchParams.get("service");
    const newConstruction = url.searchParams.get("new_construction");
    const dateFrom = url.searchParams.get("date_from");
    const dateTo = url.searchParams.get("date_to");
    const dueDateFrom = url.searchParams.get("due_date_from");
    const dueDateTo = url.searchParams.get("due_date_to");
    const overdue = url.searchParams.get("overdue");
    const sortBy = url.searchParams.get("sort_by") || "updated_at";
    const sortOrder = url.searchParams.get("sort_order") || "desc";
    const limit = parseInt(url.searchParams.get("limit") || "0");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
      });
    }

    let projects: any[] = [],
      error;

    if (!supabaseAdmin) {
      console.error("📡 [API] CRITICAL: supabaseAdmin is null - check SUPABASE_SERVICE_ROLE_KEY");
      console.log("📡 [API] Falling back to regular supabase client");
      // Fallback to regular client if admin client is not available
      let query = supabase.from("projects").select("*").neq("id", 0); // Exclude system log project

      // Apply all filters
      query = applyFilters(query, {
        assignedToId,
        authorId,
        search,
        status,
        building,
        project,
        service,
        newConstruction,
        dateFrom,
        dateTo,
        dueDateFrom,
        dueDateTo,
        overdue,
        sortBy,
        sortOrder,
        limit,
        offset,
      });

      const result = await query;
      projects = result.data || [];
      error = result.error;
    } else {
      // console.log("📡 [API] Using supabaseAdmin client to bypass RLS policies");

      // Use admin client to bypass RLS policies for project listing
      // Now includes featured_image_data for optimized queries
      let query = supabaseAdmin.from("projects").select("*, featured_image_data").neq("id", 0); // Exclude system log project

      // Apply all filters
      query = applyFilters(query, {
        assignedToId,
        authorId,
        search,
        status,
        building,
        project,
        service,
        newConstruction,
        dateFrom,
        dateTo,
        dueDateFrom,
        dueDateTo,
        overdue,
        sortBy,
        sortOrder,
        limit,
        offset,
      });

      const result = await query;
      projects = result.data || [];
      error = result.error;

      // Debug: Log sample project data to see what fields are available
      // if (projects.length > 0) {
      //   console.log("📡 [GET-PROJECT] Sample project raw data:", {
      //     id: projects[0].id,
      //     title: projects[0].title,
      //     featured_image: projects[0].featured_image,
      //     featured_image_url: projects[0].featured_image_url,
      //     allKeys: Object.keys(projects[0]),
      //   });
      // }

      // } else {
      //   // Use admin client to bypass RLS policies for project listing
      //   let query = supabaseAdmin
      //     .from("projects")
      //     .select(
      //       `
      //       id,
      //       title,
      //       description,
      //       address,
      //       author_id,
      //       status,
      //       sq_ft,
      //       new_construction,
      //       created_at,
      //       updated_at,
      //       assigned_to_id,
      //       featured_image,
      //       featured_image_url,
      //       company_name,
      //       subject,
      //       proposal_signature,
      //       signed_at,
      //       contract_pdf_url,
      //       building,
      //       project,
      //       service,
      //       requested_docs,
      //       architect,
      //       units
      //     `
      //     )
      //     .neq("id", 0) // Exclude system log project
      //     .order("updated_at", { ascending: false });

      //   // Filter by assigned_to_id if provided
      //   if (assignedToId) {
      //     query = query.eq("assigned_to_id", assignedToId);
      //   }

      //   const result = await query;
      //   projects = result.data;
      //   error = result.error;
    }

    if (error) {
      console.error("📡 [API] Error fetching projects:", error);
      console.error("📡 [API] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    } else {
      // console.log("📡 [API] Successfully fetched projects:", projects?.length || 0);
      if (projects && projects.length > 0) {
        // console.log("📡 [API] Sample project:", {
        //   id: projects[0].id,
        //   title: projects[0].title,
        //   author_id: projects[0].author_id,
        //   status: projects[0].status,
        // });
      }
    }

    if (error) {
      console.error("Error fetching projects:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // console.log("📡 [API] Projects fetched:", projects?.length || 0);

    // Optimize: Batch fetch author profiles to eliminate N+1 queries
    if (projects && projects.length > 0) {
      const uniqueAuthorIds = [...new Set(projects.map((p) => p.author_id).filter(Boolean))];
      const uniqueAssignedIds = [...new Set(projects.map((p) => p.assigned_to_id).filter(Boolean))];
      const allUserIds = [...new Set([...uniqueAuthorIds, ...uniqueAssignedIds])];

      // console.log("📡 [API] Fetching profiles for users:", allUserIds.length);
      // console.log("📡 [API] Unique author IDs:", uniqueAuthorIds);
      // console.log("📡 [API] Sample project author_id:", projects[0]?.author_id);

      let profilesMap = new Map();
      if (allUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await (supabaseAdmin || supabase)
          .from("profiles")
          .select("id, company_name, first_name, last_name")
          .in("id", allUserIds);

        if (!profilesError && profiles) {
          profiles.forEach((profile) => {
            profilesMap.set(profile.id, profile);
          });
          // console.log("📡 [API] Successfully fetched profiles:", profiles.length);
          // console.log("📡 [API] Sample profile:", profiles[0]);
        } else {
          console.error("📡 [API] Error fetching profiles:", profilesError);
        }
      }

      // Attach profile data to projects
      for (const project of projects) {
        if (project.author_id) {
          const authorProfile = profilesMap.get(project.author_id);
          project.authorProfile = authorProfile || null;
          if (authorProfile) {
            // console.log("📡 [API] Attached profile to project:", {
            //   projectId: project.id,
            //   authorId: project.author_id,
            //   companyName: authorProfile.company_name,
            //   profile: authorProfile,
            // });
          } else {
            console.log("📡 [API] No profile found for author:", project.author_id);
          }
        }
        if (project.assigned_to_id) {
          project.assignedToProfile = profilesMap.get(project.assigned_to_id) || null;
        }

        // Process featured image data (new system using featured_image_id)
        if (project.featured_image_id && (supabaseAdmin || supabase)) {
          try {
            // Get featured image from files table using featured_image_id
            const client = supabaseAdmin || supabase;
            const { data: featuredImageFile, error: featuredImageError } = await client
              .from("files")
              .select("*")
              .eq("id", project.featured_image_id)
              .single();

            if (!featuredImageError && featuredImageFile) {
              // Generate signed URL using bucket name
              const bucketName = featuredImageFile.bucket_name || "project-documents";
              const { data: urlData, error: urlError } = await client.storage
                .from(bucketName)
                .createSignedUrl(featuredImageFile.file_path, 3600);

              if (urlError) {
                console.warn("Failed to generate signed URL for featured image:", urlError);
              }

              project.featured_image_data = {
                id: featuredImageFile.id,
                file_path: featuredImageFile.file_path,
                file_name: featuredImageFile.file_name,
                file_type: featuredImageFile.file_type,
                public_url: urlData?.signedUrl || null,
                bucket_name: bucketName,
                title: featuredImageFile.title,
                uploaded_at: featuredImageFile.uploaded_at,
              };
            } else {
              // console.warn(
              //   "📡 [GET-PROJECT] Featured image file not found for project",
              //   project.id,
              //   "featured_image_id:",
              //   project.featured_image_id
              // );
              project.featured_image_data = null;
            }
          } catch (error) {
            console.warn(
              "📡 [GET-PROJECT] Error loading featured image for project",
              project.id,
              error
            );
            project.featured_image_data = null;
          }
        } else if (project.featured_image) {
          // Fallback: Handle old featured_image JSON format for backward compatibility
          try {
            const featuredImageData =
              typeof project.featured_image === "string"
                ? JSON.parse(project.featured_image)
                : project.featured_image;

            project.featured_image_data = {
              id: featuredImageData.id,
              file_path: featuredImageData.file_path,
              file_name: featuredImageData.file_name,
              file_type: featuredImageData.file_type,
              public_url: featuredImageData.public_url || project.featured_image_url,
            };
          } catch (error) {
            console.warn(
              "📡 [GET-PROJECT] Error parsing legacy featured_image for project",
              project.id,
              error
            );
            project.featured_image_data = null;
          }
        } else {
          project.featured_image_data = null;
        }
      }
    }

    // Optimize: Add comment counts with efficient aggregation query
    if (projects && projects.length > 0) {
      const projectIds = projects.map((p) => p.id);

      try {
        // Get total discussion counts
        let totalCountQuery = (supabaseAdmin || supabase)
          .from("discussion")
          .select("project_id")
          .in("project_id", projectIds);

        // Get incomplete discussion counts (where mark_completed = false)
        let incompleteCountQuery = (supabaseAdmin || supabase)
          .from("discussion")
          .select("project_id")
          .in("project_id", projectIds)
          .eq("mark_completed", false);

        // For clients, exclude internal discussions (Admin/Staff see all)
        if (isClient) {
          totalCountQuery = totalCountQuery.eq("internal", false);
          incompleteCountQuery = incompleteCountQuery.eq("internal", false);
          // console.log("📡 [GET-PROJECT] Client filter applied - excluding internal discussions");
        } else {
          // console.log("📡 [GET-PROJECT] Admin/Staff - showing all discussions");
        }

        // Execute both queries in parallel
        const [
          { data: totalDiscussions, error: totalError },
          { data: incompleteDiscussions, error: incompleteError },
        ] = await Promise.all([totalCountQuery, incompleteCountQuery]);

        // console.log("📡 [GET-PROJECT] Discussion query results:", {
        //   totalDiscussionsFound: totalDiscussions?.length || 0,
        //   incompleteDiscussionsFound: incompleteDiscussions?.length || 0,
        //   totalError: totalError?.message || null,
        //   incompleteError: incompleteError?.message || null,
        // });

        let discussionCounts: Array<{
          project_id: number;
          comment_count: number;
          incomplete_count: number;
        }> = [];

        if (!totalError && !incompleteError && totalDiscussions && incompleteDiscussions) {
          // Count total discussions per project
          const totalCountsByProject: Record<number, number> = {};
          totalDiscussions.forEach((discussion: any) => {
            totalCountsByProject[discussion.project_id] =
              (totalCountsByProject[discussion.project_id] || 0) + 1;
          });

          // Count incomplete discussions per project
          const incompleteCountsByProject: Record<number, number> = {};
          incompleteDiscussions.forEach((discussion: any) => {
            incompleteCountsByProject[discussion.project_id] =
              (incompleteCountsByProject[discussion.project_id] || 0) + 1;
          });

          // console.log("📡 [GET-PROJECT] Total discussion counts by project:", totalCountsByProject);
          // console.log(
          //   "📡 [GET-PROJECT] Incomplete discussion counts by project:",
          //   incompleteCountsByProject
          // );

          discussionCounts = Object.entries(totalCountsByProject).map(
            ([project_id, comment_count]) => ({
              project_id: parseInt(project_id),
              comment_count,
              incomplete_count: incompleteCountsByProject[parseInt(project_id)] || 0,
            })
          );
        }

        if (!totalError && !incompleteError && discussionCounts) {
          // console.log("📡 [GET-PROJECT] Processing discussion counts:", discussionCounts.length);

          // Create lookup maps for both counts
          const totalCountsByProject: Record<number, number> = {};
          const incompleteCountsByProject: Record<number, number> = {};

          discussionCounts.forEach((item: any) => {
            totalCountsByProject[item.project_id] = item.comment_count;
            incompleteCountsByProject[item.project_id] = item.incomplete_count;
          });

          // console.log("📡 [GET-PROJECT] Lookup maps created:", {
          //   totalCountsByProject,
          //   incompleteCountsByProject,
          // });

          // Add comment counts to projects
          projects.forEach((project: any) => {
            const totalCount = totalCountsByProject[project.id] || 0;
            const incompleteCount = incompleteCountsByProject[project.id] || 0;

            project.comment_count = totalCount;
            project.incomplete_discussions = incompleteCount;

            // Add a formatted ratio string for easy display
            project.discussion_ratio = `${incompleteCount}/${totalCount}`;
          });

          // console.log("📡 [GET-PROJECT] Discussion counts added efficiently");
          // console.log("📡 [GET-PROJECT] Sample project with counts:", {
          //   id: projects[0]?.id,
          //   title: projects[0]?.title,
          //   comment_count: projects[0]?.comment_count,
          //   incomplete_discussions: projects[0]?.incomplete_discussions,
          //   discussion_ratio: projects[0]?.discussion_ratio,
          // });
        } else {
          console.error("Error fetching discussion counts:", {
            totalError: totalError?.message,
            incompleteError: incompleteError?.message,
            totalDiscussionsFound: totalDiscussions?.length || 0,
            incompleteDiscussionsFound: incompleteDiscussions?.length || 0,
            discussionCountsLength: discussionCounts?.length || 0,
          });
          // Set default counts to 0 if there's an error
          projects.forEach((project: any) => {
            project.comment_count = 0;
            project.incomplete_discussions = 0;
            project.discussion_ratio = "0/0";
          });
        }
      } catch (error) {
        console.error("Error in comment count optimization:", error);
        projects.forEach((project: any) => {
          project.comment_count = 0;
          project.incomplete_discussions = 0;
          project.discussion_ratio = "0/0";
        });
      }
    }

    // Add punchlist statistics to projects
    if (projects && projects.length > 0) {
      const projectIds = projects.map((p) => p.id);

      try {
        // Get punchlist stats for all projects
        const { data: punchlistData, error: punchlistError } = await (supabaseAdmin || supabase)
          .from("punchlist")
          .select("project_id, mark_completed")
          .in("project_id", projectIds);

        if (!punchlistError && punchlistData) {
          // Group by project_id and count completed vs total
          const punchlistStats: Record<number, { completed: number; total: number }> = {};

          projectIds.forEach((projectId) => {
            punchlistStats[projectId] = { completed: 0, total: 0 };
          });

          punchlistData.forEach((item) => {
            if (!punchlistStats[item.project_id]) {
              punchlistStats[item.project_id] = { completed: 0, total: 0 };
            }
            punchlistStats[item.project_id].total++;
            if (item.mark_completed) {
              punchlistStats[item.project_id].completed++;
            }
          });

          // Add punchlist stats to projects
          projects.forEach((project: any) => {
            project.punchlistItems = punchlistStats[project.id] || { completed: 0, total: 0 };
          });

          // console.log("📡 [GET-PROJECT] Punchlist stats added to projects");
        } else {
          console.error("Error fetching punchlist stats:", punchlistError);
          // Set default punchlist stats to 0 if there's an error
          projects.forEach((project: any) => {
            project.punchlistItems = { completed: 0, total: 0 };
          });
        }
      } catch (error) {
        console.error("Error in punchlist stats processing:", error);
        projects.forEach((project: any) => {
          project.punchlistItems = { completed: 0, total: 0 };
        });
      }
    }

    // Build filter description for response
    const filters = [];
    if (assignedToId) filters.push(`assigned_to_id: ${assignedToId}`);
    if (authorId) filters.push(`author_id: ${authorId}`);
    if (search) filters.push(`search: ${search}`);
    if (status) filters.push(`status: ${status}`);
    if (building) filters.push(`building: ${building}`);
    if (project) filters.push(`project: ${project}`);
    if (service) filters.push(`service: ${service}`);
    if (newConstruction !== null && newConstruction !== undefined)
      filters.push(`new_construction: ${newConstruction}`);
    if (dateFrom) filters.push(`date_from: ${dateFrom}`);
    if (dateTo) filters.push(`date_to: ${dateTo}`);
    if (dueDateFrom) filters.push(`due_date_from: ${dueDateFrom}`);
    if (dueDateTo) filters.push(`due_date_to: ${dueDateTo}`);
    if (overdue) filters.push(`overdue: ${overdue}`);
    const filteredBy = filters.length > 0 ? filters.join(", ") : null;

    // Add full document data for each project
    let projectsWithDocuments = projects || [];
    if (projects && projects.length > 0) {
      try {
        const projectIds = projects.map((p) => p.id);

        // Get all files for all projects
        const { data: allFiles, error: filesError } = await (supabaseAdmin || supabase)
          .from("files")
          .select("*")
          .in("project_id", projectIds)
          .eq("status", "active")
          .order("uploaded_at", { ascending: false });

        // Get all generated documents for all projects
        const { data: allDocuments, error: docsError } = await (supabaseAdmin || supabase)
          .from("generated_documents")
          .select("*")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false });

        if (filesError) {
          console.error("📡 [API] Error fetching project files:", filesError);
        }
        if (docsError) {
          console.error("📡 [API] Error fetching generated documents:", docsError);
        }

        // Group files and documents by project_id
        const filesByProject = new Map();
        const documentsByProject = new Map();

        allFiles?.forEach((file) => {
          if (!filesByProject.has(file.project_id)) {
            filesByProject.set(file.project_id, []);
          }
          filesByProject.get(file.project_id).push(file);
        });

        allDocuments?.forEach((doc) => {
          if (!documentsByProject.has(doc.project_id)) {
            documentsByProject.set(doc.project_id, []);
          }
          documentsByProject.get(doc.project_id).push(doc);
        });

        // Add full document data to projects
        projectsWithDocuments = projects.map((project) => ({
          ...project,
          projectFiles: filesByProject.get(project.id) || [],
          generatedDocuments: documentsByProject.get(project.id) || [],
        }));
      } catch (error) {
        console.error("📡 [API] Error fetching document data:", error);
        // Continue with original projects if document fetch fails
        projectsWithDocuments = projects;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        projects: projectsWithDocuments,
        count: projects?.length || 0,
        filtered_by: filteredBy,
        pagination: {
          limit: limit || null,
          offset: offset || 0,
          has_more: limit > 0 && projects?.length === limit,
        },
        filters_applied: {
          assigned_to_id: assignedToId,
          author_id: authorId,
          search: search,
          status: status,
          building: building,
          project: project,
          service: service,
          new_construction: newConstruction,
          date_from: dateFrom,
          date_to: dateTo,
          due_date_from: dueDateFrom,
          due_date_to: dueDateTo,
          overdue: overdue,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get projects error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch projects",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Handle single project request (from /api/get-project/[id])
async function handleSingleProject(projectId: string, cookies: any) {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);

    if (!isAuth || !currentUser) {
      console.error("📡 [GET-PROJECT-ID] User not authenticated");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database connection not available",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get project data with RLS handling authorization
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    // Remove the log column if it exists
    if (project && project.log) {
      delete project.log;
    }

    if (projectError) {
      console.error("📡 [GET-PROJECT-ID] Database error:", projectError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Project not found or access denied",
          details: projectError.message,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!project) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Project not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get project author's profile data
    let authorProfile: any = null;
    if (project.author_id) {
      try {
        // Try admin client first, fallback to regular client
        let client = supabaseAdmin;
        if (!client) {
          // console.log("📡 [GET-PROJECT-ID] Admin client not available, using regular client");
          // console.log("📡 [GET-PROJECT-ID] supabaseAdmin value:", supabaseAdmin);
          // console.log("📡 [GET-PROJECT-ID] supabase value:", !!supabase);
          client = supabase;
        } else {
          // console.log("📡 [GET-PROJECT-ID] Using admin client for profile query");
        }

        // Try to fetch the profile, but if it fails due to RLS, create a fallback
        const { data: profileData, error: authorError } = await client
          .from("profiles")
          .select("*")
          .eq("id", project.author_id)
          .single();

        if (authorError) {
          console.error("📡 [GET-PROJECT-ID] Error fetching author profile:", authorError);
          console.error("📡 [GET-PROJECT-ID] Author ID:", project.author_id);
          console.error("📡 [GET-PROJECT-ID] Error details:", {
            message: authorError.message,
            code: authorError.code,
            details: authorError.details,
            hint: authorError.hint,
          });

          // Create a minimal profile object if we can't fetch the full profile
          authorProfile = {
            id: project.author_id,
            company_name: project.company_name || "Unknown Company",
            first_name: "Unknown",
            last_name: "User",
          };
        } else {
          // console.log("📡 [GET-PROJECT-ID] Successfully fetched author profile");
          authorProfile = profileData;
        }
      } catch (error) {
        console.error("📡 [GET-PROJECT-ID] Exception fetching author profile:", error);
        // Create a minimal profile object as fallback
        authorProfile = {
          id: project.author_id,
          company_name: project.company_name || "Unknown Company",
          first_name: "Unknown",
          last_name: "User",
        };
      }
    }

    // Get assigned user's profile data if project has an assigned user
    let assignedToProfile = null;
    if (project.assigned_to_id) {
      try {
        // Try admin client first, fallback to regular client
        let client = supabaseAdmin;
        if (!client) {
          // console.log(
          //   "📡 [GET-PROJECT-ID] Admin client not available for assigned user, using regular client"
          // );
          client = supabase;
        }

        const { data: assignedToProfile, error: assignedError } = await client
          .from("profiles")
          .select("id, company_name")
          .eq("id", project.assigned_to_id)
          .maybeSingle();

        if (assignedError) {
          console.error("📡 [GET-PROJECT-ID] Error fetching assigned user profile:", assignedError);
          console.error("📡 [GET-PROJECT-ID] Assigned user ID:", project.assigned_to_id);
          project.assigned_to_name = project.assigned_to_name || "Unknown User";
        } else if (assignedToProfile) {
          // Add assigned user name to the project data
          project.assigned_to_name = assignedToProfile.company_name || assignedToProfile.id;
        } else {
          // Profile not found for assigned user ID
          console.error(
            "📡 [GET-PROJECT-ID] No profile found for assigned user ID:",
            project.assigned_to_id
          );
          project.assigned_to_name = project.assigned_to_name || "Unknown User";
        }
      } catch (error) {
        console.error("📡 [GET-PROJECT-ID] Exception fetching assigned user profile:", error);
        project.assigned_to_name = project.assigned_to_name || "Unknown User";
      }
    } else {
      project.assigned_to_name = null;
    }

    // Get project files/documents
    let projectFiles = [];
    let generatedDocuments = [];

    try {
      // Try admin client first, fallback to regular client
      let client = supabaseAdmin;
      if (!client) {
        console.log(
          "📡 [GET-PROJECT-ID] Admin client not available for files/documents, using regular client"
        );
        client = supabase;
      }

      // Fetch project files
      const { data: files, error: filesError } = await client
        .from("files")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "active")
        .order("uploaded_at", { ascending: false });

      if (filesError) {
        console.error("📡 [GET-PROJECT-ID] Error fetching project files:", filesError);
        projectFiles = []; // Set empty array on error
      } else {
        projectFiles = files || [];
      }

      // Fetch generated documents (PDFs)
      const { data: documents, error: documentsError } = await client
        .from("generated_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (documentsError) {
        console.error("📡 [GET-PROJECT-ID] Error fetching generated documents:", documentsError);
        generatedDocuments = []; // Set empty array on error
      } else {
        generatedDocuments = documents || [];
      }
    } catch (error) {
      console.error("📡 [GET-PROJECT-ID] Error fetching document data:", error);
      projectFiles = [];
      generatedDocuments = [];
    }

    project.authorProfile = authorProfile;
    project.projectFiles = projectFiles;
    project.generatedDocuments = generatedDocuments;
    project.assignedToProfile = assignedToProfile;
    // project.punchlistItems = punchlistItems;

    return new Response(
      JSON.stringify({
        success: true,
        project: project,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("📡 [GET-PROJECT-ID] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
