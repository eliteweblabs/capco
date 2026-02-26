import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
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

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const contentType = request.headers.get("content-type") || "";
    let file: File;
    let projectId: string;
    let title: string;
    let comments: string;
    let bucketName: string;
    let targetDirectory: string;
    let useVersioning: boolean;
    let isPrivate: boolean;

    if (contentType.includes("multipart/form-data")) {
      // Handle multipart form data
      const formData = await request.formData();
      file = formData.get("file") as File;
      projectId = formData.get("projectId") as string;
      title = formData.get("title") as string;
      comments = formData.get("comments") as string;
      bucketName = (formData.get("bucketName") as string) || "project-media";
      targetDirectory = (formData.get("targetDirectory") as string) || "general";
      useVersioning = formData.get("useVersioning") === "true";
      isPrivate = formData.get("isPrivate") === "true";
    } else if (contentType.includes("application/json")) {
      // Handle JSON with base64 data (FileManager)
      const body = await request.json();
      const {
        mediaData,
        fileName,
        fileType,
        projectId: bodyProjectId,
        targetLocation,
        bucketName: bodyBucketName,
        title: bodyTitle,
        description,
      } = body;

      if (!mediaData || !fileName) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields",
            details: "mediaData and fileName are required for JSON uploads",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Convert base64 to File object
      let fileBuffer: ArrayBuffer;
      let contentType = fileType;

      if (typeof mediaData === "string" && mediaData.startsWith("data:")) {
        console.log("📁 [FILES-UPLOAD] Processing base64 data...");
        const [header, base64Data] = mediaData.split(",");
        const mimeMatch = header.match(/data:([^;]+)/);
        if (mimeMatch) {
          contentType = mimeMatch[1];
        }

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        fileBuffer = bytes.buffer;
      } else {
        fileBuffer = mediaData as ArrayBuffer;
      }

      // Create File object from buffer
      file = new File([fileBuffer], fileName, { type: contentType });
      projectId = bodyProjectId;
      title = bodyTitle || fileName;
      comments = description || "";
      bucketName = bodyBucketName || "project-media";
      targetDirectory = targetLocation || "documents";
      useVersioning = true; // FileManager always uses versioning
      isPrivate = false; // Will be determined by project status
    } else {
      return new Response(
        JSON.stringify({
          error: "Unsupported content type",
          details: "Expected multipart/form-data or application/json",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

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

    // Duplicate upload check: if same file was uploaded by same user in same location within last 2 min, return existing
    // Prevents double upload when site refreshes during/after upload
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: recentDuplicate } = await supabaseAdmin
      .from("files")
      .select("id, fileName, filePath, fileSize, fileType, title, comments, isPrivate, projectId, uploadedAt, bucketName")
      .eq("projectId", parseInt(projectId as string))
      .eq("fileName", file.name)
      .eq("targetLocation", targetDirectory)
      .eq("authorId", currentUser.id)
      .gte("uploadedAt", twoMinutesAgo)
      .order("uploadedAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentDuplicate && recentDuplicate.fileSize === file.size) {
      console.log(`📁 [FILES-UPLOAD] Duplicate detected (recent upload), returning existing: ${recentDuplicate.id}`);
      const dupBucket = recentDuplicate.bucketName || bucketName || "project-media";
      const { data: urlData } = supabaseAdmin.storage
        .from(dupBucket)
        .getPublicUrl(recentDuplicate.filePath);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: recentDuplicate.id,
            fileName: recentDuplicate.fileName,
            filePath: recentDuplicate.filePath,
            fileSize: recentDuplicate.fileSize,
            mimeType: recentDuplicate.fileType,
            publicUrl: urlData.publicUrl,
            projectId: recentDuplicate.projectId,
            title: recentDuplicate.title,
            comments: recentDuplicate.comments,
            isPrivate: recentDuplicate.isPrivate,
            createdAt: recentDuplicate.uploadedAt,
          },
          message: "File already uploaded (duplicate prevented)",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate unique file path with URL-safe filename
    const fileExtension = file.name.split(".").pop() || "";
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    // Sanitize filename: replace spaces with hyphens, remove/replace special characters
    // This prevents issues with URLs and ensures consistency across all storage paths
    const safeFileName = fileName
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars with underscores
      .replace(/_{2,}/g, "_") // Replace multiple underscores with single
      .replace(/-{2,}/g, "-") // Replace multiple hyphens with single
      .replace(/^[-_]+|[-_]+$/g, ""); // Remove leading/trailing hyphens and underscores
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${safeFileName}`;
    // Handle versioning
    let versionNumber = 1;
    let previousVersionId = null;
    let isCurrentVersion = true;

    if (useVersioning) {
      // Check for existing file with same name
      const { data: existingFiles, error: existingError } = await supabaseAdmin
        .from("files")
        .select("*")
        .eq("projectId", parseInt(projectId as string))
        .eq("fileName", file.name)
        .eq("isCurrentVersion", true)
        .single();

      if (existingError && existingError.code !== "PGRST116") {
        console.error("❌ [FILES-UPLOAD] Error checking existing files:", existingError);
      }

      if (existingFiles) {
        // This is a new version of an existing file
        versionNumber = existingFiles.versionNumber + 1;
        previousVersionId = existingFiles.id;

        // Mark the existing file as not current version
        const { error: updateError } = await supabaseAdmin
          .from("files")
          .update({ isCurrentVersion: false })
          .eq("id", existingFiles.id);

        if (updateError) {
          console.error("❌ [FILES-UPLOAD] Error updating previous version:", updateError);
        }
      }
    } else {
      // Simple version increment if file exists (for non-FileManager uploads)
      const { data: existingFiles } = await supabaseAdmin
        .from("files")
        .select("*")
        .eq("projectId", parseInt(projectId as string))
        .eq("fileName", file.name)
        .single();

      if (existingFiles) {
        versionNumber = (existingFiles.versionNumber || 0) + 1;
      }
    }

    // Determine if file should be private based on project status
    if (projectId) {
      try {
        const { data: projectData } = await supabaseAdmin
          .from("projects")
          .select("status")
          .eq("id", parseInt(projectId as string))
          .single();

        // Files uploaded when project status < 30 should be public (not private)
        // Files uploaded when project status >= 30 should be private by default
        isPrivate = projectData?.status >= 30;
      } catch (error) {
        console.warn("Could not determine project status, defaulting to public:", error);
      }
    }

    // Create path using getBucketAndPath logic
    const pathPrefix = projectId ? `${projectId}/${targetDirectory}/` : `${targetDirectory}/`;
    const filePath = `${pathPrefix}${uniqueFileName}.${fileExtension}`;

    console.log(`📁 [FILES-UPLOAD] Uploading file: ${file.name} to ${filePath}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
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
      fileType: file.type,
      title: title?.trim() || file.name,
      comments: comments?.trim() || null,
      isPrivate: isPrivate,
      authorId: currentUser.id,
      bucketName: bucketName,
      targetLocation: targetDirectory,
      uploadedAt: new Date().toISOString(),
      versionNumber: versionNumber,
      previousVersionId: useVersioning ? previousVersionId : null,
      isCurrentVersion: useVersioning ? isCurrentVersion : null,
      status: "active",
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
