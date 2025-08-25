import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async () => {
  try {
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch completed projects that are marked as featured
    // Status 220 = PROJECT_COMPLETE from global-services.ts
    const { data: projects, error } = await supabase
      .from("projects")
      .select(
        `
        id,
        address,
        owner,
        architect,
        sq_ft,
        description,
        new_construction,
        units,
        feature,
        created_at,
        updated_at
      `
      )
      .eq("status", 220) // Only completed projects
      .eq("feature", true) // Only featured projects
      .order("updated_at", { ascending: false })
      .limit(12); // Limit to 12 featured projects

    if (error) {
      console.error("Error fetching featured projects:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch featured projects" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Transform data for public consumption (remove sensitive info if needed)
    const featuredProjects =
      projects?.map((project) => ({
        id: project.id,
        title: project.address,
        owner: project.owner,
        architect: project.architect,
        squareFootage: project.sq_ft,
        description: project.description,
        isNewConstruction: project.new_construction,
        units: project.units,
        completedAt: project.updated_at,
        createdAt: project.created_at,
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
