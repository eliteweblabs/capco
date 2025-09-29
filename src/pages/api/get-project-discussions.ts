import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { replacePlaceholders, type PlaceholderData } from "../../lib/placeholder-utils";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication to get user role for filtering
    const { currentRole } = await checkAuth(cookies);
    const isClient = currentRole === "Client";
    // console.log("📡 [GET-DISCUSSIONS] User role:", currentRole, "isClient:", isClient);

    const projectId = url.searchParams.get("projectId");

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

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get discussions with author information
    // Convert projectId to integer since projects table uses integer IDs
    const projectIdInt = parseInt(projectId, 10);

    if (isNaN(projectIdInt)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid project ID format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let discussionsQuery = supabase
      .from("discussion")
      .select(
        `
        id,
        created_at,
        message,
        author_id,
        project_id,
        internal,
        mark_completed,
        parent_id,
        image_urls,
        image_paths,
        company_name
      `
      )
      .eq("project_id", projectIdInt);

    // For clients, exclude internal discussions (Admin/Staff see all)
    if (isClient) {
      discussionsQuery = discussionsQuery.eq("internal", false);
    }
    // Admin and Staff see all discussions (no additional filtering needed)

    const { data: discussions, error } = await discussionsQuery.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching discussions:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get project data for placeholder replacement
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectIdInt)
      .single();

    if (projectError) {
      console.error("Error fetching project for placeholders:", projectError);
    }

    // Get project author's profile data for placeholders
    let projectAuthor = null;
    if (project?.author_id) {
      const { data: authorProfile, error: authorError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", project.author_id)
        .single();

      if (authorError) {
        console.error("Error fetching author profile for placeholders:", authorError);
      } else {
        projectAuthor = authorProfile;
      }
    }

    // Prepare placeholder data for centralized replacement
    const placeholderData: PlaceholderData = {
      project: {
        ...project,
        authorProfile: projectAuthor,
      },
    };

    // Process discussions with placeholder replacement and company name
    const discussionsWithCompanyName =
      discussions?.map((discussion) => ({
        ...discussion,
        message: replacePlaceholders(discussion.message, placeholderData, true),
        company_name: discussion.company_name || "Unknown User",
      })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        discussions: discussionsWithCompanyName,
        count: discussionsWithCompanyName.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get project discussions error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch discussions",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
