import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  console.log("📡 [API] GET /api/get-project called");

  try {
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

    // Get role and user_id from headers
    const role = request.headers.get("role");
    const userId = request.headers.get("user_id");

    console.log("📡 [API] Role:", role, "User ID:", userId);

    // Initialize final values
    let finalRole = role;
    let finalUserId = userId;

    // If no role/userId provided, try to get from auth
    if (!role || !userId) {
      console.log("📡 [API] No role/userId in headers, trying auth...");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log("📡 [API] No authenticated user, returning demo projects");

        const mockProjects = [
          {
            id: 2001,
            title: "Demo Warehouse",
            description: "Fire suppression for industrial facility",
            address: "789 Industrial Pkwy, Demo City",
            author_id: "demo-user-id",
            author_email: "demo@example.com",
            assigned_to_name: "Mike Davis",
            assigned_to_email: "mike.davis@example.com",
            status: 10,
            sq_ft: 10000,
            new_construction: false,
            created_at: "2024-12-15T14:30:00Z",
            updated_at: "2025-01-10T16:20:00Z",
          },
        ];

        return new Response(
          JSON.stringify({
            success: true,
            projects: mockProjects,
            message: "Demo projects (not authenticated)",
            demo: true,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Get user profile to determine role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const userRole = profile?.role || "Client";
      console.log("📡 [API] Auth user role:", userRole);

      // Use auth user data
      finalRole = role || userRole;
      finalUserId = userId || user.id;

      console.log("📡 [API] Final role:", finalRole, "Final user ID:", finalUserId);
    }

    // Build query based on role
    let query = supabase.from("projects").select("*");

    if (finalRole === "Admin") {
      // Admin gets all projects
      console.log("📡 [API] Admin role - fetching all projects");
    } else if (finalRole === "Staff") {
      // Staff gets projects where assigned_to matches user_id
      console.log("📡 [API] Staff role - fetching projects assigned to user:", finalUserId);
      query = query.eq("assigned_to_id", finalUserId);
    } else {
      // Client gets projects where author_id matches user_id
      console.log("📡 [API] Client role - fetching projects authored by user:", finalUserId);
      query = query.eq("author_id", finalUserId);
    }

    // Execute query
    const { data: projects, error } = await query.order("updated_at", {
      ascending: false,
    });

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

    console.log("📡 [API] Projects fetched before author lookup:", projects?.length);

    // Get unique author and assigned user IDs for batch profile lookup
    const authorIds = projects?.map((p) => p.author_id).filter(Boolean) || [];
    const assignedIds = projects?.map((p) => p.assigned_to_id).filter(Boolean) || [];
    const allUserIds = [...new Set([...authorIds, ...assignedIds])];

    let userProfiles: any[] = [];
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, company_name")
        .in("id", allUserIds);

      userProfiles = profiles || [];
    }

    // Create a map for quick user name lookup
    const userNameMap = new Map();
    userProfiles.forEach((profile) => {
      // For staff members, use first_name + last_name
      let displayName = null;
      if (profile.first_name) {
        displayName = profile.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : profile.first_name;
      }
      // Fallback to user ID if no name available
      if (!displayName) {
        displayName = `User ${profile.id.slice(0, 8)}`;
      }
      userNameMap.set(profile.id, displayName);
    });

    // Add author and assigned user names to projects
    const processedProjects =
      projects?.map((project) => ({
        ...project,
        author_name: userNameMap.get(project.author_id) || null,
        assigned_to_name: userNameMap.get(project.assigned_to_id) || null,
      })) || [];

    console.log("📡 [API] Projects fetched:", processedProjects.length);

    return new Response(
      JSON.stringify({
        success: true,
        projects: processedProjects,
        count: processedProjects.length,
        role: finalRole,
        user_id: finalUserId,
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
