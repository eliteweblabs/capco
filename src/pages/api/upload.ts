import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  console.log("Upload API called");
  try {
    const formData = await request.formData();
    const fileType = formData.get("fileType") as string;
    const projectId = formData.get("projectId") as string;

    console.log("Upload request data:", {
      fileType,
      projectId,
      hasFile: formData.has("file"),
      hasFiles: formData.has("files"),
    });

    // Handle both single file and multiple files
    let files: File[] = [];
    if (formData.has("file")) {
      files = [formData.get("file") as File];
    } else if (formData.has("files")) {
      files = formData.getAll("files") as File[];
    }

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate file types and sizes based on fileType
    const maxSize = 10 * 1024 * 1024; // 10MB
    let allowedTypes: string[] = [];

    if (fileType === "media") {
      // Allow various media file types
      allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/avi",
        "video/mov",
        "video/wmv",
        "audio/mp3",
        "audio/wav",
        "audio/m4a",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "application/acad", // .dwg files (AutoCAD drawings)
        "application/x-autocad", // Alternative DWG MIME type
        "application/autocad", // Another alternative DWG MIME type
      ];
    } else {
      // Default to PDF only for backward compatibility
      allowedTypes = ["application/pdf"];
    }

    for (const file of files) {
      // Special handling for DWG files - check by extension if MIME type doesn't match expected types
      const isDwgFile = file.name.toLowerCase().endsWith('.dwg');
      const isAllowedType = allowedTypes.includes(file.type) || 
        (fileType === "media" && isDwgFile && (file.type === "application/octet-stream" || file.type === ""));

      console.log(`File validation: ${file.name}, type: "${file.type}", isDwg: ${isDwgFile}, allowed: ${isAllowedType}`);

      if (!isAllowedType) {
        return new Response(
          JSON.stringify({
            error: `File type "${file.type}" not allowed for ${fileType} uploads. File: ${file.name}`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (file.size > maxSize) {
        return new Response(
          JSON.stringify({
            error: `File ${file.name} exceeds maximum size of 10MB`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // Upload files to Supabase Storage
    const { supabase } = await import("../../lib/supabase");

    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Supabase client not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      try {
        console.log(
          `Processing file: ${file.name} (${file.type}, ${file.size} bytes)`,
        );

        // Generate unique file path
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = `${fileType === "media" ? "project-media" : "project-documents"}/${projectId}/${fileName}`;

        console.log(`Uploading to path: ${filePath}`);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("project-documents")
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          console.error(`Upload error details:`, {
            message: uploadError.message,
            statusCode: uploadError.statusCode,
            error: uploadError.error,
            details: uploadError.details,
          });
          throw new Error(
            `Failed to upload ${file.name}: ${uploadError.message}`,
          );
        }

        // Log file in database
        const { error: dbError } = await supabase.from("files").insert({
          project_id: parseInt(projectId),
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          status: "active",
        });

        if (dbError) {
          console.error(`Error logging file ${file.name}:`, dbError);
          // Continue even if database logging fails
        }

        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          path: filePath,
          id: uploadData?.id || crypto.randomUUID(),
        });
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        throw fileError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        files: uploadedFiles,
        projectId,
        message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Upload API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
