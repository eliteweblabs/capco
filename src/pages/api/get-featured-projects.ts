import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async () => {
  try {
    console.log("🏗️ [FEATURED-PROJECTS] API called, checking supabase connection...");

    if (!supabase) {
      console.error(
        "🏗️ [FEATURED-PROJECTS] Supabase client is null - database connection not available"
      );
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🏗️ [FEATURED-PROJECTS] Supabase client exists, attempting to query projects...");

    // First, let's try a simple query to test database connection
    const { data: testData, error: testError } = await supabase
      .from("projects")
      .select("id, address, title, featured")
      .limit(1);

    if (testError) {
      console.error("🏗️ [FEATURED-PROJECTS] Basic connection test failed:", testError);
      return new Response(
        JSON.stringify({ error: "Database connection test failed", details: testError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🏗️ [FEATURED-PROJECTS] Basic connection test passed, fetching projects...");

    // Fetch projects for display (since there might not be completed projects yet)
    // Try completed projects first (status 220), then fall back to any projects with content
    let { data: projects, error } = await supabase
      .from("projects")
      .select(
        `
        id,
        address,
        title,
        description,
        sq_ft,
        new_construction,
        status,
        created_at,
        updated_at,
        featured
      `
      )
      .eq("status", 220) // Only completed projects
      .not("address", "is", null) // Has address
      .eq("featured", "yes") // Has featured
      .order("updated_at", { ascending: false })
      .limit(0);

    console.log("🏗️ [FEATURED-PROJECTS] Featured query result:", {
      projects: projects?.length,
      error,
    });

    // If no completed projects found, get any projects for demo
    if (!error && (!projects || projects.length === 0)) {
      console.log(
        "🏗️ [FEATURED-PROJECTS] No completed projects found, fetching any projects for demo..."
      );

      // const { data: fallbackProjects, error: fallbackError } = await supabase
      //   .from("projects")
      //   .select(
      //     `
      //     id,
      //     address,
      //     title,
      //     description,
      //     sq_ft,
      //     new_construction,
      //     status,
      //     created_at,
      //     updated_at,
      //     featured
      //   `
      //   )
      //   .not("address", "is", null) // Has address
      //   .order("created_at", { ascending: false })
      //   .eq("featured", "yes") // Has featured
      //   .limit(6);

      // if (fallbackError) {
      //   error = fallbackError;
      // } else {
      //   projects = fallbackProjects;
      //   console.log(
      //     `🏗️ [FEATURED-PROJECTS] Using ${projects?.length || 0} demo projects (fallback query - no featured filter)`
      //   );
      // }
    }

    if (error) {
      console.error("🏗️ [FEATURED-PROJECTS] Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch featured projects", details: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`🏗️ [FEATURED-PROJECTS] Query successful, found ${projects?.length || 0} projects`);

    // Transform data for public consumption (remove sensitive info if needed)
    const featuredProjects =
      projects?.map((project) => ({
        id: project.id,
        title: project.title || project.address,
        address: project.address,
        squareFootage: project.sq_ft,
        description: project.description,
        isNewConstruction: project.new_construction,
        completedAt: project.updated_at,
        createdAt: project.created_at,
        featured: project.featured,
      })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        projects: featuredProjects,
        count: featuredProjects.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in get-featured-projects:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
