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

    // Prepare placeholder data
    const placeholderData = {
      // Project placeholders
      PROJECT_TITLE: project.title || "Untitled Project",
      PROJECT_ADDRESS: project.address || "No Address Provided",
      ADDRESS: project.address || "No Address Provided",

      // Client placeholders
      CLIENT_NAME:
        projectAuthor?.company_name ||
        `${projectAuthor?.first_name || ""} ${projectAuthor?.last_name || ""}`.trim() ||
        "Unknown Client",
      CLIENT_EMAIL: projectAuthor?.email || "No Email Provided",
      CLIENT_PHONE: projectAuthor?.phone || "No Phone Provided",
      CLIENT_COMPANY: projectAuthor?.company_name || "No Company Provided",

      // Status placeholders
      STATUS_NAME: statusData?.admin_status_name || "Unknown Status",
      EST_TIME: statusData?.est_time || "TBD",

      // Brand/Design placeholders
      PRIMARY_COLOR: "#825bdd", // Primary brand color hex code
      PRIMARY_COLOR_RGB: "130, 91, 221", // Primary color in RGB format
      SECONDARY_COLOR: "#0ea5e9", // Secondary brand color hex code
      SUCCESS_COLOR: "#22c55e", // Success color hex code
      WARNING_COLOR: "#f59e0b", // Warning color hex code
      DANGER_COLOR: "#ef4444", // Danger color hex code
      SVG_LOGO: `<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" width="100" version="1.1" viewBox="0 0 400 143.7" class="h-auto"> <defs> <style>
        .fill {
          fill: black;
        }

        .dark .fill {
          fill: white;
        }
      </style> </defs> <g> <path class="fill" d="M60.7,135.7c-.7-.9-1.2-2.2-2.7-2"></path> <path class="fill" d="M38.3,133.2c-7.6-16.2-6.7-28.6-.5-44.8,4-10.2,18.3-31.4,15.9-41.8-1.3-5.7-2.5-11.9-4.1-17.4s-3.4-3-.9-3.6c10.2,12.1,18.8,22,18.4,38.9-.2,8.8-6.2,19.5,0,27,6.1,7.5,12.8,1,17.5-4.5l3.4-10.1c9.3,17.7,9.3,40.6-3.6,56.4"></path> <path class="fill" d="M22.4,124.8c-1.4.6-1.8-1.4-2.4-2.4-24.6-36.8,20.1-62.5,12.1-98.8s-4.8-10-6.4-15.2c6.9,6,11.2,14.4,12.6,23.5,3.8,24.4-20.9,45.2-21,69.2s2.1,15.6,5.1,23.7Z"></path> <path class="fill" d="M46.3,47.4c1.6,14-9.3,28.5-13.8,41.3-5.3,15.2-7.6,29.8,1.6,44.2-18.4-15.9-12.7-38.6-3.9-57.9,3.8-8.5,10.8-17.2,12.1-26.6.6-4.2-.2-8.3-.3-12.4,0-1.2-.8-3.3.8-3.4.7,4.8,3,10.1,3.5,14.8Z"></path> <path class="fill" d="M72.6,90.3c-8.6-4.5-3-15.6-2.5-22.9v-15.3c6.7,12.5.7,25.3,2.5,38.3Z"></path> </g> <g> <path class="fill" d="M158.4,134.4c-7.6,0-14.7-1.3-21.3-4s-12.2-6.4-17.1-11.3c-4.9-4.8-8.7-10.5-11.4-16.9-2.7-6.4-4.1-13.4-4.1-20.8s1.4-14.4,4.1-20.8c2.7-6.4,6.5-12,11.4-16.8,4.9-4.7,10.6-8.4,17.1-11.1,6.5-2.7,13.6-4,21.3-4s15.4,1.3,21.7,3.9c6.3,2.6,11.9,6.2,16.6,10.7l-15.4,15.5c-2.6-2.9-5.8-5.2-9.7-6.8-3.8-1.6-8.3-2.5-13.3-2.5s-8.5.8-12.2,2.3c-3.7,1.5-6.9,3.7-9.6,6.5-2.7,2.8-4.8,6.2-6.2,10.2-1.5,4-2.2,8.3-2.2,12.9s.7,9.2,2.2,13.1c1.5,3.9,3.5,7.3,6.2,10.2,2.7,2.9,5.9,5,9.6,6.5,3.7,1.5,7.7,2.3,12.2,2.3s9.8-.8,13.7-2.4c3.9-1.6,7.2-3.9,9.9-6.9l15.5,15.5c-4.8,4.6-10.5,8.3-16.8,10.8s-13.8,3.8-22.2,3.8Z"></path> <path class="fill" d="M276.9,132.8h24.3l-40.2-102.5h-20.8l-40.5,102.5h23.7l6.8-18.4h40.1l6.7,18.4ZM237,95.7l13.4-36.4,13.1,36.4h-26.6Z"></path> <path class="fill" d="M385.1,45.4c-3-4.9-7.2-8.6-12.5-11.3-5.3-2.6-11.2-3.9-17.6-3.9h-43v102.5h22.9v-37.3h20c6.5,0,12.4-1.3,17.6-3.9,5.3-2.6,9.4-6.4,12.5-11.3,3-4.9,4.6-10.7,4.6-17.4s-1.5-12.6-4.6-17.5ZM364.7,70.9c-1.4,2.2-3.2,3.9-5.4,5-2.3,1.1-4.8,1.7-7.6,1.7h-16.7v-29.5h16.7c2.8,0,5.3.6,7.6,1.7,2.3,1.1,4.1,2.8,5.4,5,1.4,2.2,2,4.9,2,8.1s-.7,5.8-2,8Z"></path> </g> </svg>`, // Company SVG logo

      // Staff placeholders
      ASSIGNED_STAFF_NAME:
        project.assigned_staff?.company_name ||
        `${project.assigned_staff?.first_name || ""} ${project.assigned_staff?.last_name || ""}`.trim() ||
        "Unassigned",
      ASSIGNED_STAFF_EMAIL: project.assigned_staff?.email || "No Email",
      ASSIGNED_STAFF_PHONE: project.assigned_staff?.phone || "No Phone",

      // Project details
      PROJECT_DESCRIPTION: project.description || "No Description",
      PROJECT_SQ_FT: project.sq_ft || 0,
      PROJECT_NEW_CONSTRUCTION: project.new_construction ? "Yes" : "No",

      // System URLs
      BASE_URL: url.origin,
      CONTRACT_URL: `${url.origin}/project/${projectId}`,
      BUTTON_LINK: `${url.origin}/project/${projectId}`,
      BUTTON_TEXT: statusData?.button_text || "View Project",

      // Dates
      CURRENT_DATE: new Date().toLocaleDateString(),
      CURRENT_DATETIME: new Date().toLocaleString(),
      PROJECT_CREATED_DATE: project.created_at
        ? new Date(project.created_at).toLocaleDateString()
        : "Unknown",

      // Additional project data
      PROJECT_ID: project.id,
      PROJECT_STATUS_CODE: project.status,
      PROJECT_BUILDING_DATA: project.building ? JSON.stringify(project.building) : "{}",
      PROJECT_SERVICE_DATA: project.service ? JSON.stringify(project.service) : "{}",
      PROJECT_REQUESTED_DOCS: project.requested_docs
        ? JSON.stringify(project.requested_docs)
        : "{}",

      // File information
      FILE_COUNT: files?.length || 0,
      LATEST_FILE: files && files.length > 0 ? files[0].file_name : "No Files",

      // Document metadata
      DOCUMENT_ID: `DOC-${projectId}-${Date.now()}`,
      DOCUMENT_VERSION: "1.0",
    };

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
