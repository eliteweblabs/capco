import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Files DELETE API
 *
 * DELETE Body:
 * - id: number (file ID to delete)
 *
 * Example:
 * - DELETE /api/files/delete { "id": 123 }
 */

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "File ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📁 [FILES-DELETE] Deleting file:`, id);

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if file exists
    const { data: file, error: fileError } = await supabaseAdmin
      .from("files")
      .select("id, fileName, filePath, bucketName, projectId")
      .eq("id", id)
      .single();

    if (fileError || !file) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete file from storage if it exists
    try {
      if (file.bucketName && file.filePath) {
        const { error: storageError } = await supabaseAdmin.storage
          .from(file.bucketName)
          .remove([file.filePath]);

        if (storageError) {
          console.error("❌ [FILES-DELETE] Error deleting file from storage:", storageError);
          // Continue with database deletion even if storage deletion fails
        } else {
          console.log("✅ [FILES-DELETE] File deleted from storage:", file.filePath);
        }
      }
    } catch (storageError) {
      console.error("❌ [FILES-DELETE] Error accessing storage:", storageError);
      // Continue with database deletion
    }

    // Delete the file record from database
    const { error: deleteError } = await supabaseAdmin.from("files").delete().eq("id", id);

    if (deleteError) {
      console.error("❌ [FILES-DELETE] Error deleting file record:", deleteError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete file",
          details: deleteError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [FILES-DELETE] File deleted successfully:`, id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "File deleted successfully",
        deletedFile: {
          id: file.id,
          fileName: file.fileName,
          projectId: file.projectId,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [FILES-DELETE] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
