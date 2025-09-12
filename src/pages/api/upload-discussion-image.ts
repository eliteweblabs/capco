import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("📸 [UPLOAD-DISCUSSION-IMAGE] API called");

  try {
    const formData = await request.formData();

    // Add the fileType parameter to indicate this is for discussion images
    formData.append("fileType", "discussion-images");

    // Get authentication tokens from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      console.log("📸 [UPLOAD-DISCUSSION-IMAGE] Missing auth tokens");
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Instead of making an internal fetch call, directly call the upload logic
    // This avoids authentication issues with internal API calls

    // Import the upload API logic directly
    const { supabase } = await import("../../lib/supabase");

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Supabase client not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set up session from cookies
    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("📸 [UPLOAD-DISCUSSION-IMAGE] Authentication error:", userError);
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("📸 [UPLOAD-DISCUSSION-IMAGE] Upload request from user:", user.id);

    // Get project ID from form data
    const projectId = formData.get("projectId") as string;
    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the file
    const file = formData.get("file") as File;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify project access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, author_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("📸 [UPLOAD-DISCUSSION-IMAGE] Project not found:", projectError);
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin or project owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role || "Client";
    const isAdmin = userRole === "Admin" || userRole === "Staff";
    const isProjectOwner = project.author_id === user.id;

    if (!isAdmin && !isProjectOwner) {
      console.error("📸 [UPLOAD-DISCUSSION-IMAGE] Access denied for project:", projectId);
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate file type (discussion images only)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/tiff",
      "image/svg+xml",
    ];

    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: `File type "${file.type}" not allowed for discussion images. File: ${file.name}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({
          error: `File ${file.name} exceeds maximum size of 10MB`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = `project-documents/discussion-images/${projectId}/${fileName}`;

    console.log(`📸 [UPLOAD-DISCUSSION-IMAGE] Uploading to path: ${filePath}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("project-documents")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(`📸 [UPLOAD-DISCUSSION-IMAGE] Upload error:`, uploadError);
      return new Response(
        JSON.stringify({
          error: `Failed to upload ${file.name}: ${uploadError.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log file in database
    const { error: dbError } = await supabase.from("files").insert({
      project_id: parseInt(projectId),
      author_id: user.id,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      title: file.name,
      comments: null,
      status: "active",
      uploaded_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error(`📸 [UPLOAD-DISCUSSION-IMAGE] Database error:`, dbError);
      // Continue even if database logging fails
    }

    const uploadedFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      path: filePath,
      id: uploadData?.id || crypto.randomUUID(),
    };

    const responseData = {
      success: true,
      files: [uploadedFile],
      projectId,
      message: "Successfully uploaded discussion image",
    };

    console.log("📸 [UPLOAD-DISCUSSION-IMAGE] Upload successful:", {
      file: uploadedFile.name,
      path: uploadedFile.path,
      projectId,
    });

    // Return the response with proper headers
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("📸 [UPLOAD-DISCUSSION-IMAGE] Error:", error);
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
