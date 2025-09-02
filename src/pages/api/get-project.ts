import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication to get user role for filtering
    const { role } = await checkAuth(cookies);
    const isClient = role === "Client";
    if (!supabase) {
      console.log("📡 [API] Supabase not configured, returning demo projects");

      // For demo purposes, return mock projects when database is not configured
      const mockProjects = [
        {
          id: 1001,
          title: "Demo Office Building",
          description: "Fire protection system for 3-story office building",
          address: "123 Business Blvd, Demo City",
          author_id: "demo-user-id",
          author_email: "demo@example.com",
          assigned_to_name: "John Smith",
          assigned_to_email: "john.smith@example.com",
          status: 20,
          sq_ft: 2500,
          new_construction: true,
          created_at: "2025-01-01T10:00:00Z",
          updated_at: "2025-01-15T09:45:00Z",
          comment_count: 3,
        },
      ];

      return new Response(
        JSON.stringify({
          success: true,
          projects: mockProjects,
          message: "Demo projects (no database interaction)",
          demo: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch all projects - no role-based filtering
    console.log("📡 [API] Fetching all projects");

    // Optimize: Select only needed fields instead of *
    const { data: projects, error } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        description,
        address,
        author_id,
        status,
        sq_ft,
        new_construction,
        renovation,
        addition,
        created_at,
        updated_at
      `
      )
      .order("updated_at", { ascending: false })
      .limit(50); // Add reasonable limit

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

    console.log("📡 [API] Projects fetched:", projects?.length || 0);

    // Optimize: Add comment counts with efficient aggregation query
    if (projects && projects.length > 0) {
      const projectIds = projects.map((p) => p.id);

      try {
        // Use optimized aggregation query to get counts directly
        let countQuery = supabase
          .from("discussion")
          .select("project_id, count(*)", { count: "exact" })
          .in("project_id", projectIds);

        // For clients, exclude internal discussions (Admin/Staff see all)
        if (isClient) {
          countQuery = countQuery.eq("internal", false);
          console.log("📡 [GET-PROJECT] Client filter applied - excluding internal discussions");
        } else {
          console.log("📡 [GET-PROJECT] Admin/Staff - showing all discussions");
        }

        // Use direct query approach (RPC function fallback removed for now)
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

          console.log("📡 [GET-PROJECT] Comment counts added efficiently");
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
