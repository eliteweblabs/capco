import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Files DOWNLOAD API
 *
 * Query Parameters:
 * - id: File ID to download
 * - projectId: Project ID (for authorization check)
 *
 * Examples:
 * - /api/files/download?id=123
 * - /api/files/download?id=123&projectId=456
 */

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fileId = url.searchParams.get("id");
    const projectId = url.searchParams.get("projectId");

    if (!fileId) {
      return new Response(JSON.stringify({ error: "File ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📁 [FILES-DOWNLOAD] Downloading file:`, fileId);

    if (!supabase || !supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get file information from database
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select(
        `
        *,
        project:projects!projectId(id, title, authorId, assignedToId)
      `
      )
      .eq("id", fileId)
      .single();

    if (fileError || !file) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check authorization
    const userRole = currentUser.profile?.role;
    const isAdmin = userRole === "Admin" || userRole === "Staff";
    const isProjectAuthor = file.project?.authorId === currentUser.id;
    const isAssignedTo = file.project?.assignedToId === currentUser.id;
    const isFileAuthor = file.authorId === currentUser.id;

    // Allow access if user is admin, project author, assigned to project, or file author
    const hasAccess = isAdmin || isProjectAuthor || isAssignedTo || isFileAuthor;

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions to download this file" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if file is private and user is not admin/staff
    if (file.isPrivate && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "This file is private and requires admin access" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📁 [FILES-DOWNLOAD] File access authorized, downloading from storage`);

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(file.bucketName)
      .download(file.filePath);

    if (downloadError) {
      console.error("❌ [FILES-DOWNLOAD] Error downloading file from storage:", downloadError);
      return new Response(
        JSON.stringify({
          error: "Failed to download file from storage",
          details: downloadError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();

    console.log(`✅ [FILES-DOWNLOAD] File downloaded successfully:`, file.fileName);

    // Return file with appropriate headers
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.fileName}"`,
        "Content-Length": file.fileSize?.toString() || arrayBuffer.byteLength.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("❌ [FILES-DOWNLOAD] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
