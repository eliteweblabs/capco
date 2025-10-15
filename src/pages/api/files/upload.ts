import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Files UPLOAD API
 *
 * Handles file uploads to Supabase Storage and database records
 *
 * POST Body (multipart/form-data):
 * - file: File object
 * - projectId: number
 * - title?: string
 * - comments?: string
 * - isPrivate?: boolean
 * - bucketName?: string (default: "project-files")
 *
 * Example:
 * - POST /api/files/upload (multipart form with file and metadata)
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📁 [FILES-UPLOAD] Processing file upload request`);

    if (!supabase || !supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId");
    const title = formData.get("title") as string;
    const comments = formData.get("comments") as string;
    const isPrivate = formData.get("isPrivate") === "true";
    const bucketName = (formData.get("bucketName") as string) || "project-files";

    // Validate required fields
    if (!file) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "File is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!projectId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "projectId is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate unique file path
    const fileExtension = file.name.split(".").pop() || "";
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${fileName}`;
    const filePath = `projects/${projectId}/${uniqueFileName}.${fileExtension}`;

    console.log(`📁 [FILES-UPLOAD] Uploading file: ${file.name} to ${filePath}`);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ [FILES-UPLOAD] Error uploading file to storage:", uploadError);
      return new Response(
        JSON.stringify({
          error: "Failed to upload file",
          details: uploadError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [FILES-UPLOAD] File uploaded to storage:`, uploadData.path);

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath);

    // Create file record in database
    const fileRecord = {
      projectId: parseInt(projectId as string),
      fileName: file.name,
      filePath: uploadData.path,
      fileSize: file.size,
      mimeType: file.type,
      title: title?.trim() || null,
      comments: comments?.trim() || null,
      isPrivate: isPrivate,
      authorId: currentUser.id,
      bucketName: bucketName,
      publicUrl: urlData.publicUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data: dbFile, error: dbError } = await supabaseAdmin
      .from("files")
      .insert([fileRecord])
      .select()
      .single();

    if (dbError) {
      console.error("❌ [FILES-UPLOAD] Error creating file record:", dbError);

      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage.from(bucketName).remove([filePath]);

      return new Response(
        JSON.stringify({
          error: "Failed to create file record",
          details: dbError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [FILES-UPLOAD] File record created successfully:`, dbFile.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: dbFile.id,
          fileName: dbFile.fileName,
          filePath: dbFile.filePath,
          fileSize: dbFile.fileSize,
          mimeType: dbFile.mimeType,
          publicUrl: dbFile.publicUrl,
          projectId: dbFile.projectId,
          title: dbFile.title,
          comments: dbFile.comments,
          isPrivate: dbFile.isPrivate,
          createdAt: dbFile.createdAt,
        },
        message: "File uploaded successfully",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [FILES-UPLOAD] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
