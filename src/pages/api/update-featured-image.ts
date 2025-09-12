import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("⭐ [UPDATE-FEATURED-IMAGE] API called");

  try {
    // Check authentication
    const { currentRole } = await checkAuth(cookies);

    // Only admins and staff can update featured images
    if (currentRole !== "Admin" && currentRole !== "Staff") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Only admins and staff can update featured images",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { projectId, fileId, isFeatured } = body;

    // Validate required fields
    if (!projectId || !fileId || typeof isFeatured !== "boolean") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: projectId, fileId, and isFeatured",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!supabaseAdmin) {
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

    // Verify the file exists and belongs to the project
    const { data: file, error: fileError } = await supabaseAdmin
      .from("files")
      .select("id, project_id, file_type")
      .eq("id", parseInt(fileId))
      .eq("project_id", parseInt(projectId))
      .single();

    if (fileError || !file) {
      console.error("⭐ [UPDATE-FEATURED-IMAGE] File not found:", fileError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "File not found or does not belong to this project",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if the file is an image
    const isImage =
      file.file_type &&
      (file.file_type.startsWith("image/") ||
        file.file_type.includes("png") ||
        file.file_type.includes("jpg") ||
        file.file_type.includes("jpeg") ||
        file.file_type.includes("gif") ||
        file.file_type.includes("webp"));

    if (!isImage) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Only image files can be set as featured images",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // If setting as featured, first clear any existing featured image for this project
    if (isFeatured) {
      const { error: clearError } = await supabaseAdmin
        .from("projects")
        .update({ featured_image: null })
        .eq("id", parseInt(projectId));

      if (clearError) {
        console.error(
          "⭐ [UPDATE-FEATURED-IMAGE] Error clearing existing featured image:",
          clearError
        );
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to clear existing featured image",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Update the project's featured_image field
    const updateData = isFeatured ? { featured_image: parseInt(fileId) } : { featured_image: null };

    const { error: updateError } = await supabaseAdmin
      .from("projects")
      .update(updateData)
      .eq("id", parseInt(projectId));

    if (updateError) {
      console.error("⭐ [UPDATE-FEATURED-IMAGE] Error updating project:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update featured image",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("⭐ [UPDATE-FEATURED-IMAGE] Successfully updated featured image:", {
      projectId,
      fileId,
      isFeatured,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Featured image ${isFeatured ? "set" : "removed"} successfully`,
        data: {
          projectId,
          fileId,
          isFeatured,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("⭐ [UPDATE-FEATURED-IMAGE] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
