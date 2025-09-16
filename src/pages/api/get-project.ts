import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    // Check authentication to get user role for filtering
    const { currentRole } = await checkAuth(cookies);
    const isClient = currentRole === "Client";

    // Get user ID from query parameters
    const assignedToId = url.searchParams.get("assigned_to_id");

    console.log(`📡 [API] URL search params:`, url.searchParams.toString());
    console.log(`📡 [API] assignedToId value:`, assignedToId);
    console.log(`📡 [API] assignedToId type:`, typeof assignedToId);

    if (assignedToId) {
      console.log(`📡 [API] Filtering projects by assigned_to_id: ${assignedToId}`);
    } else {
      console.log(`📡 [API] No assigned_to_id parameter found`);
    }
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
      });
    }

    // Fetch all projects - no role-based filtering
    // console.log("📡 [API] Fetching all projects");

    // First, get projects without JOINs to ensure basic functionality works
    // console.log("📡 [API] Fetching projects with basic query first...");
    // console.log("📡 [API] Using supabaseAdmin client:", !!supabaseAdmin);
    // console.log(
    //   "📡 [API] Service role key available:",
    //   !!import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    // );
    // console.log("📡 [API] Supabase URL:", import.meta.env.SUPABASE_URL);

    let projects: any[] = [],
      error;

    if (!supabaseAdmin) {
      console.error("📡 [API] CRITICAL: supabaseAdmin is null - check SUPABASE_SERVICE_ROLE_KEY");
      console.log("📡 [API] Falling back to regular supabase client");
      // Fallback to regular client if admin client is not available
      let query = supabase
        .from("projects")
        .select("*")
        .neq("id", 0) // Exclude system log project
        .order("updated_at", { ascending: false });

      // Filter by assigned_to_id if provided
      if (assignedToId) {
        console.log(`📡 [API] Adding filter for assigned_to_id: ${assignedToId}`);
        query = query.eq("assigned_to_id", assignedToId);
      }

      const result = await query;
      projects = result.data || [];
      error = result.error;
    } else {
      console.log("📡 [API] Using supabaseAdmin client to bypass RLS policies");

      // Use admin client to bypass RLS policies for project listing
      let query = supabaseAdmin
        .from("projects")
        .select("*")
        .neq("id", 0) // Exclude system log project
        .order("updated_at", { ascending: false });

      // Filter by assigned_to_id if provided
      if (assignedToId) {
        console.log(`📡 [API] Adding filter for assigned_to_id: ${assignedToId}`);
        query = query.eq("assigned_to_id", assignedToId);
      }

      const result = await query;
      projects = result.data || [];
      error = result.error;

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
      projects.forEach((project: any) => {
        if (project.author_id) {
          const authorProfile = profilesMap.get(project.author_id);
          project.profiles = authorProfile || null;
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
          project.assigned_profiles = profilesMap.get(project.assigned_to_id) || null;
        }
      });
    }

    // Optimize: Add comment counts with efficient aggregation query
    if (projects && projects.length > 0) {
      const projectIds = projects.map((p) => p.id);

      try {
        // Use proper aggregation query to get counts directly
        let countQuery = (supabaseAdmin || supabase)
          .from("discussion")
          .select("project_id")
          .in("project_id", projectIds);

        // For clients, exclude internal discussions (Admin/Staff see all)
        if (isClient) {
          countQuery = countQuery.eq("internal", false);
          // console.log("📡 [GET-PROJECT] Client filter applied - excluding internal discussions");
        } else {
          // console.log("📡 [GET-PROJECT] Admin/Staff - showing all discussions");
        }

        // Execute the query to get all discussions
        const { data: discussions, error: countError } = await countQuery;

        let discussionCounts: Array<{ project_id: number; comment_count: number }> = [];

        if (!countError && discussions) {
          // Count discussions per project
          const countsByProject: Record<number, number> = {};
          discussions.forEach((discussion: any) => {
            countsByProject[discussion.project_id] =
              (countsByProject[discussion.project_id] || 0) + 1;
          });

          discussionCounts = Object.entries(countsByProject).map(([project_id, comment_count]) => ({
            project_id: parseInt(project_id),
            comment_count,
          }));
        }

        if (!countError && discussionCounts) {
          // Create lookup map for comment counts
          const countsByProject: Record<number, number> = {};
          discussionCounts.forEach((item: any) => {
            countsByProject[item.project_id] = item.comment_count;
          });

          // Add comment counts to projects
          projects.forEach((project: any) => {
            project.comment_count = countsByProject[project.id] || 0;
          });

          // console.log("📡 [GET-PROJECT] Comment counts added efficiently");
        } else {
          console.error("Error fetching discussion counts:", countError);
          // Set default comment count to 0 if there's an error
          projects.forEach((project: any) => {
            project.comment_count = 0;
          });
        }
      } catch (error) {
        console.error("Error in comment count optimization:", error);
        projects.forEach((project: any) => {
          project.comment_count = 0;
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        projects: projects || [],
        count: projects?.length || 0,
        filtered_by: assignedToId ? `assigned_to_id: ${assignedToId}` : null,
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
