import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  console.log("🔍 [TEST-DASHBOARD-DATA] Testing dashboard data structure");

  try {
    const { supabase } = await import("../../lib/supabase");
    const { supabaseAdmin } = await import("../../lib/supabase-admin");

    if (!supabase || !supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Supabase clients not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch a few projects with featured images
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from("projects")
      .select(
        `
        id,
        title,
        address,
        featured_image
      `
      )
      .not("featured_image", "is", null)
      .limit(5);

    if (projectsError) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch projects",
          projectsError: projectsError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔍 [TEST-DASHBOARD-DATA] Projects with featured images:", projects);

    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No projects with featured images found",
          projects: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get featured image data for these projects
    const featuredImageIds = projects.map((p) => p.featured_image);
    const { data: featuredImages, error: featuredImagesError } = await supabaseAdmin
      .from("files")
      .select("id, file_path, file_name, file_type")
      .in("id", featuredImageIds);

    if (featuredImagesError) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch featured images",
          featuredImagesError: featuredImagesError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔍 [TEST-DASHBOARD-DATA] Featured images data:", featuredImages);

    // Create the same data structure as the dashboard
    const projectsWithFeaturedData = projects.map((project) => {
      const featuredImage = featuredImages?.find(
        (img) => img.id.toString() === project.featured_image
      );

      if (featuredImage && supabase) {
        // The file_path already includes the bucket name, so we need to extract just the path part
        const pathWithoutBucket = featuredImage.file_path.replace(/^project-documents\//, "");
        const { data } = supabase.storage.from("project-documents").getPublicUrl(pathWithoutBucket);

        return {
          ...project,
          featured_image_data: {
            ...featuredImage,
            public_url: data.publicUrl,
          },
        };
      }

      return project;
    });

    return new Response(
      JSON.stringify({
        success: true,
        projects: projectsWithFeaturedData,
        rawProjects: projects,
        rawFeaturedImages: featuredImages,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("🔍 [TEST-DASHBOARD-DATA] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Unexpected error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
