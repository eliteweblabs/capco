import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request, cookies }) => {
  console.log("📡 [API] GET /api/get-project called");

  try {
    // Check authentication to get user role for filtering
    const { role } = await checkAuth(cookies);
    const isClient = role === "Client";
    console.log("📡 [GET-PROJECT] User role:", role, "isClient:", isClient);
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

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });

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

    // Add comment counts with role-based filtering
    if (projects && projects.length > 0) {
      // Get all discussions for these projects
      const projectIds = projects.map((p) => p.id);

      let discussionsQuery = supabase
        .from("discussion")
        .select("project_id, internal")
        .in("project_id", projectIds);

      // For clients, exclude internal discussions (Admin/Staff see all)
      if (isClient) {
        discussionsQuery = discussionsQuery.eq("internal", false);
        console.log("📡 [GET-PROJECT] Client filter applied - excluding internal discussions");
      } else {
        console.log("📡 [GET-PROJECT] Admin/Staff - showing all discussions");
      }

      const { data: discussions, error: countError } = await discussionsQuery;

      console.log("📡 [GET-PROJECT] Discussions fetched:", {
        isClient,
        role,
        discussionsCount: discussions?.length || 0,
        discussions:
          discussions?.map((d) => ({ project_id: d.project_id, internal: d.internal })) || [],
      });

      if (!countError && discussions) {
        // Count discussions per project
        const countsByProject: Record<number, number> = {};
        discussions.forEach((discussion) => {
          countsByProject[discussion.project_id] =
            (countsByProject[discussion.project_id] || 0) + 1;
        });

        // Add comment counts to projects
        projects.forEach((project) => {
          project.comment_count = countsByProject[project.id] || 0;
        });
      } else {
        console.error("Error fetching discussions:", countError);
        // Set default comment count to 0 if there's an error
        projects.forEach((project) => {
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
