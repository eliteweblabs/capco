import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log("Delete file API called");

    // Check if Supabase is configured
    if (!supabase) {
      console.error("Database not configured - supabase client not available");
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get current user from cookies for authentication
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    console.log("Access token:", accessToken ? "Present" : "Missing");
    console.log("Refresh token:", refreshToken ? "Present" : "Missing");

    if (!accessToken || !refreshToken) {
      console.error("Not authenticated - missing tokens");
      return new Response(JSON.stringify({ error: "Not authenticated. Please log in." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set up session with regular supabase client
    console.log("Setting up session...");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Authentication failed. Please log in again." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("User authenticated:", user.id);

    // Get the request body
    let requestBody;
    try {
      requestBody = await request.json();
      console.log("Request body:", requestBody);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(JSON.stringify({ error: "Invalid request body format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { fileId, projectId } = requestBody;

    if (!fileId) {
      console.error("File ID is required");
      return new Response(JSON.stringify({ error: "File ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!projectId) {
      console.error("Project ID is required");
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert IDs to numbers if they're strings
    const fileIdNum = typeof fileId === "string" ? parseInt(fileId, 10) : fileId;
    const projectIdNum = typeof projectId === "string" ? parseInt(projectId, 10) : projectId;

    if (isNaN(fileIdNum) || isNaN(projectIdNum)) {
      console.error("Invalid file or project ID:", { fileId, projectId });
      return new Response(JSON.stringify({ error: "Invalid file or project ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("File ID:", fileIdNum, "Project ID:", projectIdNum);

    // Check user's role - only Admin can delete files
    console.log("Looking up user profile:", user.id);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return new Response(JSON.stringify({ error: "Failed to verify user permissions" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userRole = profile?.role;
    const isAdmin = userRole === "Admin";
    const isStaff = userRole === "Staff";
    const isClient = userRole === "Client";

    // Get project status to determine if client can delete
    let projectStatus = 0;
    if (projectIdNum) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("status")
        .eq("id", projectIdNum)
        .single();

      if (!projectError && project) {
        projectStatus = project.status || 0;
      }
    }

    // Permission logic: Admins/Staff can always delete, Clients can delete at status <= 10
    const canDelete = isAdmin || isStaff || (isClient && projectStatus <= 10);

    if (!canDelete) {
      console.error("Unauthorized to delete files - insufficient permissions");
      const errorMessage = isClient
        ? "Files can only be deleted during the initial project phase (status 10 or below)"
        : "Only administrators and staff can delete files";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`User (${userRole}) authorized to delete files. Project status: ${projectStatus}`);

    // Check if file exists and get file details
    console.log("Looking up file:", fileIdNum);
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("id, filePath, projectId, fileName")
      .eq("id", fileIdNum)
      .eq("projectId", projectIdNum)
      .single();

    if (fileError || !file) {
      console.error("File not found:", fileError);
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("File found:", file.fileName, "Path:", file.filePath);

    // Delete file from storage first
    if (file.filePath) {
      console.log("Deleting file from storage:", file.filePath);
      const { error: storageDeleteError } = await supabase.storage
        .from("project-media")
        .remove([file.filePath]);

      if (storageDeleteError) {
        console.error("Error deleting file from storage:", storageDeleteError);
        // Continue with database deletion even if storage deletion fails
      } else {
        console.log("File deleted from storage successfully");
      }
    }

    // Delete file record from database using admin client
    if (!supabaseAdmin) {
      console.error("Database not configured - supabase admin client not available");
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Deleting file record from database...");
    const { error: deleteError } = await supabaseAdmin.from("files").delete().eq("id", fileIdNum);

    if (deleteError) {
      console.error("Failed to delete file from database:", deleteError);
      return new Response(
        JSON.stringify({
          error: `Failed to delete file: ${deleteError.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("File deleted successfully from database");

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `File <b>${file.fileName}</b> has been deleted successfully`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in file/delete API:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to delete file. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
