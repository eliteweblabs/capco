import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

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

    const { file_id, project_id } = requestBody;

    if (!file_id) {
      console.error("File ID is required");
      return new Response(JSON.stringify({ error: "File ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!project_id) {
      console.error("Project ID is required");
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert IDs to numbers if they're strings
    const fileIdNum = typeof file_id === "string" ? parseInt(file_id, 10) : file_id;
    const projectIdNum = typeof project_id === "string" ? parseInt(project_id, 10) : project_id;

    if (isNaN(fileIdNum) || isNaN(projectIdNum)) {
      console.error("Invalid file or project ID:", { file_id, project_id });
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

    const isAdmin = profile?.role === "Admin";

    if (!isAdmin) {
      console.error("Unauthorized to delete files - Admin role required");
      return new Response(JSON.stringify({ error: "Only administrators can delete files" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("User is Admin, proceeding with file deletion");

    // Check if file exists and get file details
    console.log("Looking up file:", fileIdNum);
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("id, file_path, project_id, file_name")
      .eq("id", fileIdNum)
      .eq("project_id", projectIdNum)
      .single();

    if (fileError || !file) {
      console.error("File not found:", fileError);
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("File found:", file.file_name, "Path:", file.file_path);

    // Delete file from storage first
    if (file.file_path) {
      console.log("Deleting file from storage:", file.file_path);
      const { error: storageDeleteError } = await supabase.storage
        .from("project-media")
        .remove([file.file_path]);

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
        message: `File <b>${file.file_name}</b> has been deleted successfully`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in delete-file API:", error);
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
