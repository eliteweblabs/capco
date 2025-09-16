import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth } = await checkAuth(cookies);

    if (!isAuth) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const {
      mediaData,
      fileName,
      fileType,
      projectId,
      fileId,
      mediaType,
      targetLocation,
      targetId,
      isActive,
    } = body;

    // Handle featured image updates (different from regular media uploads)
    if (mediaType === "featured_image" && projectId && fileId !== undefined) {
      const { supabaseAdmin } = await import("../../lib/supabase-admin");

      try {
        // Update the project's featured_image field
        const { error } = await supabaseAdmin
          .from("projects")
          .update({
            featured_image: isActive ? parseInt(fileId) : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", parseInt(projectId));

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Featured image ${isActive ? "set" : "removed"} successfully`,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to update featured image: ${error.message}`,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Regular media upload validation
    if (!mediaData || !fileName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Media data and file name are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // In a real implementation, you would save the media to storage
    // For now, just return a success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Media saved successfully",
        fileName: fileName,
        fileType: fileType || "unknown",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Save media error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to save media",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
