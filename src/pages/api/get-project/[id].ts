import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ params, cookies }) => {
  // console.log("📡 [GET-PROJECT-ID] API route called for project:", params.id);

  try {
    const projectId = params.id;

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Project ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check authentication
    const { isAuth, user, role } = await checkAuth(cookies);

    if (!isAuth || !user) {
      console.log("📡 [GET-PROJECT-ID] User not authenticated");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // console.log("📡 [GET-PROJECT-ID] User authenticated:", { userId: user.id, role });

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database connection not available",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get project data with RLS handling authorization
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("📡 [GET-PROJECT-ID] Database error:", projectError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Project not found or access denied",
          details: projectError.message,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!project) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Project not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // console.log("📡 [GET-PROJECT-ID] Project found:", project.title);

    // Get project author's profile data
    let projectAuthor = null;
    if (project.author_id) {
      const { data: authorProfile, error: authorError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", project.author_id)
        .single();

      if (authorError) {
        console.error("📡 [GET-PROJECT-ID] Error fetching author profile:", authorError);
      } else {
        projectAuthor = authorProfile;
        // console.log("📡 [GET-PROJECT-ID] Author profile loaded:", projectAuthor.company_name);
      }
    }

    // Get assigned user's profile data if project has an assigned user
    if (project.assigned_to_id) {
      const { data: assignedProfile, error: assignedError } = await supabase
        .from("profiles")
        .select("id, company_name")
        .eq("id", project.assigned_to_id)
        .single();

      if (assignedError) {
        console.error("📡 [GET-PROJECT-ID] Error fetching assigned user profile:", assignedError);
      } else {
        // Add assigned user name to the project data
        project.assigned_to_name = assignedProfile.company_name || assignedProfile.id;
        // console.log("📡 [GET-PROJECT-ID] Assigned user profile loaded:", project.assigned_to_name);
      }
    } else {
      project.assigned_to_name = null;
    }

    // console.log("📡 [GET-PROJECT-ID] Returning project data successfully");

    return new Response(
      JSON.stringify({
        success: true,
        project: project,
        projectAuthor: projectAuthor,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("📡 [GET-PROJECT-ID] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
