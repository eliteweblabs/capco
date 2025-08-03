import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  try {
    if (!supabase) {
      // For demo purposes, return mock projects when database is not configured
      const mockProjects = [
        {
          id: 1001,
          title: "Demo Office Building",
          description: "Fire protection system for 3-story office building",
          address: "123 Business Blvd, Demo City",
          author_id: "demo-user",
          author_email: "demo@example.com",
          assigned_to_name: "John Smith",
          status: 20, // GENERATING_PROPOSAL
          sq_ft: 2500,
          new_construction: true,
          building: { type: "office", floors: 3 },
          project: { type: "demo", createdAt: "2025-01-01T10:00:00Z" },
          service: { type: "fire_protection", scope: "full_system" },
          requested_docs: ["architectural_plans", "mep_drawings"],
          created: "2025-01-01T10:00:00Z",
          updated_at: "2025-01-15T09:45:00Z",
        },
        {
          id: 1002,
          title: "Retail Complex",
          description: "Sprinkler system for shopping center",
          address: "456 Commerce St, Demo City",
          author_id: "demo-user",
          author_email: "demo@example.com",
          assigned_to_name: "Sarah Johnson",
          status: 50, // PROPOSAL_SIGNED_OFF
          sq_ft: 5000,
          new_construction: false,
          building: { type: "retail", floors: 1 },
          project: { type: "demo", createdAt: "2024-12-15T14:30:00Z" },
          service: { type: "fire_protection", scope: "sprinkler_only" },
          requested_docs: ["as_built_plans", "specifications"],
          created: "2024-12-15T14:30:00Z",
          updated_at: "2025-01-10T16:20:00Z",
        },
      ];

      return new Response(
        JSON.stringify({
          success: true,
          projects: mockProjects,
          message: "Demo projects (no database interaction)",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      // For demo purposes, return mock projects when not authenticated
      const mockProjects = [
        {
          id: 2001,
          title: "Demo Warehouse",
          description: "Fire suppression for industrial facility",
          address: "789 Industrial Pkwy, Demo City",
          author_id: "guest-user",
          author_email: "demo@example.com",
          assigned_to_name: "Mike Davis",
          status: 10, // SPECS_RECEIVED
          sq_ft: 8000,
          new_construction: false,
          building: { type: "warehouse", floors: 1 },
          project: { type: "demo", createdAt: "2025-01-15T09:00:00Z" },
          service: { type: "fire_protection", scope: "suppression_system" },
          requested_docs: ["existing_plans"],
          created: "2025-01-15T09:00:00Z",
          updated_at: "2025-01-15T12:30:00Z",
        },
      ];

      return new Response(
        JSON.stringify({
          success: true,
          projects: mockProjects,
          message: "Demo projects (demo mode - sign in for real projects)",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role;

    // Fetch projects based on user role with assigned user profile data
    let query = supabase
      .from("projects")
      .select(`
        *,
        assigned_to:profiles!projects_assigned_to_id_fkey(name)
      `);

    // Admin gets all projects, clients get only their own
    if (userRole !== "admin") {
      query = query.eq("author_id", user.id);
    }

    const { data: projects, error } = await query.order("updated_at", {
      ascending: false,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch projects: ${error.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Process assigned user data
    if (projects && projects.length > 0) {
      projects.forEach((project) => {
        // Extract assigned user name from the joined data
        project.assigned_to_name = project.assigned_to?.name || null;
        // Clean up the nested object for cleaner response
        delete project.assigned_to;
      });
    }

    // Fetch user emails for all unique author_ids
    if (projects && projects.length > 0) {
      try {
        // First approach: Try RPC function
        const uniqueAuthorIds = [...new Set(projects.map((p) => p.author_id))];
        console.log(
          "Attempting to fetch emails for user IDs:",
          uniqueAuthorIds,
        );

        const { data: emailData, error: emailError } = await supabase.rpc(
          "get_user_emails",
          { user_ids: uniqueAuthorIds },
        );

        if (!emailError && emailData && emailData.length > 0) {
          console.log("Successfully fetched emails via RPC:", emailData);
          // Create a map of user_id -> email
          const emailMap = new Map();
          emailData.forEach((item: any) => {
            emailMap.set(item.id, item.email);
          });

          // Add email to each project
          projects.forEach((project) => {
            project.author_email = emailMap.get(project.author_id) || "Unknown";
          });
        } else {
          console.log(
            "RPC failed, trying alternative approach. Error:",
            emailError,
          );

          // Alternative approach: Try using service role admin methods
          try {
            const { data: authUsers, error: authError } =
              await supabase.auth.admin.listUsers();

            if (!authError && authUsers?.users) {
              console.log("Successfully fetched users via admin API");
              const emailMap = new Map();
              authUsers.users.forEach((user) => {
                emailMap.set(user.id, user.email);
              });

              projects.forEach((project) => {
                project.author_email =
                  emailMap.get(project.author_id) || "Unknown";
              });
            } else {
              console.log(
                "Admin API failed, using fallback. Error:",
                authError,
              );
              // Final fallback: show friendly message for unassigned projects
              projects.forEach((project) => {
                project.author_email = "Unassigned";
              });
            }
          } catch (adminError) {
            console.log("Admin API error:", adminError);
            // Final fallback: show friendly message for unassigned projects
            projects.forEach((project) => {
              project.author_email = "Unassigned";
            });
          }
        }
      } catch (error) {
        console.log("Email fetch error:", error);
        // Final fallback: show friendly message for unassigned projects
        projects.forEach((project) => {
          project.author_email = "Unassigned";
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        projects: projects || [],
        message: `Found ${projects?.length || 0} projects for user`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Get user projects API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
