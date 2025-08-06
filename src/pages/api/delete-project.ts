import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    console.log("Delete project API called");

    // Check if Supabase is configured
    if (!supabase) {
      console.error("Database not configured - supabase client not available");
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get current user from cookies for authentication
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    console.log("Access token:", accessToken ? "Present" : "Missing");
    console.log("Refresh token:", refreshToken ? "Present" : "Missing");

    if (!accessToken || !refreshToken) {
      console.error("Not authenticated - missing tokens");
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
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
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("User authenticated:", user.id);

    // Get the request body
    const requestBody = await request.json();
    console.log("Request body:", requestBody);

    const { projectId } = requestBody;

    if (!projectId) {
      console.error("Project ID is required");
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert projectId to number if it's a string
    const projectIdNum =
      typeof projectId === "string" ? parseInt(projectId, 10) : projectId;

    if (isNaN(projectIdNum)) {
      console.error("Invalid project ID:", projectId);
      return new Response(JSON.stringify({ error: "Invalid project ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Project ID:", projectIdNum);

    // Check if project exists and user has permission to delete it
    console.log("Looking up project:", projectIdNum);
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, author_id")
      .eq("id", projectIdNum)
      .single();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Project found:", project);

    // Check user's role and permissions
    console.log("Looking up user profile:", user.id);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
    }

    const isAdmin = profile?.role === "Admin";
    const isAuthor = project.author_id === user.id;

    console.log("User role:", profile?.role);
    console.log("Is admin:", isAdmin);
    console.log("Is author:", isAuthor);
    console.log("Project author:", project.author_id);
    console.log("Current user:", user.id);

    if (!isAdmin && !isAuthor) {
      console.error("Unauthorized to delete this project");
      return new Response(
        JSON.stringify({ error: "Unauthorized to delete this project" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Delete associated files first (cascade delete)
    console.log("Deleting associated files...");
    const { error: filesError } = await supabase
      .from("files")
      .delete()
      .eq("project_id", projectIdNum);

    if (filesError) {
      console.error("Error deleting project files:", filesError);
    } else {
      console.log("Files deleted successfully");
    }

    // Delete the project
    console.log("Deleting project...");
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectIdNum);

    if (deleteError) {
      console.error("Failed to delete project:", deleteError);
      return new Response(
        JSON.stringify({
          error: `Failed to delete project: ${deleteError.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.log("Project deleted successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Project deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in delete-project API:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
