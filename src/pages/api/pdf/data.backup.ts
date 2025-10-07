import type { APIRoute } from "astro";
import { replacePlaceholders } from "../../../lib/placeholder-utils";
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
    if (project.authorId) {
      const { data: authorProfile, error: authorError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", project.authorId)
        .single();

      if (authorError) {
        console.error("❌ [PDF-DATA] Error fetching author profile:", authorError);
      } else {
        projectAuthor = authorProfile;
      }
    }

    // Get assigned user's profile data if project has an assigned user
    let assignedStaff = null;
    if (project.assignedToId) {
      const { data: assignedToProfile, error: assignedError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", project.assignedToId)
        .single();

      if (assignedError) {
        console.error("❌ [PDF-DATA] Error fetching assigned user profile:", assignedError);
      } else {
        assignedStaff = assignedToProfile;
      }
    }

    // Fetch project status data
    const { data: statusData, error: statusError } = await supabase
      .from("projectStatuses")
      .select("*")
      .eq("statusCode", project.status)
      .single();

    if (statusError) {
      console.error("❌ [PDF-DATA] Error fetching status:", statusError);
    }

    // Fetch project files
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("*")
      .eq("projectId", projectId)
      .eq("status", "active")
      .order("uploadedAt", { ascending: false });

    if (filesError) {
      console.error("❌ [PDF-DATA] Error fetching files:", filesError);
    }

    // Create comprehensive placeholder data using the utility
    const placeholderData = {
      project: project,
    };

    console.log("🔄 [PDF-DATA] Placeholder data:", placeholderData);
    // Generate all placeholder values using the utility
    const placeholderValues = {
      PROJECT_TITLE: replacePlaceholders("{{PROJECT_TITLE}}", placeholderData, false),
      PROJECT_ADDRESS: replacePlaceholders("{{PROJECT_ADDRESS}}", placeholderData, false),
      PROJECT_DESCRIPTION: replacePlaceholders("{{PROJECT_DESCRIPTION}}", placeholderData, false),
      PROJECT_SQ_FT: replacePlaceholders("{{PROJECT_SQ_FT}}", placeholderData, false),
      PROJECT_NEW_CONSTRUCTION: replacePlaceholders(
        "{{PROJECT_NEW_CONSTRUCTION}}",
        placeholderData,
        false
      ),
      PROJECT_CREATED_DATE: replacePlaceholders("{{PROJECT_CREATED_DATE}}", placeholderData, false),
      companyName: replacePlaceholders("{{companyName}}", placeholderData, false),
      CLIENT_COMPANY: replacePlaceholders("{{companyName}}", placeholderData, false),
      CLIENT_EMAIL: replacePlaceholders("{{CLIENT_EMAIL}}", placeholderData, false),
      PHONE: replacePlaceholders("{{PHONE}}", placeholderData, false),
      ASSIGNED_STAFF_NAME: replacePlaceholders("{{ASSIGNED_STAFF_NAME}}", placeholderData, false),
      ASSIGNED_STAFF_EMAIL: replacePlaceholders("{{ASSIGNED_STAFF_EMAIL}}", placeholderData, false),
      ASSIGNED_STAFF_PHONE: replacePlaceholders("{{ASSIGNED_STAFF_PHONE}}", placeholderData, false),
      STATUS_NAME: replacePlaceholders("{{STATUS_NAME}}", placeholderData, false),
      STATUS_DESCRIPTION: replacePlaceholders("{{STATUS_DESCRIPTION}}", placeholderData, false),
      PROJECT_EST_TIME: replacePlaceholders("{{PROJECT_EST_TIME}}", placeholderData, false),
      BUILDING_TYPE: replacePlaceholders("{{BUILDING_TYPE}}", placeholderData, false),
      CURRENT_DATE: replacePlaceholders("{{CURRENT_DATE}}", placeholderData, false),
      CURRENT_YEAR: replacePlaceholders("{{YEAR}}", placeholderData, false),
      DOCUMENT_ID: replacePlaceholders("{{DOCUMENT_ID}}", placeholderData, false),
      DOCUMENT_VERSION: replacePlaceholders("{{DOCUMENT_VERSION}}", placeholderData, false),
      GLOBAL_COMPANY_NAME: replacePlaceholders("{{GLOBAL_companyName}}", placeholderData, false),
      COMPANY_SLOGAN: replacePlaceholders("{{GLOBAL_COMPANY_SLOGAN}}", placeholderData, false),
      COMPANY_ADDRESS: replacePlaceholders("{{COMPANY_ADDRESS}}", placeholderData, false),
      COMPANY_PHONE: replacePlaceholders("{{COMPANY_PHONE}}", placeholderData, false),
      COMPANY_EMAIL: replacePlaceholders("{{COMPANY_EMAIL}}", placeholderData, false),
      COMPANY_WEBSITE: replacePlaceholders("{{COMPANY_WEBSITE}}", placeholderData, false),
      COMPANY_LOGO_URL: replacePlaceholders("{{COMPANY_LOGO_URL}}", placeholderData, false),
    };

    console.log(`✅ [PDF-DATA] Successfully prepared placeholder data for project ${projectId}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          project,
          status: statusData,
          files: files || [],
          placeholders: placeholderValues,
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
