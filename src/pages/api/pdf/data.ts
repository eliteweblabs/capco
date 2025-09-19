import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Project ID is required",
        }),
        { status: 400 }
      );
    }

    console.log(`📄 [PDF-DATA] Fetching data for project: ${projectId}`);

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Supabase client not initialized",
        }),
        { status: 500 }
      );
    }
    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("❌ [PDF-DATA] Error fetching project:", projectError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to fetch project data",
          error: projectError.message,
        }),
        { status: 500 }
      );
    }

    if (!project) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Project not found",
        }),
        { status: 404 }
      );
    }

    // Get project author's profile data
    let projectAuthor = null;
    if (project.author_id) {
      const { data: authorProfile, error: authorError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", project.author_id)
        .single();

      if (authorError) {
        console.error("❌ [PDF-DATA] Error fetching author profile:", authorError);
      } else {
        projectAuthor = authorProfile;
      }
    }

    // Get assigned user's profile data if project has an assigned user
    let assignedStaff = null;
    if (project.assigned_to_id) {
      const { data: assignedProfile, error: assignedError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", project.assigned_to_id)
        .single();

      if (assignedError) {
        console.error("❌ [PDF-DATA] Error fetching assigned user profile:", assignedError);
      } else {
        assignedStaff = assignedProfile;
      }
    }

    // Fetch project status data
    const { data: statusData, error: statusError } = await supabase
      .from("project_statuses")
      .select("*")
      .eq("status_code", project.status)
      .single();

    if (statusError) {
      console.error("❌ [PDF-DATA] Error fetching status:", statusError);
    }

    // Fetch project files
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("uploaded_at", { ascending: false });

    if (filesError) {
      console.error("❌ [PDF-DATA] Error fetching files:", filesError);
    }

    console.log(`✅ [PDF-DATA] Successfully prepared placeholder data for project ${projectId}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          project,
          status: statusData,
          files: files || [],
          placeholders: placeholderData,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ [PDF-DATA] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "An unexpected error occurred",
        error: error.message,
      }),
      { status: 500 }
    );
  }
};
