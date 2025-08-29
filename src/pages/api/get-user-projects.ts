import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  console.log("📡 [API] GET /api/get-user-projects called");

  try {
    console.log("📡 [API] Checking Supabase configuration...");

    if (!supabase) {
      console.log("📡 [API] Supabase not configured, returning demo projects");

      // For demo purposes, return mock projects when database is not configured
      const mockProjects = [
        {
          id: 1001,
          title: "Demo Office Building",
          description: "Fire protection system for 3-story office building",
          address: "123 Business Blvd, Demo City",
          author_id: "bb38790d-c3f9-4d97-8cd6-64f6c1a1c328", // Use real user ID
          author_email: "tom@tomsens.com", // Use real email
          assigned_to_name: "John Smith",
          assigned_to_email: "john.smith@example.com",
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
          author_id: "bb38790d-c3f9-4d97-8cd6-64f6c1a1c328", // Use real user ID
          author_email: "tom@tomsens.com", // Use real email
          assigned_to_name: "Sarah Johnson",
          assigned_to_email: "sarah.johnson@example.com",
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
          demo: true,
          authenticated: false,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("📡 [API] Getting current user...");

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("📡 [API] User auth result:", {
      hasUser: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      hasError: !!userError,
      errorMessage: userError?.message || null,
    });

    if (userError || !user) {
      console.log("📡 [API] No authenticated user, returning demo projects");

      // For demo purposes, return mock projects when not authenticated
      const mockProjects = [
        {
          id: 2001,
          title: "Demo Warehouse",
          description: "Fire suppression for industrial facility",
          address: "789 Industrial Pkwy, Demo City",
          author_id: "bb38790d-c3f9-4d97-8cd6-64f6c1a1c328", // Use real user ID
          author_email: "tom@tomsens.com", // Use real email
          assigned_to_name: "Mike Davis",
          assigned_to_email: "mike.davis@example.com",
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
          demo: true,
          authenticated: false,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("📡 [API] Getting user profile for role...");

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role;
    console.log("📡 [API] User role:", userRole);

    console.log("📡 [API] Building projects query...");

    // First try to fetch projects with the foreign key relationship
    let query = supabase.from("projects").select(`
        *,
        assigned_to:profiles!projects_assigned_to_id_fkey(name, id)
      `);

    // Admin and Staff get all projects, clients get only their own
    if (userRole !== "Admin" && userRole !== "Staff") {
      console.log("📡 [API] Client user, filtering by author_id:", user.id);
      query = query.eq("author_id", user.id);
    } else {
      console.log("📡 [API] Admin/Staff user, getting all projects");
    }

    console.log("📡 [API] Executing projects query...");
    let { data: projects, error } = await query.order("updated_at", {
      ascending: false,
    });

    console.log("📡 [API] Initial query result:", {
      hasProjects: !!projects,
      projectCount: projects?.length || 0,
      hasError: !!error,
      errorMessage: error?.message || null,
    });

    // If the foreign key relationship fails, try without it
    if (error && error.message.includes("relationship")) {
      console.log("📡 [API] Foreign key relationship failed, trying simple query");

      let simpleQuery = supabase.from("projects").select("*");

      // Admin and Staff get all projects, clients get only their own
      if (userRole !== "Admin" && userRole !== "Staff") {
        simpleQuery = simpleQuery.eq("author_id", user.id);
      }

      const result = await simpleQuery.order("updated_at", {
        ascending: false,
      });
      projects = result.data;
      error = result.error;

      console.log("📡 [API] Simple query result:", {
        hasProjects: !!projects,
        projectCount: projects?.length || 0,
        hasError: !!error,
        errorMessage: error?.message || null,
      });
    }

    if (error) {
      console.error("📡 [API] Projects fetch error:", error);

      // Return empty projects array instead of error when database is empty
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        console.log("📡 [API] Database table does not exist, returning empty projects");
        return new Response(
          JSON.stringify({
            projects: [],
            message: "No projects found. Database may be empty or not yet configured.",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ error: `Failed to fetch projects: ${error.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("📡 [API] Processing project data...");

    // Process assigned user data
    if (projects && projects.length > 0) {
      projects.forEach((project) => {
        // Extract assigned user name from the joined data
        project.assigned_to_name = project.assigned_to?.name || null;
        project.assigned_to_id = project.assigned_to?.id || null;
        // Clean up the nested object for cleaner response
        delete project.assigned_to;
      });
    }

    // Fetch user data (emails and names) for all unique author_ids
    if (projects && projects.length > 0) {
      console.log("📡 [API] Fetching user data for projects...");

      try {
        // Get unique user IDs
        const uniqueUserIds = [
          ...new Set([
            ...projects.map((p) => p.author_id),
            ...projects.map((p) => p.assigned_to_id).filter(Boolean),
          ]),
        ];

        console.log("📡 [API] Unique user IDs to fetch:", uniqueUserIds);

        // Fetch user profiles for names
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", uniqueUserIds);

        console.log("📡 [API] Profiles query result:", {
          hasProfiles: !!profiles,
          profileCount: profiles?.length || 0,
          hasError: !!profilesError,
          errorMessage: profilesError?.message || null,
        });

        if (profilesError) {
          console.log("📡 [API] Profiles fetch error:", profilesError);
        }

        // Create maps for user data
        const nameMap = new Map();
        if (profiles) {
          console.log("📡 [API] Processing profiles:", profiles);
          profiles.forEach((profile) => {
            nameMap.set(profile.id, profile.company_name);
          });
        } else {
          console.log("📡 [API] No profiles found for user IDs:", uniqueUserIds);
        }

        console.log("📡 [API] Fetching user data via admin API...");

        // Use admin API to get user emails and avatar URLs
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

        console.log("📡 [API] Admin API result:", {
          hasUsers: !!authUsers?.users,
          userCount: authUsers?.users?.length || 0,
          hasError: !!authError,
          errorMessage: authError?.message || null,
        });

        if (!authError && authUsers?.users) {
          console.log("📡 [API] Successfully fetched users via admin API");
          // Create maps for user data
          const emailMap = new Map();
          const avatarMap = new Map();

          authUsers.users.forEach((authUser) => {
            if (uniqueUserIds.includes(authUser.id)) {
              emailMap.set(authUser.id, authUser.email);
              // Get avatar URL from user metadata
              const avatarUrl = authUser.user_metadata?.avatar_url || null;
              avatarMap.set(authUser.id, avatarUrl);
            }
          });

          console.log("📡 [API] Adding user data to projects...");

          // Add user data to each project
          projects.forEach((project) => {
            project.author_email = emailMap.get(project.author_id) || null;
            project.author_name = nameMap.get(project.author_id) || null;
            project.author_avatar = avatarMap.get(project.author_id) || null;

            console.log(`📡 [API] Project ${project.id} author data:`, {
              author_id: project.author_id,
              author_email: project.author_email,
              author_name_before_fallback: project.author_name,
            });

            // Fallback: if no name from profiles, use email or user ID
            if (!project.author_name && project.author_email) {
              // Convert email to a nice display name
              const emailName = "No Name";
              // Capitalize first letter and replace dots/underscores with spaces
              // project.author_name = emailName
              //   .replace(/[._]/g, " ")
              //   .replace(/\b\w/g, (l) => l.toUpperCase());
            } else if (!project.author_name && project.author_id) {
              project.author_name = `User ${project.author_id.slice(0, 8)}`; // Use first 8 chars of ID
            }

            // Also fetch assigned user data if they have an assigned_to_id
            if (project.assigned_to_id) {
              project.assigned_to_email = emailMap.get(project.assigned_to_id) || null;
              project.assigned_to_name =
                nameMap.get(project.assigned_to_id) || project.assigned_to_name;
              project.assigned_to_avatar = avatarMap.get(project.assigned_to_id) || null;
            } else {
              project.assigned_to_email = null;
              project.assigned_to_avatar = null;
            }
          });
        } else {
          console.log("📡 [API] Admin API failed, using fallback. Error:", authError);
          // Fallback: set emails to null, but keep names from profiles
          // projects.forEach((project) => {
          //   project.author_email = null;
          //   project.author_name = nameMap.get(project.author_id) || null;
          //   project.author_avatar = null;
          //   project.assigned_to_email = null;
          //   project.assigned_to_avatar = null;

          //   // Fallback: if no name from profiles, use user ID
          //   if (!project.author_name && project.author_id) {
          //     project.author_name = `User ${project.author_id.slice(0, 8)}`;
          //   }
          // });
        }
      } catch (error) {
        console.log("📡 [API] User data fetch error:", error);
        // Fallback: set emails to null, use user ID for names
        projects.forEach((project) => {
          project.author_email = null;
          project.author_name = `User ${project.author_id.slice(0, 8)}`;
          project.author_avatar = null;
          project.assigned_to_email = null;
          project.assigned_to_avatar = null;
        });
      }
    }

    console.log("📡 [API] Returning projects response:", {
      projectCount: projects?.length || 0,
      authenticated: true,
      demo: false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        projects: projects || [],
        message: `Found ${projects?.length || 0} projects for user`,
        demo: false,
        authenticated: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("📡 [API] Get user projects API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
