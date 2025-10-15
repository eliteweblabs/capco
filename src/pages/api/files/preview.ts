import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Files PREVIEW API
 *
 * Handles file preview operations for various file types
 *
 * Query Parameters:
 * - id: File ID to preview
 * - type: Preview type (image, pdf, text, etc.)
 *
 * Examples:
 * - /api/files/preview?id=123&type=image
 * - /api/files/preview?id=456&type=pdf
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
    const previewType = url.searchParams.get("type") || "auto";

    if (!fileId) {
      return new Response(JSON.stringify({ error: "File ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📁 [FILES-PREVIEW] Previewing file:`, fileId, "Type:", previewType);

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
        JSON.stringify({ error: "Insufficient permissions to preview this file" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if file is private and user is not admin
    if (file.isPrivate && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "This file is private and requires admin access" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📁 [FILES-PREVIEW] File access authorized, generating preview`);

    // Determine preview type based on file extension or explicit type
    const fileExtension = file.fileName.split(".").pop()?.toLowerCase() || "";
    const mimeType = file.mimeType || "application/octet-stream";

    let actualPreviewType = previewType;
    if (previewType === "auto") {
      if (fileExtension === "pdf" || mimeType.includes("pdf")) {
        actualPreviewType = "pdf";
      } else if (
        ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(fileExtension) ||
        mimeType.startsWith("image/")
      ) {
        actualPreviewType = "image";
      } else if (
        ["txt", "md", "json", "xml", "csv"].includes(fileExtension) ||
        mimeType.startsWith("text/")
      ) {
        actualPreviewType = "text";
      } else {
        actualPreviewType = "download";
      }
    }

    // Handle different preview types
    switch (actualPreviewType) {
      case "image":
        // For images, return the public URL or proxy the file
        const { data: urlData } = supabaseAdmin.storage
          .from(file.bucketName)
          .getPublicUrl(file.filePath);

        return new Response(
          JSON.stringify({
            success: true,
            previewType: "image",
            previewUrl: urlData.publicUrl,
            file: {
              id: file.id,
              fileName: file.fileName,
              mimeType: file.mimeType,
              fileSize: file.fileSize,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );

      case "pdf":
        // For PDFs, return the public URL for inline viewing
        const { data: pdfUrlData } = supabaseAdmin.storage
          .from(file.bucketName)
          .getPublicUrl(file.filePath);

        return new Response(
          JSON.stringify({
            success: true,
            previewType: "pdf",
            previewUrl: pdfUrlData.publicUrl,
            file: {
              id: file.id,
              fileName: file.fileName,
              mimeType: file.mimeType,
              fileSize: file.fileSize,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );

      case "text":
        // For text files, download and return content
        const { data: textData, error: textError } = await supabaseAdmin.storage
          .from(file.bucketName)
          .download(file.filePath);

        if (textError) {
          console.error("❌ [FILES-PREVIEW] Error downloading text file:", textError);
          return new Response(
            JSON.stringify({
              error: "Failed to download file for preview",
              details: textError.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const textContent = await textData.text();

        return new Response(
          JSON.stringify({
            success: true,
            previewType: "text",
            content: textContent,
            file: {
              id: file.id,
              fileName: file.fileName,
              mimeType: file.mimeType,
              fileSize: file.fileSize,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );

      case "download":
      default:
        // For other files, return download information
        const { data: downloadUrlData } = supabaseAdmin.storage
          .from(file.bucketName)
          .getPublicUrl(file.filePath);

        return new Response(
          JSON.stringify({
            success: true,
            previewType: "download",
            downloadUrl: downloadUrlData.publicUrl,
            file: {
              id: file.id,
              fileName: file.fileName,
              mimeType: file.mimeType,
              fileSize: file.fileSize,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("❌ [FILES-PREVIEW] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
