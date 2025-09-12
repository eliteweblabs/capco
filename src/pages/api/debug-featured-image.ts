import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  console.log("🔍 [DEBUG-FEATURED-IMAGE] Checking featured image data");

  try {
    const { supabase } = await import("../../lib/supabase");
    const { supabaseAdmin } = await import("../../lib/supabase-admin");

    if (!supabase || !supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Supabase clients not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get project ID from query params
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🔍 [DEBUG-FEATURED-IMAGE] Checking project:", projectId);

    // 1. Check if project has featured_image set
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, address, featured_image")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("🔍 [DEBUG-FEATURED-IMAGE] Project error:", projectError);
      return new Response(
        JSON.stringify({
          error: "Project not found",
          projectError: projectError.message,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔍 [DEBUG-FEATURED-IMAGE] Project data:", {
      id: project.id,
      address: project.address,
      featured_image: project.featured_image,
    });

    if (!project.featured_image) {
      return new Response(
        JSON.stringify({
          message: "Project has no featured image set",
          project: project,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Check if the featured image file exists in files table
    const { data: fileData, error: fileError } = await supabaseAdmin
      .from("files")
      .select("id, file_path, file_name, file_type, project_id")
      .eq("id", project.featured_image)
      .single();

    if (fileError) {
      console.error("🔍 [DEBUG-FEATURED-IMAGE] File error:", fileError);
      return new Response(
        JSON.stringify({
          error: "Featured image file not found",
          fileError: fileError.message,
          featuredImageId: project.featured_image,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔍 [DEBUG-FEATURED-IMAGE] File data:", fileData);

    // 3. Check if file belongs to the project
    if (fileData.project_id !== parseInt(projectId)) {
      return new Response(
        JSON.stringify({
          error: "Featured image file does not belong to this project",
          fileProjectId: fileData.project_id,
          requestedProjectId: projectId,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Generate public URL
    // The file_path already includes the bucket name, so we need to extract just the path part
    const pathWithoutBucket = fileData.file_path.replace(/^project-documents\//, "");
    const { data: urlData } = supabase.storage
      .from("project-documents")
      .getPublicUrl(pathWithoutBucket);

    console.log("🔍 [DEBUG-FEATURED-IMAGE] Public URL data:", urlData);

    // 5. Test if the file exists in storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from("project-documents")
      .list(fileData.file_path.split("/").slice(0, -1).join("/"), {
        search: fileData.file_name,
      });

    console.log("🔍 [DEBUG-FEATURED-IMAGE] Storage check:", {
      hasStorageError: !!storageError,
      storageError: storageError?.message,
      storageData: storageData,
    });

    // 6. Return complete debug information
    return new Response(
      JSON.stringify({
        success: true,
        project: {
          id: project.id,
          address: project.address,
          featured_image: project.featured_image,
        },
        file: {
          id: fileData.id,
          file_path: fileData.file_path,
          file_name: fileData.file_name,
          file_type: fileData.file_type,
          project_id: fileData.project_id,
        },
        publicUrl: urlData.publicUrl,
        storage: {
          exists: !storageError,
          error: storageError?.message,
          files: storageData,
        },
        featuredImageData: {
          id: fileData.id,
          file_path: fileData.file_path,
          file_name: fileData.file_name,
          file_type: fileData.file_type,
          public_url: urlData.publicUrl,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("🔍 [DEBUG-FEATURED-IMAGE] Unexpected error:", error);
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
