import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { createClient } from "@supabase/supabase-js";

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

    // Get environment variables for admin client
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("Supabase URL:", supabaseUrl ? "Set" : "Not set");
    console.log("Service Key:", supabaseServiceKey ? "Set" : "Not set");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Database not configured - missing environment variables");
      console.error("SUPABASE_URL:", supabaseUrl ? "Set" : "Missing");
      console.error(
        "SUPABASE_SERVICE_ROLE_KEY:",
        supabaseServiceKey ? "Set" : "Missing",
      );
      return new Response(
        JSON.stringify({
          error: "Database not configured",
          details:
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. Please check your .env file or environment configuration.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase admin client created");

    // Test the connection
    try {
      const { data, error } = await supabaseAdmin
        .from("projects")
        .select("count")
        .limit(1);
      if (error) {
        console.error("Database connection test failed:", error);
        return new Response(
          JSON.stringify({
            error: "Database connection failed",
            details:
              "Unable to connect to Supabase database. Please check your configuration.",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      console.log("Database connection test successful");
    } catch (error) {
      console.error("Database connection test error:", error);
      return new Response(
        JSON.stringify({
          error: "Database connection failed",
          details:
            "Unable to connect to Supabase database. Please check your configuration.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

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

    // Set up session with admin client to get user info
    console.log("Setting up session...");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.setSession({
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

    // Check if project exists and user has permission to delete it
    console.log("Looking up project:", projectIdNum);
    const { data: project, error: projectError } = await supabaseAdmin
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

    // Check if user is the author or an admin
    console.log("Looking up user profile:", user.id);
    const { data: profile, error: profileError } = await supabaseAdmin
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

    // Delete associated files first
    console.log("Deleting associated files...");
    const { error: filesError } = await supabaseAdmin
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
    const { error: deleteError } = await supabaseAdmin
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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
