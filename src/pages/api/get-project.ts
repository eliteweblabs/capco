import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  console.log("📡 [API] GET /api/get-project called");

  try {
    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get role and user_id from headers
    const role = request.headers.get("role");
    const userId = request.headers.get("user_id");

    console.log("📡 [API] Role:", role, "User ID:", userId);

    if (!role || !userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Role and user_id are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build query based on role
    let query = supabase.from("projects").select("*");

    if (role === "Admin") {
      // Admin gets all projects
      console.log("📡 [API] Admin role - fetching all projects");
    } else if (role === "Staff") {
      // Staff gets projects where assigned_to matches user_id
      console.log("📡 [API] Staff role - fetching projects assigned to user:", userId);
      query = query.eq("assigned_to_id", userId);
    } else {
      // Client gets projects where author_id matches user_id
      console.log("📡 [API] Client role - fetching projects authored by user:", userId);
      query = query.eq("author_id", userId);
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
        .select("id, name")
        .in("id", allUserIds);

      userProfiles = profiles || [];
    }

    // Create a map for quick user name lookup
    const userNameMap = new Map();
    userProfiles.forEach((profile) => {
      userNameMap.set(profile.id, profile.name);
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
        role: role,
        user_id: userId,
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
