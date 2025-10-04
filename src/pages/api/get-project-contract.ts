import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../lib/api-optimization";
import { checkAuth } from "../../lib/auth";
import { replacePlaceholders } from "../../lib/placeholder-utils";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies, request }) => {
  try {
    // Get current user
    console.log("🔍 [GET-PROJECT-CONTRACT] Checking authentication...");
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      console.log("❌ [GET-PROJECT-CONTRACT] Authentication required");
      return createErrorResponse("Authentication required", 401);
    }

    const body = await request.json();
    const { projectData } = body;

    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return createErrorResponse("Project ID is required", 400);
    }

    if (!supabase) {
      return createErrorResponse("Database not configured", 500);
    }

    // Use the existing get-project API as single source of truth
    console.log("🔍 [GET-PROJECT-CONTRACT] Fetching project data for placeholders:", projectId);

    // const { data: project, error } = await supabase
    //   .from("projects")
    //   .select("id, title, contract_html")
    //   .eq("id", projectId)
    //   .single();

    // if (error) {
    //   console.error("❌ [GET-PROJECT-CONTRACT] Database error:", error);
    //   return createErrorResponse("Failed to fetch project contract", 500);
    // }

    // if (!project) {
    //   console.log("❌ [GET-PROJECT-CONTRACT] Project not found:", projectId);
    //   return createErrorResponse("Project not found", 404);
    // }

    // console.log("📄 [GET-PROJECT-CONTRACT] Project found:", {
    //   id: project.id,
    //   title: project.title,
    //   hasContractHtml: !!project.contract_html,
    //   contractLength: project.contract_html?.length || 0,
    //   contractPreview: project.contract_html?.substring(0, 100) + "...",
    // });

    const contractHtml = replacePlaceholders(projectData.contract_html, { project: projectData });

    return createSuccessResponse(
      {
        projectId: projectData.id,
        title: projectData.title,
        contractHtml: contractHtml,
        hasCustomContract: !!projectData.contract_html,
      },
      "Project contract retrieved successfully"
    );
  } catch (error) {
    console.error("❌ [GET-PROJECT-CONTRACT] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
