// UNIFIED MEDIA SYSTEM
// Single file that handles all media operations: save, get, delete
// Exposes functions for direct use in components and APIs

import type { User } from "@supabase/supabase-js";

// Types
export interface MediaFile {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  projectId?: number;
  targetId?: number;
  targetLocation: string;
  bucketName: string;
  publicUrl: string | null;
  title?: string;
  comments?: string;
  isFeatured?: boolean;
  versionNumber?: number;
  isCurrentVersion?: boolean;
  previousVersionId?: number;
  uploadedByName?: string;
  isPrivate?: boolean;
}

export interface SaveMediaParams {
  mediaData: string | ArrayBuffer | ArrayBufferLike | Buffer;
  fileName: string;
  fileType: string;
  projectId?: string;
  targetLocation: string;
  targetId?: string;
  title?: string;
  description?: string;
  currentUser: User;
  customVersionNumber?: number; // Allow custom version number for generated files
}

export interface GetMediaParams {
  projectId?: string;
  targetLocation?: string;
  targetId?: string;
  fileId?: string;
  mediaType?: string;
  currentUser: User;
}

// Bucket routing based on context/location, NOT file type
const getBucketAndPath = (
  targetLocation: string,
  projectId?: string,
  targetId?: string,
  userId?: string
): { bucket: string; pathPrefix: string } => {
  const bucket = "project-media"; // Always use the same bucket

  switch (targetLocation) {
    case "discussions":
      return {
        bucket,
        pathPrefix:
          projectId && targetId
            ? `${projectId}/discussions/${targetId}/`
            : projectId
              ? `${projectId}/discussions/`
              : "discussions/",
      };

    case "documents":
      return {
        bucket,
        pathPrefix: projectId ? `${projectId}/documents/` : "documents/",
      };

    case "contracts":
      return {
        bucket,
        pathPrefix: projectId ? `${projectId}/contracts/` : "contracts/",
      };

    case "finals":
    case "deliverables":
      return {
        bucket,
        pathPrefix: projectId ? `${projectId}/finals/` : "finals/",
      };

    case "profiles":
      return {
        bucket,
        pathPrefix: userId ? `profiles/${userId}/` : "profiles/",
      };

    case "project":
    default:
      return {
        bucket,
        pathPrefix: projectId ? `${projectId}/general/` : "general/",
      };
  }
};

// SAVE MEDIA FUNCTION
export async function saveMedia(params: SaveMediaParams): Promise<MediaFile> {
  console.log("🔧 [MEDIA-VERSIONING] saveMedia called:", {
    fileName: params.fileName,
    fileType: params.fileType,
    projectId: params.projectId,
    targetLocation: params.targetLocation,
    targetId: params.targetId,
  });

  const { supabaseAdmin } = await import("./supabase-admin");

  if (!supabaseAdmin) {
    throw new Error("Database connection not available");
  }

  // Get bucket and path based on context
  const { bucket, pathPrefix } = getBucketAndPath(
    params.targetLocation,
    params.projectId,
    params.targetId,
    params.currentUser.id
  );

  console.log("🔧 [MEDIA-VERSIONING] Bucket routing:", { bucket, pathPrefix });

  // Convert base64 to file if needed
  let fileBuffer: ArrayBuffer;
  let contentType = params.fileType;

  if (typeof params.mediaData === "string" && params.mediaData.startsWith("data:")) {
    console.log("🔧 [MEDIA-VERSIONING] Processing base64 data...");
    const [header, base64Data] = params.mediaData.split(",");
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
    fileBuffer = params.mediaData as ArrayBuffer;
  }

  // Check for existing file with same name in the same project/location
  let existingFile = null;
  if (params.projectId && params.targetLocation) {
    console.log("🔧 [MEDIA-VERSIONING] Checking for existing file with same name...");
    const { data: existingFiles, error: existingError } = await supabaseAdmin
      .from("files")
      .select("*")
      .eq("projectId", parseInt(params.projectId))
      .eq("targetLocation", params.targetLocation)
      .eq("fileName", params.fileName)
      .eq("isCurrentVersion", true)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("🔧 [MEDIA-VERSIONING] Error checking existing files:", existingError);
    } else if (existingFiles) {
      existingFile = existingFiles;
      console.log(
        "🔧 [MEDIA-VERSIONING] Found existing file:",
        existingFile.id,
        "version:",
        existingFile.versionNumber
      );
    }
  }

  // Generate file path
  const timestamp = Date.now();
  const sanitizedFileName = params.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
  const fullPath = `${pathPrefix}${uniqueFileName}`;

  console.log("🔧 [MEDIA-VERSIONING] Final path:", fullPath);

  // Upload to Supabase Storage with retry logic
  let uploadData, uploadError;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      const result = await supabaseAdmin.storage.from(bucket).upload(fullPath, fileBuffer, {
        contentType: contentType,
        upsert: false,
      });

      uploadData = result.data;
      uploadError = result.error;

      if (!uploadError) break;

      retryCount++;
      if (retryCount < maxRetries) {
        console.warn(`🔧 [MEDIA-VERSIONING] Upload attempt ${retryCount} failed, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    } catch (error) {
      console.error(`🔧 [MEDIA-VERSIONING] Upload attempt ${retryCount + 1} failed:`, error);
      retryCount++;
      if (retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }
  }

  if (uploadError) {
    console.error("🔧 [MEDIA-VERSIONING] Upload error:", uploadError);
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // Handle versioning logic
  let versionNumber = params.customVersionNumber || 1;
  let previousVersionId = null;

  if (params.customVersionNumber) {
    console.log(`🔧 [MEDIA-VERSIONING] Using custom version number: ${params.customVersionNumber}`);
  }

  if (existingFile && !params.customVersionNumber) {
    // This is a new version of an existing file (only if no custom version specified)
    versionNumber = existingFile.versionNumber + 1;
    previousVersionId = existingFile.id;

    console.log("🔧 [MEDIA-VERSIONING] Creating new version:", {
      existingVersion: existingFile.versionNumber,
      newVersion: versionNumber,
      previousFileId: previousVersionId,
    });

    // Mark the existing file as not current version
    const { error: updateError } = await supabaseAdmin
      .from("files")
      .update({ isCurrentVersion: false })
      .eq("id", existingFile.id);

    if (updateError) {
      console.error("🔧 [MEDIA-VERSIONING] Error updating previous version:", updateError);
    }

    // Store the previous version in fileVersions table
    const { error: versionError } = await supabaseAdmin.from("fileVersions").insert({
      fileId: existingFile.id,
      versionNumber: existingFile.versionNumber,
      filePath: existingFile.filePath,
      fileSize: existingFile.fileSize,
      fileType: existingFile.fileType,
      uploadedBy: existingFile.authorId,
      notes: existingFile.checkoutNotes || null,
    });

    if (versionError) {
      console.error("🔧 [MEDIA-VERSIONING] Error storing previous version:", versionError);
    }
  }

  // Determine if file should be private based on project status
  let isPrivate = false;
  if (params.projectId) {
    try {
      const { data: projectData } = await supabaseAdmin
        .from("projects")
        .select("status")
        .eq("id", parseInt(params.projectId))
        .single();

      // Files uploaded when project status < 30 should be public (not private)
      // Files uploaded when project status >= 30 should be private by default
      isPrivate = projectData?.status >= 30;
    } catch (error) {
      console.warn("Could not determine project status, defaulting to public:", error);
    }
  }

  // Log file in database
  const fileRecord = {
    projectId: params.projectId ? parseInt(params.projectId) : null,
    authorId: params.currentUser.id,
    filePath: fullPath,
    fileName: params.fileName,
    fileSize: fileBuffer.byteLength,
    fileType: contentType,
    title: params.title || params.fileName,
    comments: params.description || null,
    status: "active",
    bucketName: bucket,
    targetLocation: params.targetLocation,
    targetId: params.targetId ? parseInt(params.targetId) : null,
    uploadedAt: new Date().toISOString(),
    versionNumber: versionNumber,
    previousVersionId: previousVersionId,
    isCurrentVersion: true,
    isPrivate: isPrivate,
  };

  console.log("🔧 [MEDIA-VERSIONING] Inserting database record:", fileRecord);

  const { data: dbData, error: dbError } = await supabaseAdmin
    .from("files")
    .insert(fileRecord)
    .select()
    .single();

  if (dbError) {
    console.error("🔧 [MEDIA-VERSIONING] Database error:", dbError);
    throw new Error(`Database error: ${dbError.message}`);
  }

  // Generate signed URL (valid for 1 hour)
  const { data: urlData, error: urlError } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(fullPath, 3600);

  if (urlError) {
    console.warn("🔧 [MEDIA-VERSIONING] Failed to generate signed URL:", urlError);
  }

  console.log("🔧 [MEDIA-VERSIONING] Media saved successfully:", {
    id: dbData.id,
    version: versionNumber,
    isNewVersion: !!existingFile,
  });

  return {
    id: dbData.id,
    fileName: params.fileName,
    filePath: fullPath,
    fileType: contentType,
    bucketName: bucket,
    publicUrl: urlData?.signedUrl || null,
    targetLocation: params.targetLocation,
    targetId: params.targetId ? parseInt(params.targetId) : undefined,
    fileSize: fileBuffer.byteLength,
    uploadedAt: dbData.uploadedAt,
    title: params.title,
    comments: params.description,
  };
}

// GET MEDIA FUNCTION
export async function getMedia(params: GetMediaParams): Promise<{
  success: boolean;
  media: MediaFile | MediaFile[] | null;
  count?: number;
  message: string;
}> {
  // console.log("🐛 [MEDIA] getMedia called:", params);

  const { supabaseAdmin } = await import("./supabase-admin");

  if (!supabaseAdmin) {
    throw new Error("Database connection not available");
  }

  // Handle featured image requests
  if (params.mediaType === "featuredImage" && params.projectId) {
    // console.log("🐛 [MEDIA] Getting featured image for project:", params.projectId);

    const { data: projectData, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("featuredImageId, featuredImageData")
      .eq("id", parseInt(params.projectId))
      .single();

    if (projectError) {
      throw new Error(`Project lookup error: ${projectError.message}`);
    }

    // Use denormalized data if available, but generate signed URL
    if (projectData?.featuredImageData) {
      // console.log("🐛 [MEDIA] Using denormalized featured image data");

      const featuredData = projectData.featuredImageData;

      // Generate signed URL for the cached data
      const { data: urlData, error: urlError } = await supabaseAdmin.storage
        .from(featuredData.bucketName)
        .createSignedUrl(featuredData.filePath, 3600);

      if (urlError) {
        console.warn(
          "🐛 [MEDIA] Failed to generate signed URL for cached featured image:",
          urlError
        );
      }

      return {
        success: true,
        media: {
          ...featuredData,
          publicUrl: urlData?.signedUrl || null,
        } as MediaFile,
        message: "Featured image retrieved from cache",
      };
    }

    // Fallback to file lookup
    if (!projectData?.featuredImageId) {
      return {
        success: true,
        media: null,
        message: "No featured image set",
      };
    }

    const { data: fileData, error: fileError } = await supabaseAdmin
      .from("files")
      .select("*")
      .eq("id", projectData.featuredImageId)
      .single();

    if (fileError) {
      throw new Error(`File lookup error: ${fileError.message}`);
    }

    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from(fileData.bucketName)
      .createSignedUrl(fileData.filePath, 3600);

    if (urlError) {
      console.warn("🐛 [MEDIA] Failed to generate signed URL for featured image:", urlError);
    }

    return {
      success: true,
      media: {
        id: fileData.id,
        fileName: fileData.fileName,
        filePath: fileData.filePath,
        fileType: fileData.fileType,
        fileSize: fileData.fileSize,
        uploadedAt: fileData.uploadedAt,
        projectId: fileData.projectId,
        targetId: fileData.targetId,
        targetLocation: fileData.targetLocation,
        bucketName: fileData.bucketName,
        publicUrl: urlData?.signedUrl || null,
        title: fileData.title,
        comments: fileData.comments,
      },
      message: "Featured image retrieved",
    };
  }

  // Handle specific file requests
  if (params.fileId) {
    // console.log("🐛 [MEDIA] Getting specific file:", params.fileId);

    const { data: fileData, error: fileError } = await supabaseAdmin
      .from("files")
      .select("*")
      .eq("id", parseInt(params.fileId))
      .single();

    if (fileError) {
      throw new Error(`File lookup error: ${fileError.message}`);
    }

    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from(fileData.bucketName)
      .createSignedUrl(fileData.filePath, 3600);

    if (urlError) {
      console.warn("🐛 [MEDIA] Failed to generate signed URL for file:", urlError);
    }

    return {
      success: true,
      media: {
        id: fileData.id,
        fileName: fileData.fileName,
        filePath: fileData.filePath,
        fileType: fileData.fileType,
        fileSize: fileData.fileSize,
        uploadedAt: fileData.uploadedAt,
        projectId: fileData.projectId,
        targetId: fileData.targetId,
        targetLocation: fileData.targetLocation,
        bucketName: fileData.bucketName,
        publicUrl: urlData?.signedUrl || null,
        title: fileData.title,
        comments: fileData.comments,
      },
      message: "File retrieved",
    };
  }

  // Handle project file lists
  if (params.projectId) {
    // console.log("🐛 [MEDIA] Getting project files:", params.projectId);

    // Get project's featuredImageId for marking files as featured
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("featuredImageId")
      .eq("id", parseInt(params.projectId))
      .single();

    const featuredImageId = projectData?.featuredImageId;

    let query = supabaseAdmin
      .from("files")
      .select("*")
      .eq("projectId", parseInt(params.projectId))
      .order("uploadedAt", { ascending: false });

    // Filter by target location if provided
    if (params.targetLocation) {
      query = query.eq("targetLocation", params.targetLocation);
    }

    // Filter by target ID if provided
    if (params.targetId) {
      query = query.eq("targetId", parseInt(params.targetId));
    }

    // Get user role to determine if they can see private files
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", params.currentUser.id)
      .single();

    const userRole = userProfile?.role;
    // console.log("🔧 [MEDIA] User role for file filtering:", userRole);

    // If user is not Admin or Staff, filter out private files
    if (userRole !== "Admin" && userRole !== "Staff") {
      // console.log("🔧 [MEDIA] Filtering out private files for client user");
      // Only filter if isPrivate column exists (for backward compatibility)
      query = query.or("isPrivate.is.null,isPrivate.eq.false");
    }

    const { data: files, error: filesError } = await query;

    if (filesError) {
      console.error("❌ [MEDIA] Database error:", filesError);
      throw new Error(`Database error: ${filesError.message}`);
    }

    // console.log("🔧 [MEDIA] Files found:", files?.length || 0);
    // console.log("🔧 [MEDIA] Files data:", files);

    const mediaFiles = await Promise.all(
      (files || []).map(async (file) => {
        const { data: urlData, error: urlError } = await supabaseAdmin.storage
          .from(file.bucketName)
          .createSignedUrl(file.filePath, 3600);

        if (urlError) {
          console.warn(
            `🐛 [MEDIA] Failed to generate signed URL for file ${file.fileName}:`,
            urlError
          );
        }

        // Fetch user names if needed (optional - can be removed if not required)
        let assignedToName = null;
        let checkedOutByName = null;
        let uploadedByName = null;

        if (file.assignedTo) {
          const { data: assignedToProfile } = await supabaseAdmin
            .from("profiles")
            .select("companyName")
            .eq("id", file.assignedTo)
            .single();
          assignedToName = assignedToProfile?.companyName || null;
        }

        if (file.checkedOutBy) {
          const { data: checkedOutProfile } = await supabaseAdmin
            .from("profiles")
            .select("companyName")
            .eq("id", file.checkedOutBy)
            .single();
          checkedOutByName = checkedOutProfile?.companyName || null;
        }

        if (file.authorId) {
          const { data: uploaderProfile } = await supabaseAdmin
            .from("profiles")
            .select("companyName")
            .eq("id", file.authorId)
            .single();
          uploadedByName = uploaderProfile?.companyName || null;
        }

        return {
          id: file.id,
          fileName: file.fileName,
          filePath: file.filePath,
          fileType: file.fileType,
          fileSize: file.fileSize,
          uploadedAt: file.uploadedAt,
          projectId: file.projectId,
          targetId: file.targetId,
          checkedOutBy: file.checkedOutBy,
          checkedOutAt: file.checkedOutAt,
          assignedTo: file.assignedTo,
          assignedAt: file.assignedAt,
          checkoutNotes: file.checkoutNotes,
          // Add the user names from separate queries
          assignedToName: assignedToName,
          checkedOutByName: checkedOutByName,
          uploadedByName: uploadedByName,
          targetLocation: file.targetLocation,
          bucketName: file.bucketName,
          publicUrl: urlData?.signedUrl || null,
          title: file.title,
          comments: file.comments,
          isFeatured: featuredImageId && file.id === parseInt(featuredImageId),
          versionNumber: file.versionNumber || 1,
          isCurrentVersion: file.isCurrentVersion !== false,
          previousVersionId: file.previousVersionId,
          isPrivate: file.isPrivate || false,
        };
      })
    );

    return {
      success: true,
      media: mediaFiles,
      count: mediaFiles.length,
      message: "Project files retrieved",
    };
  }

  throw new Error("Invalid request parameters");
}

// DELETE MEDIA FUNCTION
export async function deleteMedia(
  fileId: string,
  currentUser: User
): Promise<{
  success: boolean;
  message: string;
  deletedFile?: {
    id: number;
    fileName: string;
    filePath: string;
  };
}> {
  // console.log("🐛 [MEDIA] deleteMedia called:", fileId);

  const { supabaseAdmin } = await import("./supabase-admin");

  if (!supabaseAdmin) {
    throw new Error("Database connection not available");
  }

  // Get file info first
  const { data: fileData, error: fileError } = await supabaseAdmin
    .from("files")
    .select("*")
    .eq("id", parseInt(fileId))
    .single();

  if (fileError) {
    throw new Error(`File not found: ${fileError.message}`);
  }

  // console.log("🐛 [MEDIA] File to delete:", fileData.filePath);

  // Delete from storage
  const { error: storageError } = await supabaseAdmin.storage
    .from(fileData.bucketName)
    .remove([fileData.filePath]);

  if (storageError) {
    console.warn("🐛 [MEDIA] Storage deletion warning:", storageError);
    // Don't throw here - file might not exist in storage but we still want to clean up DB
  }

  // Delete from database
  const { error: dbError } = await supabaseAdmin.from("files").delete().eq("id", parseInt(fileId));

  if (dbError) {
    throw new Error(`Database deletion failed: ${dbError.message}`);
  }

  // If this was a featured image, clear it from the project
  if (fileData.projectId) {
    await supabaseAdmin
      .from("projects")
      .update({ featuredImageId: null, featuredImageData: null })
      .eq("featuredImageId", fileId);
  }

  // console.log("🐛 [MEDIA] Media deleted successfully:", fileId);

  return {
    success: true,
    message: "Media deleted successfully",
    deletedFile: {
      id: fileData.id,
      fileName: fileData.fileName,
      filePath: fileData.filePath,
    },
  };
}

// UPDATE FEATURED IMAGE FUNCTION
export async function updateFeaturedImage(
  projectId: string,
  fileId: string,
  isActive: boolean,
  currentUser: User
): Promise<{
  success: boolean;
  message: string;
}> {
  // console.log("🐛 [MEDIA] updateFeaturedImage called:", { projectId, fileId, isActive });

  const { supabaseAdmin } = await import("./supabase-admin");

  if (!supabaseAdmin) {
    throw new Error("Database connection not available");
  }

  // Update the project's featuredImageId
  const { error: updateError } = await supabaseAdmin
    .from("projects")
    .update({
      featuredImageId: isActive ? fileId : null,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", parseInt(projectId));

  if (updateError) {
    throw new Error(`Database error: ${updateError.message}`);
  }

  // console.log("🐛 [MEDIA] Featured image updated successfully");

  return {
    success: true,
    message: `Featured image ${isActive ? "set" : "removed"} successfully`,
  };
}

// UTILITY FUNCTIONS FOR FILE HANDLING

// Format file size in human-readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Get file icon SVG based on file type
export function getFileIcon(fileType: string): string {
  const type = fileType.toLowerCase();

  // PDF files
  if (type.includes("pdf")) {
    return `<svg class="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
      <path d="M9 12h6v2H9zm0 4h6v2H9z"/>
    </svg>`;
  }

  // Image files
  if (
    type.includes("image") ||
    type.includes("png") ||
    type.includes("jpg") ||
    type.includes("jpeg") ||
    type.includes("gif") ||
    type.includes("webp")
  ) {
    return `<svg class="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
    </svg>`;
  }

  // CAD files
  if (type.includes("dwg") || type.includes("dxf") || type.includes("cad")) {
    return `<svg class="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
    </svg>`;
  }

  // Document files
  if (
    type.includes("doc") ||
    type.includes("docx") ||
    type.includes("txt") ||
    type.includes("rtf")
  ) {
    return `<svg class="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
      <path d="M9 12h6v2H9zm0 4h6v2H9z"/>
    </svg>`;
  }

  // Spreadsheet files
  if (type.includes("xls") || type.includes("xlsx") || type.includes("csv")) {
    return `<svg class="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
      <path d="M8 12h8v2H8zm0 4h8v2H8z"/>
    </svg>`;
  }

  // Archive files
  if (
    type.includes("zip") ||
    type.includes("rar") ||
    type.includes("7z") ||
    type.includes("tar") ||
    type.includes("gz")
  ) {
    return `<svg class="h-6 w-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
      <path d="M12 10l-2 2 2 2 2-2-2-2z"/>
    </svg>`;
  }

  // Default file icon
  return `<svg class="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
  </svg>`;
}

// Download file function
export async function downloadFile(
  filePath: string,
  fileName: string,
  projectId?: string
): Promise<void> {
  try {
    const response = await fetch("/api/download-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, fileName, projectId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Download failed");
    }

    // Create blob from response and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error("Error downloading file:", error);
    throw new Error(`Failed to download ${fileName}: ${error.message}`);
  }
}

// Get file type from extension (utility function)
export function getFileTypeFromExtension(fileName: string): string {
  const extension = fileName.toLowerCase().split(".").pop();

  const typeMap: { [key: string]: string } = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    tiff: "image/tiff",
    svg: "image/svg+xml",

    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",

    // CAD files
    dwg: "application/dwg",
    dxf: "application/dxf",
    dwt: "application/dwt",
    dws: "application/dws",
    dwf: "application/dwf",

    // Archives
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",
  };

  return typeMap[extension || ""] || "application/octet-stream";
}
