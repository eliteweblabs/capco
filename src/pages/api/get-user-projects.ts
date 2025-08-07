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
    let query = supabase.from("projects").select(`
        *,
        assigned_to:profiles!projects_assigned_to_id_fkey(name, id)
      `);

    // Admin and Staff get all projects, clients get only their own
    if (userRole !== "Admin" && userRole !== "Staff") {
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
        project.assigned_to_id = project.assigned_to?.id || null;
        // Clean up the nested object for cleaner response
        delete project.assigned_to;
      });
    }

    // Fetch user data (emails and names) for all unique author_ids
    if (projects && projects.length > 0) {
      try {
        // Get unique user IDs
        const uniqueUserIds = [
          ...new Set([
            ...projects.map((p) => p.author_id),
            ...projects.map((p) => p.assigned_to_id).filter(Boolean),
          ]),
        ];

        console.log(
          "Attempting to fetch user data for user IDs:",
          uniqueUserIds,
        );

        // Fetch user profiles for names
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", uniqueUserIds);

        if (profilesError) {
          console.log("Profiles fetch error:", profilesError);
        }

        // Create maps for user data
        const nameMap = new Map();
        if (profiles) {
          console.log("Found profiles:", profiles);
          profiles.forEach((profile) => {
            nameMap.set(profile.id, profile.name);
          });
        } else {
          console.log("No profiles found for user IDs:", uniqueUserIds);
        }

        // Use admin API to get user emails and avatar URLs
        const { data: authUsers, error: authError } =
          await supabase.auth.admin.listUsers();

        if (!authError && authUsers?.users) {
          console.log("Successfully fetched users via admin API");
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

          // Add user data to each project
          projects.forEach((project) => {
            project.author_email = emailMap.get(project.author_id) || null;
            project.author_name = nameMap.get(project.author_id) || null;
            project.author_avatar = avatarMap.get(project.author_id) || null;

            console.log(`Project ${project.id} author data:`, {
              author_id: project.author_id,
              author_email: project.author_email,
              author_name_before_fallback: project.author_name,
            });

            // Fallback: if no name from profiles, use email or user ID
            if (!project.author_name && project.author_email) {
              // Convert email to a nice display name
              const emailName = project.author_email.split("@")[0];
              // Capitalize first letter and replace dots/underscores with spaces
              project.author_name = emailName
                .replace(/[._]/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
            } else if (!project.author_name && project.author_id) {
              project.author_name = `User ${project.author_id.slice(0, 8)}`; // Use first 8 chars of ID
            }

            // Also fetch assigned user data if they have an assigned_to_id
            if (project.assigned_to_id) {
              project.assigned_to_email =
                emailMap.get(project.assigned_to_id) || null;
              project.assigned_to_name =
                nameMap.get(project.assigned_to_id) || project.assigned_to_name;
              project.assigned_to_avatar =
                avatarMap.get(project.assigned_to_id) || null;
            } else {
              project.assigned_to_email = null;
              project.assigned_to_avatar = null;
            }
          });
        } else {
          console.log("Admin API failed, using fallback. Error:", authError);
          // Fallback: set emails to null, but keep names from profiles
          projects.forEach((project) => {
            project.author_email = null;
            project.author_name = nameMap.get(project.author_id) || null;
            project.author_avatar = null;
            project.assigned_to_email = null;
            project.assigned_to_avatar = null;

            // Fallback: if no name from profiles, use user ID
            if (!project.author_name && project.author_id) {
              project.author_name = `User ${project.author_id.slice(0, 8)}`;
            }
          });
        }
      } catch (error) {
        console.log("User data fetch error:", error);
        // Fallback: set emails to null, but keep names from profiles
        projects.forEach((project) => {
          project.author_email = null;
          project.author_name = nameMap.get(project.author_id) || null;
          project.author_avatar = null;
          project.assigned_to_email = null;
          project.assigned_to_avatar = null;

          // Fallback: if no name from profiles, use user ID
          if (!project.author_name && project.author_id) {
            project.author_name = `User ${project.author_id.slice(0, 8)}`;
          }
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
